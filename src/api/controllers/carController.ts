import type { Request, Response } from 'express';
import { AppDataSource } from '../../database/connection';
import { Car } from '../../database/entities/Car';

export const carController = {
    // Alle Autos abrufen
    getAllCars: async (req: Request, res: Response) => {
        try {
            const carRepository = AppDataSource.getRepository(Car);
            const userId = (req as any).user?.userId;
            
            let cars;
            if (userId) {
                // Authenticated user - get only their cars
                cars = await carRepository.findBy({ userId });
            } else {
                // Unauthenticated - for now, show all cars (will be restricted later)
                cars = await carRepository.find();
            }
            
            console.log('Cars fetched:', cars.map(car => ({ 
                id: car.id, 
                manufacturer: car.manufacturer, 
                model: car.model,
                hasImage: !!car.image,
                imageLength: car.image ? car.image.length : 0,
                userId: car.userId
            })));
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
            const userId = (req as any).user?.userId || 1; // Default to user 1 for backward compatibility
            
            console.log('Creating car with data:', {
                manufacturer: req.body.manufacturer,
                model: req.body.model,
                hasImage: !!req.body.image,
                imageLength: req.body.image ? req.body.image.length : 0,
                imagePreview: req.body.image ? req.body.image.substring(0, 50) + '...' : 'no image',
                userId: userId
            });
            
            const carRepository = AppDataSource.getRepository(Car);
            const carData = { ...req.body, userId };
            const car = carRepository.create(carData);
            const result = await carRepository.save(car);
            
            console.log('Car saved successfully');
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