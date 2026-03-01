import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as scheduleService from '../services/scheduleService'
import * as holidayService from '../services/holidayService'
import { isValidDateFormat, parseValidatedYearMonth } from '../methods/validator';
import { BusinessError, errorResponse, successResponse } from '../methods/apiResponse';
import { StatusCode } from '../constants/statusCodes';


/**
 * 新增排班
 * @param req 日期 yyyy-mm-dd、員工編號
 * @param res 成功訊息
 * @param next 錯誤處理
 */
export const addShift = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        // 前端的資料
        const { shift_date } = req.body;
        const employeeId = req.user!.id;

        // 是否提供日期
        if (!shift_date) {
            throw new BusinessError(StatusCode.MISSING_PARAMETERS, '請提供排班日期')
        }

        // 驗證日期格式
        if (!isValidDateFormat(shift_date) || typeof shift_date !== 'string') {
            throw new BusinessError(StatusCode.INVALID_PARAMETERS, '日期格式錯誤')
        }

        // 寫入排班資料庫
        await scheduleService.addShift(employeeId, shift_date);

        return successResponse(res, StatusCode.SHIFT_ADDED)
    } catch (error) {
        next(error);
    }
}

/**
 * 取消排班
 * @param req 日期 yyyy-mm-dd、員工編號
 * @param res 成功訊息
 * @param next 錯誤處理
 */
export const removeShift = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        // 前端資料
        const { shift_date } = req.body;
        const employeeId = req.user!.id;

        // 是否提供日期
        if (!shift_date) {
            throw new BusinessError(StatusCode.MISSING_PARAMETERS, '請提供排班日期')
        }

        // 驗證日期格式
        if (!isValidDateFormat(shift_date) || typeof shift_date !== 'string') {
            throw new BusinessError(StatusCode.INVALID_PARAMETERS, '日期格式錯誤')
        }

        // 刪除排班
        await scheduleService.removeShift(employeeId, shift_date);

        return successResponse(res, StatusCode.SHIFT_ADDED)
    } catch (error) {
        next(error);
    }
}

/**
 * 該員當月工行事曆
 * @param req 年月 yyyy-mm
 * @param res 員工當月行事曆
 * @param next 錯誤處理
 */
export const getShifts = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        // 前端資料
        const { yearMonth } = req.query;

        const { yearNum, monthNum } = parseValidatedYearMonth(yearMonth)

        // 取得伺服器當前時間的年、月
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // getMonth 0-11，所以要 +1

        // 計算理論上的「下個月」應該是哪一年哪一月
        // 利用 Date 自動進位的特性：如果 currentMonth 是 12，這會變成明年的 1 月
        const nextMonthDate = new Date(currentYear, currentMonth, 1);
        const targetYear = nextMonthDate.getFullYear();
        const targetMonth = nextMonthDate.getMonth() + 1;

        // 比對傳入的值是否等於目標下個月
        if (yearNum !== targetYear || monthNum !== targetMonth) {
            throw new BusinessError(
                StatusCode.SHIFT_DATE_OUT_OF_RANGE,
                `目前僅開放預約 ${targetYear}-${String(targetMonth).padStart(2, '0')} 的班表`
            );
        }

        // 取得本月假日
        const holidays = await holidayService.getHolidaysForMonth(yearNum, monthNum);
        const holidayMap = new Map(holidays.map(h => [h.date, h.name]));

        // 取得本月班表
        const schedules = await scheduleService.getMonthSchedule(yearNum, monthNum);
        const scheduleMap = new Map(schedules.map(s => [s.date, s.employees]));

        // 取得本月日期
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        const result = []
        for (let day = 1; day <= daysInMonth; day++) {
            // 格式化為 YYYY-MM-DD (補零處理)
            const dateString = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // 判斷當前日期是否在假日表（包含六日）中
            const holidayName = holidayMap.get(dateString);

            // 取得當天上班人員
            const shiftEmployees = scheduleMap.get(dateString) || [];

            // 產生該日物件
            result.push({
                date: dateString,
                isHoliday: !!holidayName, // 只要 holidayMap 有值就是假日
                holidayName: holidayName || null,
                shifts: shiftEmployees // 預留給排班資訊
            });
        }

        return successResponse(res, StatusCode.SUCCESS, { schedule: result })
    } catch (error) {
        next(error);
    }
}
