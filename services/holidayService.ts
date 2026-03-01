import axios from 'axios';
import pool from '../config/db';
import * as holidayModel from '../models/holidayModel'
import { toYYYYMMDD } from '../methods/helper';
import { Holiday } from '../models/holidayModel';

interface RawGovernmentHoliday {
    date: string;               // "20251024"
    year: string;               // "2025"
    name: string | null;        // 假日名稱 | null
    isholiday: '是' | '否';     // "是" | "否"
    holidaycategory: string;    // 例如: "補假"、"星期六、星期日"、"補行上班日"
    description: string | null; // 詳細備註 | null
}


export const isHoliday = async (date: string): Promise<boolean> => {
    return holidayModel.getByDate(date);
}

/**
 * 取得指定月份的假日列表(含週末)
 * @param year 年 yyyy
 * @param month 月 mm
 * @returns 
 */
export const getHolidaysForMonth = async (year: number, month: number): Promise<Holiday[]> => {
    const firstDayThisMonth = toYYYYMMDD(new Date(year, month - 1, 1)); // 本月第一天
    const firstDayNextMonth = toYYYYMMDD(new Date(year, month, 1));  // 下個月第一天

    return await holidayModel.getByMonth(firstDayThisMonth, firstDayNextMonth);
}


// 從政府開放資料更新假日資料
export const updateHolidaysFromAPI = async (year: number): Promise<void> => {
    const connection = await pool.getConnection();

    try {
        // 取得台灣政府行事曆 API
        const result = await getAllHolidays()

        const holidays: any[] = [];

        // 轉換格式與判定假日
        if (result && Array.isArray(result)) {
            for (const item of result) {
                if (item.date && item.date.startsWith(String(year)) && item.isholiday === '是') {
                    holidays.push({
                        date: `${item.date.substring(0, 4)}-${item.date.substring(4, 6)}-${item.date.substring(6, 8)}`, // yyyy-mm-dd
                        name: item.name || handleWeekend(item.date, item.holidaycategory) || '國定假日',
                        type: item.holidaycategory === '補假' ? 'makeup' : 'national'
                    });
                }
            }
        }

        // 假日為空陣列
        if (holidays.length === 0) {
            throw new Error(`${year} 年 API 回傳資料為空`);
        }

        // 如果 API 無法使用，使用預設的假日資料
        // if (holidays.length === 0) {
        //   holidays.push(...getDefaultHolidays(year));
        // }

        // 清除舊資料並插入新資料
        await connection.beginTransaction();

        await holidayModel.deleteByYear(year);
        await holidayModel.bulkInsert(holidays);

        await connection.commit();
        console.log(`${year} 年假日資料更新完成，共 ${holidays.length} 筆`);
    } catch (error) {
        await connection.rollback();
        console.error('更新假日資料失敗:', error);
        // 如果 API 失敗，使用預設假日資料
        // const defaultHolidays = getDefaultHolidays(year);
        // await holidayModel.bulkInsert(defaultHolidays);
    } finally {
        connection.release();
    }
}

async function getAllHolidays(): Promise<RawGovernmentHoliday[]> {
    let allHolidays: any[] = [];
    let page = 0;
    const size = 1000;
    let keepFetching = true;

    while (keepFetching) {
        console.log(`正在抓取第 ${page} 頁資料...`);
        const response = await axios.get(
            `https://data.ntpc.gov.tw/api/datasets/308DCD75-6434-45BC-A95F-584DA4FED251/json?page=${page}&size=${size}`,
        );

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            allHolidays = [...allHolidays, ...response.data];
            page++;
        } else {
            keepFetching = false;
        }
    }

    return allHolidays;
};

function handleWeekend(date: string, name: string): string {
    if (name !== '星期六、星期日') return name

    const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    const dateObj = new Date(formattedDate);
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek === 0) return '星期日'
    if (dayOfWeek === 6) return '星期六'
    return ''
}
