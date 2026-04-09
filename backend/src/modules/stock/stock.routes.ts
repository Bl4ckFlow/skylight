import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { canStock } from '../../middleware/permissions';
import { list, lowStock, getOne, create, update, remove, getMovements, addMovement } from './stock.controller';

const router = Router();

router.use(authenticate);
router.use(canStock);

router.get('/',         list);
router.get('/low',      lowStock);
router.get('/:id',      getOne);
router.post('/',        create);
router.put('/:id',           update);
router.delete('/:id',        remove);
router.get('/:id/movements', getMovements);
router.post('/:id/movement', addMovement);

export default router;
