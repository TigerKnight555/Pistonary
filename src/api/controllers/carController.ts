import type { Request, Response } from 'express';
import { AppDataSource } from '../../database/connection';
import { Car } from '../../database/entities/Car';

export const carController = {
    // Alle Autos abrufen
    getAllCars: async (_req: Request, res: Response) => {
        try {
            const carRepository = AppDataSource.getRepository(Car);
            const cars = await carRepository.find();
            return res.json(cars);
        } catch (error) {
            console.error('Error in getAllCars:', error);
            return res.status(500).json({ message: "Error fetching cars", error });
        }
    },

    // Ein Auto anhand seiner ID abrufen
    getCarById: async (req: Request, res: Response) => {
        try {
            const carRepository = AppDataSource.getRepository(Car);
            const id = parseInt(req.params.id);
            const car = await carRepository.findOneBy({ id });
            
            if (!car) {
                return res.status(404).json({ message: "Car not found" });
            }
            
            return res.json(car);
        } catch (error) {
            console.error('Error in getCarById:', error);
            return res.status(500).json({ message: "Error fetching car", error });
        }
    },

    // Ein neues Auto erstellen
    createCar: async (req: Request, res: Response) => {
        try {
            const carRepository = AppDataSource.getRepository(Car);
            const car = carRepository.create(req.body);
            const result = await carRepository.save(car);
            return res.json(result);
        } catch (error) {
            console.error('Error in createCar:', error);
            return res.status(500).json({ message: "Error creating car", error });
        }
    },

    // Ein Auto aktualisieren
    updateCar: async (req: Request, res: Response) => {
        try {
            const carRepository = AppDataSource.getRepository(Car);
            const id = parseInt(req.params.id);
            const car = await carRepository.findOneBy({ id });
            
            if (!car) {
                return res.status(404).json({ message: "Car not found" });
            }
            
            carRepository.merge(car, req.body);
            const result = await carRepository.save(car);
            return res.json(result);
        } catch (error) {
            console.error('Error in updateCar:', error);
            return res.status(500).json({ message: "Error updating car", error });
        }
    },

    // Ein Auto löschen
    deleteCar: async (req: Request, res: Response) => {
        try {
            const carRepository = AppDataSource.getRepository(Car);
            const id = parseInt(req.params.id);
            const result = await carRepository.delete(id);
            
            if (result.affected === 0) {
                return res.status(404).json({ message: "Car not found" });
            }
            
            return res.json({ message: "Car deleted successfully" });
        } catch (error) {
            console.error('Error in deleteCar:', error);
            return res.status(500).json({ message: "Error deleting car", error });
        }
    }
};
