import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getDashboardStats } from './dashboard.service';
import { AuthRequest } from '../../middleware/auth';
import { Response } from 'express';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const stats = await getDashboardStats(req.user!.company_id);
  res.json(stats);
});

export default router;
