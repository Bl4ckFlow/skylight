import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { getSettings, updateSettings } from './settings.controller';

const router = Router();
router.use(authenticate);
router.get('/',  getSettings);
router.put('/',  requireAdmin, updateSettings);

export default router;
