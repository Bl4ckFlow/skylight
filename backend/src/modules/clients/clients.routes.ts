import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { canClients } from '../../middleware/permissions';
import { validate } from '../../middleware/validate';
import { clientSchema, clientUpdateSchema } from '../../schemas';
import { list, getOne, getOrders, getStats, create, update, remove } from './clients.controller';

const router = Router();

router.use(authenticate);
router.use(canClients);

router.get('/',           list);
router.get('/:id',        getOne);
router.get('/:id/orders', getOrders);
router.get('/:id/stats',  getStats);
router.post('/',          validate(clientSchema), create);
router.put('/:id',        validate(clientUpdateSchema), update);
router.delete('/:id',     remove);

export default router;
