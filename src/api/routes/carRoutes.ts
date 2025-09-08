import { Router } from 'express';
import { carController } from '../controllers/carController';

const router = Router();

// Test route
router.get('/cars/test', (req, res) => {
    res.json({ message: 'Car routes are working' });
});

// Car routes
router.get('/cars', carController.getAllCars);
router.get('/cars/:id', carController.getCarById);
router.post('/cars', carController.createCar);
router.put('/cars/:id', carController.updateCar);
router.delete('/cars/:id', carController.deleteCar);

export default router;
