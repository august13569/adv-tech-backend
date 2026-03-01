import { RowDataPacket } from 'mysql2';
import pool from '../config/db';
import { BusinessError } from '../methods/apiResponse';
import { StatusCode } from '../constants/statusCodes';

export interface User {
    id: number;
    e_id: string;
    password: string;
    name: string;
    role: 'employee' | 'boss';
    is_active: number;
    created_at: Date;
    updated_at: Date;
}

export const findByEid = async (e_id: string): Promise<User | null> => {
    const query = `
    SELECT
        *
    FROM
        users
    WHERE
        e_id = ?
        AND is_active = 1
    `
    const values = [e_id]

    const [rows] = await pool.execute<(User & RowDataPacket)[]>(query, values);
    return rows[0] || null;
}


export const findById = async (id: number): Promise<User | null> => {
    const query = `
    SELECT
        *
    FROM
        users
    WHERE
        id = ?
        AND is_active = 1
    `
    const values = [id]

    const [rows] = await pool.execute<(User & RowDataPacket)[]>(query, values);
    return rows[0] || null;
}

export const getAllEmployees = async (): Promise<User[]> => {
    const query = `
    SELECT
        id,
        e_id,
        name
    FROM
        users
    WHERE
        role = ?
        AND is_active = 1
    `
    const values = ['employee']

    const [rows] = await pool.execute<(User & RowDataPacket)[]>(query, values);
    return rows;
}

export const register = async (e_id: string, password: string, name: string, role: string): Promise<void> => {
    const query = `
        INSERT INTO users (e_id, password, name, role) VALUES (?, ?, ?, ?)
    `
    const values = [e_id, password, name, role]
    try {
        await pool.execute(query, values)
    } catch (error: any) {

        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            throw new BusinessError(StatusCode.SIGNUP_FAILED, '員工編號已重複')
        }

        // 其他未預期的資料庫錯誤
        throw new BusinessError(StatusCode.DATABASE_ERROR, '系統暫時發生問題，請重新嘗試')
    }

}
