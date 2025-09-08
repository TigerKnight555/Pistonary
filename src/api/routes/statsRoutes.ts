import { Router } from 'express';
import { statsController } from '../controllers/statsController';

const router = Router();

// Stats routes
router.get('/stats', statsController.getGlobalStats);

export default router;
