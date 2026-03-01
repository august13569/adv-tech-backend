import { Router } from 'express';
import { checkUserAuth, checkUserRole } from '../../middlewares/authMiddleware';
import * as scheduleController from '../../controllers/scheduleController';

const router = Router();

router.get('/shift', checkUserAuth('realHexToken'), checkUserRole('employee'), scheduleController.getShifts);
router.post('/shift', checkUserAuth('realHexToken'), checkUserRole('employee'), scheduleController.addShift);
router.delete('/shift', checkUserAuth('realHexToken'), checkUserRole('employee'), scheduleController.removeShift);

export default router;
