import { Router } from 'express';
import { 
  getMaintenanceTypes, 
  getCarMaintenanceIntervals, 
  updateCarMaintenanceIntervals,
  createMaintenanceType,
  deleteMaintenanceType
} from '../controllers/maintenanceController';

const router = Router();

// Standard-Wartungstypen abrufen
router.get('/types', getMaintenanceTypes);

// Wartungsintervalle für ein bestimmtes Auto abrufen
router.get('/car/:carId', getCarMaintenanceIntervals);

// Wartungsintervalle für ein Auto speichern/aktualisieren
router.put('/car/:carId', updateCarMaintenanceIntervals);

// Neuen benutzerdefinierten Wartungstyp erstellen
router.post('/types', createMaintenanceType);

// Benutzerdefinierten Wartungstyp löschen
router.delete('/types/:id', deleteMaintenanceType);

export default router;