import { Router } from 'express';
import { login, register, me, listUsers, updatePassword } from './auth.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema, changePasswordSchema } from '../../schemas';

const router = Router();

router.post('/login', validate(loginSchema), login);
// TODO: refreshToken impl

router.get('/me', authenticate, me);
router.get('/users', authenticate, requireAdmin, listUsers);
router.post('/change-password', authenticate, validate(changePasswordSchema), updatePassword);

export default router;
