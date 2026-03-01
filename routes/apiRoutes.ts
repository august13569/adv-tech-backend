import { Router } from 'express';
import authRoutes from './apis/authRoutes'
import schedulerRoutes from './apis/scheduleRoutes'
import reportRoutes from './apis/reportRoutee'

const router = Router();

router.use('/auth', authRoutes)
router.use('/schedule', schedulerRoutes)
router.use('/report', reportRoutes)

export default router;
