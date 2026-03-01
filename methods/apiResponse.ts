// src/utils/responseHelper.ts
import { Response } from 'express'
import { StatusCode, getStatusMessage } from '../constants/statusCodes'

/**
 * 統一的 API 回應格式
 */
export interface ApiResponse<T = any> {
    code: StatusCode        // 業務狀態碼
    message: string         // 訊息
    data?: T               // 資料 (成功時)
    error?: string         // 錯誤詳情 (失敗時)
}

/**
 * 成功回應
 */
export function successResponse<T = any>(
    res: Response,
    code: StatusCode = StatusCode.SUCCESS,
    data?: T,
    customMessage?: string
): Response {
    const message = customMessage || getStatusMessage(code)

    const response: ApiResponse<T> = {
        code,
        message,
        ...data
    }

    return res.status(getHttpStatus(code)).json(response)
}

/**
 * 錯誤回應
 */
export function errorResponse(
    res: Response,
    code: StatusCode,
    customMessage?: string,
    errorDetail?: string
): Response {
    const message = customMessage || getStatusMessage(code)

    const response: ApiResponse = {
        code,
        message,
        ...(errorDetail && { error: errorDetail })
    }

    return res.status(getHttpStatus(code)).json(response)
}

/**
 * 根據業務狀態碼取得 HTTP 狀態碼
 */
function getHttpStatus(code: StatusCode): number {
    const codeStr = code.toString()
    const typeDigit = codeStr[1] // 第二位數字

    switch (typeDigit) {
        case '0': // 成功
            return 200
        case '1': // 創建成功
            return 201
        case '4': // 客戶端錯誤
            if (code === StatusCode.UNAUTHORIZED || code === StatusCode.INVALID_TOKEN) {
                return 401
            }
            if (code === StatusCode.INSUFFICIENT_PERMISSIONS) {
                return 403
            }
            if (code === StatusCode.USER_NOT_FOUND || code === StatusCode.SHIFT_NOT_FOUND) {
                return 404
            }
            return 400
        case '5': // 伺服器錯誤
            return 500
        default:
            return 200
    }
}

/**
 * 業務邏輯錯誤類別
 * 用於在 Service 層拋出帶有狀態碼的錯誤
 */
export class BusinessError extends Error {
    constructor(
        public code: StatusCode,
        message?: string
    ) {
        super(message || getStatusMessage(code))
        this.name = 'BusinessError'
    }
}