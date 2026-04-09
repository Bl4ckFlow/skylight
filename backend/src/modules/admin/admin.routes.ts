import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../../middleware/auth';
import { getCompanies, getUsers, createCompany } from './admin.controller';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/companies',                      getCompanies);
router.get('/companies/:company_id/users',    getUsers);
router.post('/companies',                     createCompany);

export default router;
