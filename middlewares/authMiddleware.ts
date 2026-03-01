import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { BusinessError } from '../methods/apiResponse';
import { StatusCode } from '../constants/statusCodes';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: 'employee' | 'boss';
        name: string;
    };
}

/**
 * 檢查使用者授權
 * @param cookieName cookie名稱
 * @param req header中的cookie
 * @param res 錯誤訊息
 * @param next middleware或controller
 * @returns 檢查函數
 */
export const checkUserAuth = (cookieName: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {

            if (!req.headers.cookie) {
                throw new BusinessError(StatusCode.UNAUTHORIZED, '請登入或註冊後操作')
            }

            const cookies = req.headers.cookie.split('; ').find((row) => row.startsWith(`${cookieName}=`));
            const token = cookies ? cookies.split('=')[1] : null;

            if (!token) {
                throw new BusinessError(StatusCode.UNAUTHORIZED, '請登入或註冊後操作')
            }

            const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as any
            req.user = decodedToken;

            next();
        } catch (error) {
            throw new BusinessError(StatusCode.INVALID_TOKEN, '請登入或註冊後操作')
        }
    }
};

/**
 * 檢查使用者身分
 * @param role 身分名稱
 * @param req 使用者資料
 * @param res 錯誤訊息
 * @param next middleware或controller
 * @returns 檢查函數
 */
export const checkUserRole = (role: 'employee' | 'boss') => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new BusinessError(StatusCode.INVALID_TOKEN, '請登入或註冊後操作')
        }

        if (req.user.role !== role) {
            throw new BusinessError(StatusCode.INSUFFICIENT_PERMISSIONS, '權限不足')
        }

        next();
    };
};
