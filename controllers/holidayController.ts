import { Request, Response, NextFunction } from 'express';
import * as holidayService from '../services/holidayService';
import { BusinessError, successResponse } from '../methods/apiResponse';
import { StatusCode } from '../constants/statusCodes';

/**
 * 取得當月假日
 * @param req 年月 yyyy-mm
 * @param res 當月假日
 * @param next 錯誤處理
 */
export const getHolidays = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const { yearMonth } = req.query;

        if (!yearMonth) {
            throw new BusinessError(StatusCode.MISSING_PARAMETERS, '請提供年月份')
        }

        if (typeof yearMonth !== 'string') {
            throw new BusinessError(StatusCode.INVALID_PARAMETERS, '請提供年月份')
        }

        // 驗證月份格式
        const dateMatch = yearMonth.match(/^(\d{4})-(\d{2})$/);
        if (!dateMatch) {
            throw new BusinessError(StatusCode.INVALID_DATE_FORMAT)
        }

        const yearNum = parseInt(dateMatch[1]);
        const monthNum = parseInt(dateMatch[2]);

        if (monthNum < 1 || monthNum > 12) {
            throw new BusinessError(StatusCode.INVALID_MONTH_RANGE)
        }

        const holidays = await holidayService.getHolidaysForMonth(yearNum, monthNum);
        return successResponse(res, StatusCode.HOLIDAYS_FETCHED, { holidays })
    } catch (error) {
        next(error);
    }
}
