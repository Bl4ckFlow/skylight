import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { list, getOne, create, updateStatus, downloadPDF } from './factures.controller';

const router = Router();

router.use(authenticate);

router.get('/',                    list);
router.get('/:id',                 getOne);
router.get('/:id/pdf',             downloadPDF);
router.post('/',                   create);
router.patch('/:id/status',        updateStatus);

export default router;
