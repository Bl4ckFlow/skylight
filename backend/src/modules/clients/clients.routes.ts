import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { list, getOne, getOrders, create, update, remove } from './clients.controller';

const router = Router();

router.use(authenticate);

router.get('/',              list);
router.get('/:id',           getOne);
router.get('/:id/orders',    getOrders);
router.post('/',             create);
router.put('/:id',           update);
router.delete('/:id',        remove);

export default router;
