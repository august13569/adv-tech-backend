import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes'
import { errorHandler } from './middlewares/errorHandler';
import { initHolidaySync, manualSyncHolidays } from './jobs/holidaySync';

const PORT = process.env.PORT || 3000;

dotenv.config();
const app = express();

const corsOptions = [
    'http://localhost:5173'
]

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: corsOptions,
    credentials: true
}));

app.use('/api', apiRoutes)
app.use(errorHandler)

// for testing
// export default app;

app.listen(PORT, async () => {
    console.log(`🚀 伺服器啟動成功！運行於: http://localhost:${PORT}`);

    try {
        // A. 啟動排程 (註冊 11/1 的任務)
        // await initHolidaySync();

        // B. 立即執行一次檢查 (確保伺服器重啟或新部署時資料是最新的)
        // await manualSyncHolidays();

    } catch (error) {
        console.error('初始化服務失敗:', error);
    }
});
