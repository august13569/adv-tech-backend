import { Router } from 'express';
import * as authController from '../../controllers/authController'
import { checkUserAuth } from '../../middlewares/authMiddleware';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout)
router.post('/signup', authController.signup)
router.post('/role', checkUserAuth('realHexToken'), authController.role)

export default router;