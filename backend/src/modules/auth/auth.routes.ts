import { Router } from 'express';
import { login, register, me } from './auth.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', authenticate, requireAdmin, register);
router.get('/me', authenticate, me);

export default router;
