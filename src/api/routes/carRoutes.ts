import { Router } from 'express';
import { carController } from '../controllers/carController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Test route
router.get('/cars/test', (req, res) => {
    res.json({ message: 'Car routes are working' });
});

// Car routes (alle erfordern Authentifizierung)
router.get('/cars', authenticateToken, carController.getAllCars);
router.get('/cars/:id', authenticateToken, carController.getCarById);
router.get('/cars/:id/debug', authenticateToken, async (req, res) => {
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
router.post('/cars', authenticateToken, carController.createCar);
router.put('/cars/:id', authenticateToken, carController.updateCar);
router.delete('/cars/:id', authenticateToken, carController.deleteCar);

export default router;
