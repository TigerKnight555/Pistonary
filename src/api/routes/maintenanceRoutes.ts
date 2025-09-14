import express from 'express';
import { 
  getMaintenanceByCarId, 
  createMaintenance, 
  updateMaintenance, 
  deleteMaintenance 
} from '../controllers/maintenanceController';

const router = express.Router();

// Routes for maintenance records
router.get('/:carId', getMaintenanceByCarId);
router.post('/', createMaintenance);
router.put('/:id', updateMaintenance);
router.delete('/:id', deleteMaintenance);

export default router;