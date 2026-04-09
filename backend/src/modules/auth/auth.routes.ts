import { Router } from 'express';
import { login, register, me, listUsers, updatePassword } from './auth.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', authenticate, requireAdmin, register);
router.get('/me', authenticate, me);
router.get('/users', authenticate, requireAdmin, listUsers);
router.post('/change-password', authenticate, updatePassword);

export default router;
