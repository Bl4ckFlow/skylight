import { Router } from 'express';
import { login, register, me, listUsers, updatePassword } from './auth.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema, changePasswordSchema, registerSchema } from '../../schemas';

const router = Router();

router.post('/login',           validate(loginSchema), login);
router.get('/me',               authenticate, me);
router.get('/users',            authenticate, requireAdmin, listUsers);
router.post('/register',        authenticate, requireAdmin, validate(registerSchema), register);
router.post('/change-password', authenticate, validate(changePasswordSchema), updatePassword);

export default router;
