import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.post('/select-car', authenticateToken, authController.selectCar);
router.get('/profile', authenticateToken, authController.getProfile);

export default router;
