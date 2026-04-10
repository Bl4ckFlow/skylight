import { Router } from 'express';
import { login, register, me, listUsers, updatePassword, changeUserRole, removeUser } from './auth.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginLimiter } from '../../middleware/rateLimit';
import { loginSchema, changePasswordSchema, registerSchema } from '../../schemas';
import { z } from 'zod';
import { ROLES } from '../../constants';

const router = Router();

const roleSchema = z.object({
  role: z.enum(ROLES),
});

router.post('/login',               loginLimiter, validate(loginSchema), login);
router.get('/me',                   authenticate, me);
router.get('/users',                authenticate, requireAdmin, listUsers);
router.post('/register',            authenticate, requireAdmin, validate(registerSchema), register);
router.post('/change-password',     authenticate, validate(changePasswordSchema), updatePassword);
router.patch('/users/:id/role',     authenticate, requireAdmin, validate(roleSchema), changeUserRole);
router.delete('/users/:id',         authenticate, requireAdmin, removeUser);

export default router;
