import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { canCommandes } from '../../middleware/permissions';
import { validate } from '../../middleware/validate';
import { createOrderSchema, updateStatusSchema } from '../../schemas';
import { list, getOne, getLogs, create, updateStatus, remove, downloadBL, confirmDelivery } from './commandes.controller';

const router = Router();

// Public: client delivery confirmation (no auth needed)
router.get('/confirm-delivery', confirmDelivery);

router.use(authenticate);
router.use(canCommandes);

router.get('/',               list);
router.get('/:id',            getOne);
router.get('/:id/logs',       getLogs);
router.get('/:id/bl',         downloadBL);
router.post('/',              validate(createOrderSchema), create);
router.patch('/:id/status',   validate(updateStatusSchema), updateStatus);
router.delete('/:id',         remove);

export default router;
