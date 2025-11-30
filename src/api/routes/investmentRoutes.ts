import express from 'express';
import {
  getInvestmentsByCarId,
  createInvestment,
  updateInvestment,
  deleteInvestment
} from '../controllers/investmentController';

const router = express.Router();

// Routes for investments
router.get('/car/:carId', getInvestmentsByCarId);
router.post('/', createInvestment);
router.put('/:id', updateInvestment);
router.delete('/:id', deleteInvestment);

export default router;
