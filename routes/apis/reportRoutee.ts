import { Router } from 'express';
import * as reportController from '../../controllers/reportController'
import { checkUserAuth, checkUserRole } from '../../middlewares/authMiddleware';
import { getHolidays } from '../../controllers/holidayController';

const router = Router();

router.get('/holidays', checkUserAuth('realHexToken'), checkUserRole('boss'), getHolidays);
router.get('/shifts', checkUserAuth('realHexToken'), checkUserRole('boss'), reportController.getShifts);
router.get('/stats', checkUserAuth('realHexToken'), checkUserRole('boss'), reportController.getStats);

export default router;