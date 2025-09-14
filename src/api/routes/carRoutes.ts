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
router.get('/cars/:id/debug', async (req, res) => {
    try {
        const { AppDataSource } = await import('../../database/connection');
        const id = parseInt(req.params.id);
        
        // Direct SQL query
        const rawResult = await AppDataSource.query(
            'SELECT id, useStandardIntervals, useIndividualIntervals FROM car WHERE id = ?', 
            [id]
        );
        
        return res.json({
            success: true,
            rawSQLResult: rawResult,
            id: id,
            hasData: rawResult.length > 0
        });
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
    }
});
router.post('/cars', carController.createCar);
router.put('/cars/:id', carController.updateCar);
router.delete('/cars/:id', carController.deleteCar);

export default router;
