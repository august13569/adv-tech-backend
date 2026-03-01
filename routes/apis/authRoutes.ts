import { Router } from 'express';
import * as authController from '../../controllers/authController'
import { checkUserAuth } from '../../middlewares/authMiddleware';

const router = Router();

// 登入
router.post('/login', authController.login);

// 登出
router.post('/logout', authController.logout)
router.post('/signup', authController.signup)
router.post('/role', checkUserAuth('realHexToken'), authController.role)

export default router;