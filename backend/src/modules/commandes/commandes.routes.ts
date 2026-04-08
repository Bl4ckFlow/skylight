import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { list, getOne, create, updateStatus, remove } from './commandes.controller';

const router = Router();

router.use(authenticate);

router.get('/',           list);
router.get('/:id',        getOne);
router.post('/',          create);
router.patch('/:id/status', updateStatus);
router.delete('/:id',     remove);

export default router;
