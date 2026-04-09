import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../../middleware/auth';
import { getCompanies, getUsers, createCompany, getStats, removeCompany } from './admin.controller';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/stats',                          getStats);
router.get('/companies',                      getCompanies);
router.get('/companies/:company_id/users',    getUsers);
router.delete('/companies/:company_id',       removeCompany);
router.post('/companies',                     createCompany);

export default router;
