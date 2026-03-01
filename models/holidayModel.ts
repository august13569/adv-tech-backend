import { RowDataPacket } from 'mysql2';
import pool from '../config/db';

export interface Holiday {
    id: number;
    date: string;
    name: string;
    type: 'national' | 'makeup';
}

export const getByDate = async (date: string): Promise<boolean> => {
    const query = `
    SELECT
	    COUNT(*) AS count
    FROM
	    holidays
    WHERE
	    date = ?
    `
    const valuse = [date]

    const [rows] = await pool.execute<RowDataPacket[]>(query, valuse);
    return rows[0].count > 0;
}

/**
 * 當月假日日期、名稱
 * @param startDate 開始日期 yyyy-mm-dd
 * @param endDate 結束日期(不含) yyyy-mm-dd
 */
export const getByMonth = async (startDate: string, endDate: string): Promise<Holiday[]> => {
    const query = `
        SELECT
            date,
            name
        FROM
            holidays
        WHERE
            date >= ?
            AND date < ?
        ORDER BY
            date
    `
    const valuse = [startDate, endDate]

    const [rows] = await pool.execute<Holiday[] & RowDataPacket[]>(query, valuse);
    return rows;
}

export const getByDateRange = async (startDate: string, endDate: string): Promise<Holiday[]> => {
    const query = `
    SELECT
        *
    FROM
        holidays
    WHERE
        date BETWEEN ? AND ?
    `
    const valuse = [startDate, endDate]

    const [rows] = await pool.execute<(Holiday & RowDataPacket)[]>(query, valuse);
    return rows;
}

export const bulkInsert = async (holidays: Omit<Holiday, 'id'>[]): Promise<void> => {
    if (holidays.length === 0) return;

    const values = holidays.map(h => [h.date, h.name, h.type]);
    await pool.query(
        `INSERT INTO holidays (date, name, type) VALUES ?`,
        [values]
    );
}

export const deleteByYear = async (year: number): Promise<void> => {
    await pool.execute(
        `DELETE FROM holidays WHERE YEAR(date) = ?`,
        [year]
    );
}
