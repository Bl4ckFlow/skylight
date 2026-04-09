import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { canFactures } from '../../middleware/permissions';
import { list, getOne, getLogs, create, updateStatus, downloadPDF } from './factures.controller';

const router = Router();

router.use(authenticate);
router.use(canFactures);

router.get('/',                    list);
router.get('/:id',                 getOne);
router.get('/:id/logs',            getLogs);
router.get('/:id/pdf',             downloadPDF);
router.post('/',                   create);
router.patch('/:id/status',        updateStatus);

export default router;
