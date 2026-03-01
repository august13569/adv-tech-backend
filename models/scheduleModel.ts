import { RowDataPacket, ResultSetHeader, Connection } from 'mysql2/promise';
import pool from '../config/db';

export interface Schedule {
    e_id: string
    employee_id: number;
    name: string;
    shift_date: string;
}

/**
 * 加入排班
 * @param connection 事務交易
 * @param employee_id 員工編號
 * @param shift_date 日期 yyyy-dmm-dd
 */
export const addShift = async (
    connection: Connection,
    employee_id: number,
    shift_date: string
): Promise<number> => {
    const query = `
        INSERT INTO schedules (employee_id, shift_date) VALUES (?, ?)
    `
    const valuse = [employee_id, shift_date]

    const [result] = await connection.execute<ResultSetHeader>(query, valuse);
    return result.insertId;
}

/**
 * 取消排班
 * @param employee_id 員工編號
 * @param shift_date 日期 yyyy-dmm-dd
 */
export const removeShift = async (employee_id: number, shift_date: string): Promise<boolean> => {
    const query = `
        DELETE FROM schedules WHERE employee_id = ? AND shift_date = ?
    `
    const valuse = [employee_id, shift_date]

    const [result] = await pool.execute<ResultSetHeader>(query, valuse);
    return result.affectedRows > 0;
}

/**
 * 計算當日排班人數 (x鎖)
 * @param connection 事務交易
 * @param shift_date 日期 yyyy-mm-dd
 */
export const countByDateWithLock = async (connection: Connection, shift_date: string): Promise<number> => {
    const query = `
        SELECT
            COUNT(*) as count
        FROM
            schedules
        WHERE
            shift_date = ?
        FOR UPDATE
    `
    const valuse = [shift_date]

    const [rows] = await connection.execute<RowDataPacket[]>(query, valuse);
    return rows[0].count;
}

/**
 * 計算該員工當月已排班天數
 * @param connection 事務交易
 * @param employee_id 員工編號
 * @param firstDay 本月第一天
 * @param lastDay 本月最後一天
 */
export const countEmployeeMonthWithLock = async (
    connection: Connection,
    employee_id: number,
    firstDay: string,
    lastDay: string
): Promise<number> => {
    const query = `
        SELECT
            COUNT(*) as count
        FROM
            schedules
        WHERE
            employee_id = ?
            AND shift_date >= ? 
            AND shift_date <= ?
        FOR UPDATE
    `
    const valuse = [employee_id, firstDay, lastDay]

    const [rows] = await connection.execute<RowDataPacket[]>(query, valuse);
    return rows[0].count;
}

export const countByEmployeeYear = async (employee_id: number, year: number): Promise<number> => {
    const query = `
    SELECT
        COUNT(*) as count
    FROM
        schedules
    WHERE
        employee_id = ?
        AND YEAR(shift_date) = ?
    `
    const valuse = [employee_id, year]

    const [rows] = await pool.execute<RowDataPacket[]>(query, valuse);
    return rows[0].count;
}

/**
 * 當月班表
 * @param startDate 開始日期 yyyy-mm-dd
 * @param endDate 結束日期(不含) yyyy-mm-dd
 */
export const getByMonth = async (startDate: string, endDate: string): Promise<Schedule[]> => {
    const query = `
        SELECT
            s.shift_date,
            s.employee_id,
            u.name,
            u.e_id
        FROM
            schedules AS s
        JOIN
            users AS u ON s.employee_id = u.id
        WHERE
            s.shift_date >= ?
            AND s.shift_date < ?
        ORDER BY
            s.shift_date,
            u.name
    `
    const valuse = [startDate, endDate]

    const [rows] = await pool.execute<Schedule[] & RowDataPacket[]>(query, valuse);
    return rows;
}

export const exists = async (employee_id: number, shift_date: string): Promise<boolean> => {
    const query = `
    SELECT
        1
    FROM
        schedules
    WHERE
        employee_id = ?
        AND shift_date = ?
    `
    const valuse = [employee_id, shift_date]

    const [rows] = await pool.execute<RowDataPacket[]>(query, valuse);
    return rows.length > 0;
}

/**
 * 員工是否已排班 (x鎖)
 * @param connection 事務交易 
 * @param employee_id 員工編號
 * @param shift_date 日期 yyyy-mm-dd
 */
export const existsWithLock = async (
    connection: Connection,
    employee_id: number,
    shift_date: string
): Promise<boolean> => {
    const query = `
        SELECT
            1
        FROM
            schedules
        WHERE
            employee_id = ?
            AND shift_date = ?
        FOR UPDATE
    `
    const valuse = [employee_id, shift_date]

    const [rows] = await connection.execute<RowDataPacket[]>(query, valuse);
    return rows.length > 0;
}

/**
 * 該月員工上班天數
 * @param startDate 開始日期 yyyy-mm-dd
 * @param endDate 結束日期(不含) yyyy-mm-dd
 * @returns id、姓名、編號、天數
 */
export const getMonthlyStats = async (startDate: string, endDate: string): Promise<any[]> => {
    const query = `
        SELECT
            u.id,
            u.name,
            u.e_id,
            COUNT(s.id) as days_worked
        FROM
            users AS u
        LEFT JOIN
            schedules AS s
            ON u.id = s.employee_id
            AND s.shift_date >= ? 
            AND s.shift_date < ?
        WHERE
            u.role = 'employee'
            AND u.is_active = 1
        GROUP BY
            u.id
        ORDER BY
            days_worked DESC,
            u.name
    `
    const valuse = [startDate, endDate]

    const [rows] = await pool.execute<RowDataPacket[]>(query, valuse);
    return rows;
}

/**
 * 當年員工上班天數
 * @param startDate 開始日期 yyyy-mm-dd
 * @param endDate 結束日期(不含) yyyy-mm-dd
 * @returns id、姓名、編號、天數
 */
export const getYearlyStats = async (startDate: string, endDate: string): Promise<any[]> => {
    const query = `
        SELECT
            u.id,
            u.name,
            u.e_id,
            COUNT(s.id) as days_worked
        FROM
            users AS u
        LEFT JOIN
            schedules AS s
            ON u.id = s.employee_id
            AND s.shift_date >= ?
            AND s.shift_date <  ?
        WHERE
            u.role = 'employee'
            AND u.is_active = 1
        GROUP BY
            u.id
        ORDER BY
            u.name
    `
    const valuse = [startDate, endDate]

    const [rows] = await pool.execute<RowDataPacket[]>(query, valuse);
    return rows;
}

