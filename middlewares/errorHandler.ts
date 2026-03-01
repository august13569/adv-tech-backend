import { Request, Response, NextFunction } from 'express'
import { BusinessError, errorResponse } from '../methods/apiResponse'
import { StatusCode } from '../constants/statusCodes'

export const errorHandler = (
    err: Error | BusinessError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('錯誤:', err)

    // 如果是業務邏輯錯誤
    if (err instanceof BusinessError) {
        return errorResponse(res, err.code, err.message)
    }

    // 如果是 JWT 相關錯誤
    if (err.name === 'JsonWebTokenError') {
        return errorResponse(res, StatusCode.INVALID_TOKEN)
    }

    if (err.name === 'TokenExpiredError') {
        return errorResponse(res, StatusCode.TOKEN_EXPIRED)
    }

    // 資料庫錯誤
    if (err.message && err.message.includes('ECONNREFUSED')) {
        return errorResponse(res, StatusCode.DATABASE_ERROR, '資料庫連線失敗')
    }

    // 其他未知錯誤
    return errorResponse(
        res,
        StatusCode.INTERNAL_ERROR,
        '伺服器內部錯誤',
        process.env.NODE_ENV === 'development' ? err.message : undefined
    )
}
