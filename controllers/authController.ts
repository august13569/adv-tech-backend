import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt'
import * as authService from '../services/authService'
import { isValidEmployeeId } from '../methods/validator';
import { AuthRequest } from '../middlewares/authMiddleware'
import { BusinessError, successResponse } from '../methods/apiResponse';
import { StatusCode } from '../constants/statusCodes'


type Role = 'boss' | 'employee'
const ROLE_MAP: Record<string, Role> = {
    BOSS: 'boss',
    EMP: 'employee'
}

const getRole = (eId: string): Role => {
    const prefix = eId.match(/^[A-Z]+/)?.[0] || ''
    return ROLE_MAP[prefix] || 'employee'
}


/**
 * 登入
 * @param req 員工編號、密碼
 * @param res 設token至cookie、使用者資料
 * @param next 錯誤處理
 */
export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        // 前端的資料
        const { e_id, password } = req.body;

        // 是否填寫必填欄位
        if (!e_id || !password) {
            throw new BusinessError(StatusCode.MISSING_PARAMETERS, '請提供員工編號和密碼');
        }

        // 檢查格式是否正確
        if (typeof e_id !== 'string' || typeof password !== 'string') {
            throw new BusinessError(StatusCode.INVALID_PARAMETERS, '登入資訊格式不正確');
        }

        if (!isValidEmployeeId(e_id)) {
            throw new BusinessError(StatusCode.INVALID_PARAMETERS, '員編格式不正確')
        }

        // 取得使用者資料
        const result = await authService.login(e_id, password);

        // token放置cookie
        res.cookie('realHexToken', result.token, {
            httpOnly: true,
            secure: false,
            maxAge: 3600000 * 24, // 24 小時 (毫秒)
            path: '/'
        })

        return successResponse(res, StatusCode.LOGIN_SUCCESS, { user: result.user })
    } catch (error) {
        next(error);
    }
}

/**
 * 登出
 * @param req 
 * @param res 清除前端cookie、登出訊息
 * @param next 錯誤處理
 */
export const logout = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        res.clearCookie('realHexToken', {
            httpOnly: true,
            secure: false,
            path: '/'
        })

        return successResponse(res, StatusCode.LOGOUT_SUCCESS)
    } catch (error) {
        next(error);
    }
}

/**
 * 註冊帳號
 * @param req 註冊資料
 * @param res 成功訊息
 * @param next 錯無處理
 */
export const signup = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        // 前端的資料
        const rawData = { ...req.body }

        // 處理字串空白鍵
        Object.keys(rawData).forEach(key => {
            if (typeof rawData[key] === 'string') {
                rawData[key] = rawData[key].replace(/\s/g, '')
            }
        })

        const { e_id, password, name } = rawData

        // 是否填寫必填欄位
        if (!e_id || !password || !name) {
            throw new BusinessError(StatusCode.MISSING_PARAMETERS, '請輸入編號、密碼、姓名')
        }

        // 檢查格式是否正確
        if (typeof e_id !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
            throw new BusinessError(StatusCode.INVALID_PARAMETERS, '註冊資訊格是不正確')
        }

        if (!isValidEmployeeId(e_id)) {
            throw new BusinessError(StatusCode.INVALID_PARAMETERS, '員編格式不正確')
        }

        // 辨識註冊身分
        const role: string = getRole(e_id)

        // 密碼雜湊
        const salt = await bcrypt.genSalt(10); // 生成鹽值
        const hashedPassword = await bcrypt.hash(password, salt); // 雜湊密碼

        // 寫入資料庫
        await authService.signup(e_id, hashedPassword, name, role)

        // 回傳註冊成功
        return successResponse(res, StatusCode.SIGNUP_SUCCESS)
    } catch (error) {
        next(error);
    }
}

/**
 * token身分驗證
 * @param req decodeToken資料
 * @param res 使用者資料
 * @param next 錯誤處理
 */
export const role = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        return successResponse(res, StatusCode.VALID_TOKEN, { user: req.user })
    } catch (error) {
        next(error)
    }
};
