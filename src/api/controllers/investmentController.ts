import type { Request, Response } from 'express';
import { AppDataSource } from '../../database/connection';
import { Investment } from '../../database/entities/Investment';

const investmentRepository = () => AppDataSource.getRepository(Investment);

// Get all investments for a car
export const getInvestmentsByCarId = async (req: Request, res: Response) => {
  try {
    const { carId } = req.params;
    
    const investments = await investmentRepository().find({
      where: { carId: parseInt(carId) },
      order: { date: 'DESC' }
    });
    
    res.json(investments);
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Investitionen' });
  }
};

// Create new investment
export const createInvestment = async (req: Request, res: Response) => {
  try {
    const { carId, date, description, amount, category, notes } = req.body;
    
    if (!carId || !date || !description || amount === undefined) {
      return res.status(400).json({ error: 'Fehlende Pflichtfelder' });
    }
    
    const investment = investmentRepository().create({
      carId,
      date: new Date(date),
      description,
      amount,
      category,
      notes
    });
    
    await investmentRepository().save(investment);
    
    res.status(201).json(investment);
  } catch (error) {
    console.error('Error creating investment:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Investition' });
  }
};

// Update investment
export const updateInvestment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, description, amount, category, notes } = req.body;
    
    const investment = await investmentRepository().findOneBy({ id: parseInt(id) });
    
    if (!investment) {
      return res.status(404).json({ error: 'Investition nicht gefunden' });
    }
    
    investment.date = date ? new Date(date) : investment.date;
    investment.description = description !== undefined ? description : investment.description;
    investment.amount = amount !== undefined ? amount : investment.amount;
    investment.category = category !== undefined ? category : investment.category;
    investment.notes = notes !== undefined ? notes : investment.notes;
    
    await investmentRepository().save(investment);
    
    res.json(investment);
  } catch (error) {
    console.error('Error updating investment:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Investition' });
  }
};

// Delete investment
export const deleteInvestment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await investmentRepository().delete({ id: parseInt(id) });
    
    if (result.affected === 0) {
      return res.status(404).json({ error: 'Investition nicht gefunden' });
    }
    
    res.json({ message: 'Investition gelöscht' });
  } catch (error) {
    console.error('Error deleting investment:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Investition' });
  }
};
