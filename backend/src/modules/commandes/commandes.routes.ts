import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { list, getOne, getLogs, create, updateStatus, remove, downloadBL } from './commandes.controller';

const router = Router();

router.use(authenticate);

router.get('/',               list);
router.get('/:id',            getOne);
router.get('/:id/logs',       getLogs);
router.get('/:id/bl',         downloadBL);
router.post('/',              create);
router.patch('/:id/status',   updateStatus);
router.delete('/:id',         remove);

export default router;
