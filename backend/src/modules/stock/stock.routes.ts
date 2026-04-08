import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { list, lowStock, getOne, create, update, remove } from './stock.controller';

const router = Router();

router.use(authenticate);

router.get('/',         list);
router.get('/low',      lowStock);
router.get('/:id',      getOne);
router.post('/',        create);
router.put('/:id',      update);
router.delete('/:id',   remove);

export default router;
