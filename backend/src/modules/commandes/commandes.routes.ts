import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { canCommandes } from '../../middleware/permissions';
import { validate } from '../../middleware/validate';
import { createOrderSchema, updateStatusSchema } from '../../schemas';
import { list, getOne, getLogs, create, updateStatus, remove, downloadBL, confirmDelivery } from './commandes.controller';

const router = Router();

// ── Public routes (no auth) ────────────────────────────────────────────────────
// Client delivery confirmation — accessed via link in email
router.get('/confirm-delivery', confirmDelivery);

// ── Protected routes ──────────────────────────────────────────────────────────
// authenticate must come before any route that should be protected.
// Add all new routes BELOW this line.
router.use(authenticate);
router.use(canCommandes);

router.get('/',             list);
router.get('/:id',          getOne);
router.get('/:id/logs',     getLogs);
router.get('/:id/bl',       downloadBL);
router.post('/',            validate(createOrderSchema), create);
router.patch('/:id/status', validate(updateStatusSchema), updateStatus);
router.delete('/:id',       remove);

export default router;
