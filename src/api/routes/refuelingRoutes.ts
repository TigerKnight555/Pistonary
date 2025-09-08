import { Router } from 'express';
import { refuelingController } from '../controllers/refuelingController';

const router = Router();

// Refueling routes
router.post('/refuelings', refuelingController.addRefueling);
router.get('/cars/:carId/refuelings', refuelingController.getRefuelings);
router.get('/cars/:carId/statistics', refuelingController.getStatistics);

export default router;
