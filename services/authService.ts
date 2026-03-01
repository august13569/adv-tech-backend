import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import * as userModel from '../models/userModel'
import { BusinessError, successResponse } from '../methods/apiResponse';
import { StatusCode } from '../constants/statusCodes'

// 登出
export const login = async (e_id: string, password: string) => {
    const user = await userModel.findByEid(e_id);

    if (!user) {
        throw new BusinessError(StatusCode.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new BusinessError(StatusCode.INVALID_CREDENTIALS);
    }

    const userInfo = {
        id: user.id,
        e_id: user.e_id,
        role: user.role,
        name: user.name
    }

    const token = jwt.sign(
        userInfo,
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
    );

    return {
        token,
        user: userInfo
    };
}

// 註冊
export const signup = async (e_id: string, password: string, name: string, role: string) => {
    return await userModel.register(e_id, password, name, role)
}
