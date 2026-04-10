import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { canFactures } from '../../middleware/permissions';
import { validate } from '../../middleware/validate';
import { createInvoiceSchema, invoicePaymentSchema } from '../../schemas';
import { list, getOne, getLogs, create, updateStatus, downloadPDF, exportXlsx } from './factures.controller';

const router = Router();

router.use(authenticate);
router.use(canFactures);

router.get('/',              list);
router.get('/export.xlsx',   exportXlsx);
router.get('/:id',           getOne);
router.get('/:id/logs',      getLogs);
router.get('/:id/pdf',       downloadPDF);
router.post('/',             validate(createInvoiceSchema), create);
router.patch('/:id/status',  validate(invoicePaymentSchema), updateStatus);

export default router;
