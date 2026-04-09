import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { canStock } from '../../middleware/permissions';
import { validate } from '../../middleware/validate';
import { productSchema } from '../../schemas';
import { list, lowStock, getOne, create, update, remove, getMovements, addMovement } from './stock.controller';

const router = Router();

router.use(authenticate);
router.use(canStock);

router.get('/',         list);
router.get('/low',      lowStock);
router.get('/:id',      getOne);
router.post('/',        validate(productSchema), create);
router.put('/:id',      validate(productSchema), update);
router.delete('/:id',  remove);
router.get('/:id/movements', getMovements);
router.post('/:id/movement', addMovement);

export default router;
