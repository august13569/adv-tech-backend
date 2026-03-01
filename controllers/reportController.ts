import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as scheduleService from '../services/scheduleService'
import { BusinessError, successResponse } from '../methods/apiResponse';
import { StatusCode } from '../constants/statusCodes';
import { parseValidatedYearMonth } from '../methods/validator'


/**
 * 取得當月值班人員班表
 * @param req 年月 yyyy-mm
 * @param res 當月班表
 * @param next 錯誤處理
 */
export const getShifts = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const { yearMonth } = req.query;

        // 驗證年月並回傳分開的數字型別
        const { yearNum, monthNum } = parseValidatedYearMonth(yearMonth)

        const shifts = await scheduleService.getMonthSchedule(yearNum, monthNum);
        return successResponse(res, StatusCode.REPORT_GENERATED, { shifts })
    } catch (error) {
        next(error);
    }
}

/**
 * 取得月和年度統計資料
 * @param req 年月 yyyy-mm
 * @param res 員工上班統計、排行
 * @param next 錯誤處理
 */
export const getStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const { yearMonth } = req.query;

        // 驗證年月並回傳分開的數字型別
        const { yearNum, monthNum } = parseValidatedYearMonth(yearMonth)

        const stats = await scheduleService.getStats(yearNum, monthNum);

        return successResponse(res, StatusCode.REPORT_GENERATED, { stats })
    } catch (error) {
        next(error);
    }
}
