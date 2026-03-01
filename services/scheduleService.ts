import * as scheduleModel from '../models/scheduleModel'
import * as holidayService from '../services/holidayService'
import pool from '../config/db';
import { toYYYYMMDD } from '../methods/helper';
import { BusinessError } from '../methods/apiResponse';
import { StatusCode } from '../constants/statusCodes';


export interface ScheduleEmployee {
    employee_id: number;
    name: string;
    e_id: string;
}

export interface MonthlySchedule {
    date: string;
    employees: ScheduleEmployee[];
}

/**
 * 驗證排班規則
 * @param employeeId 員工編號
 * @param shiftDate 排班日期 yyyy-mm-dd
 */
export const validateShiftRules = async (employeeId: number, shiftDate: string): Promise<void> => {
    const date = new Date(shiftDate);
    const now = new Date();

    // 計算下個月
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    // 檢查是否為下個月
    if (date < nextMonth || date > nextMonthEnd) {
        throw new Error('只能排下個月的班');
    }

    // 檢查是否為假日(含週末)
    const isHoliday = await holidayService.isHoliday(shiftDate);
    if (isHoliday) {
        throw new Error('週六、週日、國定假日不可排班');
    }
}

/**
 * 新增排班
 * @param employeeId 員工編號
 * @param shiftDate 排班日期 yyyy-mm-dd
 */
export const addShift = async (employeeId: number, shiftDate: string): Promise<number> => {
    // 是否符合排班規則
    await validateShiftRules(employeeId, shiftDate);

    const connection = await pool.getConnection()
    try {
        // 開始事務
        await connection.beginTransaction();

        // 檢查員工是否已排該日
        const alreadyScheduled = await scheduleModel.existsWithLock(connection, employeeId, shiftDate);
        if (alreadyScheduled) {
            throw new BusinessError(StatusCode.SHIFT_ALREADY_EXISTS)
        }

        // 檢查該日是否已有2人排班
        const countOnDate = await scheduleModel.countByDateWithLock(connection, shiftDate);
        if (countOnDate >= 2) {
            throw new BusinessError(StatusCode.SHIFT_DATE_FULL)
        }

        // 檢查員工該月排班天數
        const date = new Date(shiftDate);
        const firstDay = toYYYYMMDD(new Date(date.getFullYear(), date.getMonth(), 1)); // 第一天：直接將日期設為 1 號
        const lastDay = toYYYYMMDD(new Date(date.getFullYear(), date.getMonth() + 1, 0)); // 最後一天：下個月的第 0 天，就是這個月的最後一天

        const monthCount = await scheduleModel.countEmployeeMonthWithLock(connection, employeeId, firstDay, lastDay);

        if (monthCount >= 15) {
            throw new BusinessError(StatusCode.SHIFT_MONTH_MAX_EXCEEDED)
        }

        // 寫入排班表
        const insertId = await scheduleModel.addShift(connection, employeeId, shiftDate);

        // 提交並回傳
        await connection.commit();
        return insertId
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 驗證取消排班規則
 * @param shiftDate 排班日期 yyyy-mm-dd
 */
export const validateRemoveRules = async (shiftDate: string): Promise<void> => {
    const date = new Date(shiftDate);
    const now = new Date();

    // 計算下個月
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    // 檢查是否為下個月
    if (date < nextMonth || date > nextMonthEnd) {
        throw new BusinessError(StatusCode.SHIFT_DATE_OUT_OF_RANGE, '只能取消下個月的班')
    }
}

/**
 * 取消排班
 * @param employeeId 
 * @param shiftDate 
 */
export const removeShift = async (employeeId: number, shiftDate: string): Promise<void> => {
    await validateRemoveRules(shiftDate);

    const connection = await pool.getConnection()
    try {
        const exists = await scheduleModel.existsWithLock(connection, employeeId, shiftDate);
        if (!exists) {
            throw new BusinessError(StatusCode.SHIFT_NOT_FOUND)
        }

        const deleted = await scheduleModel.removeShift(employeeId, shiftDate);
        if (!deleted) {
            throw new BusinessError(StatusCode.SHIFT_CONCURRENT_CONFLICT, '取消排班失敗')
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 取得當月上班人員
 * @param year 年 yyyy
 * @param month 月 mm
 * @return 日期、員工
 */
export const getMonthSchedule = async (year: number, month: number): Promise<MonthlySchedule[]> => {
    const firstDayThisMonth = toYYYYMMDD(new Date(year, month - 1, 1)); // 本月第一天
    const firstDayNextMonth = toYYYYMMDD(new Date(year, month, 1));  // 下個月第一天

    const schedules = await scheduleModel.getByMonth(firstDayThisMonth, firstDayNextMonth);

    // 按日期分組
    const grouped: { [date: string]: any[] } = {};

    for (const schedule of schedules) {
        const date = schedule.shift_date;
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push({
            employee_id: schedule.employee_id,
            name: schedule.name,
            e_id: schedule.e_id
        });
    }

    // 轉換為陣列格式
    const result = Object.keys(grouped).sort().map(date => ({
        date,
        employees: grouped[date]
    }));

    return result;
}

/**
 * 取得統計資料
 * @param year 年 yyyy
 * @param month 月 mm
 * @returns 年度、月排行與統計
 */
export const getStats = async (year: number, month: number): Promise<any> => {
    // 取得月排行榜
    const firstDayThisMonth = toYYYYMMDD(new Date(year, month - 1, 1)); // 本月第一天
    const firstDayNextMonth = toYYYYMMDD(new Date(year, month, 1));  // 下個月第一天
    const monthlyStats = await scheduleModel.getMonthlyStats(firstDayThisMonth, firstDayNextMonth);

    // 取得年度總計
    const firstDayOfThisYear = toYYYYMMDD(new Date(year, 0, 1)); // 今年第一天
    const firstDayOfNextYear = toYYYYMMDD(new Date(year + 1, 0, 1)); // 明年第一天
    const yearlyStats = await scheduleModel.getYearlyStats(firstDayOfThisYear, firstDayOfNextYear);

    return {
        ranking: monthlyStats.map((stat, index) => ({
            rank: index + 1,
            employee_id: stat.id,
            name: stat.name,
            e_id: stat.e_id,
            days_worked: stat.days_worked
        })),
        total_workdays_year: yearlyStats.map(stat => ({
            employee_id: stat.id,
            name: stat.name,
            e_id: stat.e_id,
            days_worked: stat.days_worked
        }))
    };
}

