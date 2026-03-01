import cron from 'node-cron';
import * as holidayService from '../services/holidayService'

export async function initHolidaySync() {
    // 每年 11月1日 凌晨 00:00 執行
    // 格式: 秒 分 時 日 月 星期
    cron.schedule('0 0 1 11 *', async () => {
        console.log('開始同步假日資料...');

        try {
            const currentYear = new Date().getFullYear();
            const nextYear = currentYear + 1;

            // 同步明年的假日資料
            await holidayService.updateHolidaysFromAPI(nextYear);

            console.log(`${nextYear} 年假日資料同步完成`);
        } catch (error) {
            console.error('假日資料同步失敗:', error);
        }
    });

    console.log('假日同步排程已啟動 (每年11月1日 00:00執行)');
}

// 手動觸發同步 (用於初始化或測試)
export async function manualSyncHolidays() {
    console.log('手動同步假日資料...');

    try {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;

        // 同步當年和明年的假日資料
        await holidayService.updateHolidaysFromAPI(currentYear);
        await holidayService.updateHolidaysFromAPI(nextYear);

        console.log('假日資料同步完成');
    } catch (error) {
        console.error('假日資料同步失敗:', error);
    }
}