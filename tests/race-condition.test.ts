import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app'; // 確保你的 app 已經匯出且沒有啟動 listen
import pool from '../config/db';

describe('Race Condition Test - Schedule Shift (排班競爭測試)', () => {
    // 1. 定義 Cookie 為字串型別並初始化
    let cookie1: string = '';
    let cookie2: string = '';
    let cookie3: string = '';

    // 手動指定測試日期
    const testDate = '2026-02-11';

    beforeAll(async () => {
        // 確保資料庫連線正常
        await pool.query('SELECT 1');

        /**
         * 登入輔助函式：處理 HttpOnly Cookie 提取與 TypeScript 型別安全
         */
        const loginAndGetCookie = async (e_id: string): Promise<string> => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ e_id: e_id, password: '123456' });

            // res.get('Set-Cookie') 回傳 string[] | undefined
            const rawCookies = res.get('Set-Cookie');

            if (!rawCookies) {
                throw new Error(`無法從員工 ${e_id} 的登入回應中取得 Cookie`);
            }

            // 將陣列轉為單一字串，這是傳送 Cookie 的正確格式
            return rawCookies.join('; ');
        };

        // 並行登入三個測試員工
        [cookie1, cookie2, cookie3] = await Promise.all([
            loginAndGetCookie('EMP001'),
            loginAndGetCookie('EMP002'),
            loginAndGetCookie('EMP003')
        ]);
    });

    afterAll(async () => {
        // 重要：關閉資料庫連線池，否則測試結束後 Process 會卡住
        await pool.end();
    });

    beforeEach(async () => {
        // 每次測試前清理該日期的排班記錄，確保測試環境純淨
        await pool.query('DELETE FROM schedules WHERE shift_date = ?', [testDate]);
    });

    it('應該只允許一個員工排班成功 (當剩餘名額僅剩 1 個時)', async () => {
        // === 階段 1：建立基礎資料 ===
        // 先讓員工 1 排班，假設該日上限是 2 人，此時剩餘 1 個名額
        const firstResponse = await request(app)
            .post('/api/schedule/shift')
            .set('Cookie', cookie1) // 帶入 HttpOnly Cookie
            .send({ shift_date: testDate });

        expect(firstResponse.status).toBe(201);
        expect(firstResponse.body.code).toBe(31000);

        // 驗證 DB 初始狀態
        const [initialRows] = await pool.query<any[]>(
            'SELECT COUNT(*) as count FROM schedules WHERE shift_date = ?',
            [testDate]
        );
        expect(initialRows[0].count).toBe(1);

        // === 階段 2：模擬並發競爭 (Race Condition) ===
        // 員工 2 與 員工 3 同時發送請求搶奪最後一個位置
        const [res2, res3] = await Promise.all([
            request(app)
                .post('/api/schedule/shift')
                .set('Cookie', cookie2)
                .send({ shift_date: testDate }),
            request(app)
                .post('/api/schedule/shift')
                .set('Cookie', cookie3)
                .send({ shift_date: testDate })
        ]);

        // === 階段 3：驗證結果 ===
        const responses = [res2, res3];
        const successfulOnes = responses.filter(r => r.status === 201);
        const failedOnes = responses.filter(r => r.status === 400);

        // 核心斷言：即便同時請求，也必須是一成一敗
        expect(successfulOnes.length).toBe(1);
        expect(failedOnes.length).toBe(1);

        // 驗證失敗的錯誤訊息與代碼
        expect(failedOnes[0].body.code).toBe(34004);
        expect(failedOnes[0].body.message).toBe('該日已有2位員工排班');

        // === 階段 4：資料庫最終一致性檢查 ===
        const [finalRows] = await pool.query<any[]>(
            'SELECT employee_id FROM schedules WHERE shift_date = ?',
            [testDate]
        );

        // 確保資料庫裡只有 2 筆資料（員工 1 + 員工 2 或 3）
        expect(finalRows.length).toBe(2);

        const savedEmployeeIds = finalRows.map(row => row.employee_id);
        // 假設員工 1 的 ID 是 2 (依據你的資料庫實際狀況調整)
        expect(savedEmployeeIds).toContain(2);
    });
});