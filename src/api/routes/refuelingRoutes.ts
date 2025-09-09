import { Router } from 'express';
import { refuelingController } from '../controllers/refuelingController';

const router = Router();

// Refueling routes
router.post('/refuelings', refuelingController.addRefueling);
router.post('/refuelings/test', refuelingController.addTestRefueling); // Debug Route
router.get('/refuelings/all', refuelingController.getAllRefuelings); // Debug Route
router.get('/refuelings/:id', refuelingController.getRefuelingById); // Einzelne Tankung abrufen
router.put('/refuelings/:id', refuelingController.updateRefueling); // Tankung aktualisieren
router.delete('/refuelings/:id', refuelingController.deleteRefueling); // Tankung löschen
router.get('/refuelings/car/:carId', (req, res) => {
    console.log('Route /refuelings/car/:carId reached with carId:', req.params.carId);
    return refuelingController.getRefuelings(req, res);
}); // Route für Frontend mit Debug
router.get('/cars/:carId/refuelings', refuelingController.getRefuelings); // Alternative Route
router.get('/cars/:carId/statistics', refuelingController.getStatistics);

export default router;
