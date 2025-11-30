import { Router } from 'express';
import { pistonController } from '../controllers/pistonController';

const router = Router();

// Piston routes
router.get('/pistons', pistonController.getAllPistons);
router.get('/pistons/:id', pistonController.getPistonById);
router.post('/pistons', pistonController.createPiston);
router.put('/pistons/:id', pistonController.updatePiston);
router.delete('/pistons/:id', pistonController.deletePiston);

export default router;
