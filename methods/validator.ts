import { BusinessError } from "./apiResponse";
import { StatusCode } from "../constants/statusCodes";

/**
 * 驗證員工編號格式
 * 格式要求：BOSS + 3位數字 或 EMP + 3位數字 (例如: BOSS001, EMP123)
 */
export const isValidEmployeeId = (e_id: string): boolean => {
    const regex = /^(BOSS|EMP)\d{3}$/;
    return regex.test(e_id);
};

export const isValidDateFormat = (date: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(date);
};

export const parseValidatedYearMonth = (yearMonth: unknown) => {
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

    return { yearNum, monthNum }
}
