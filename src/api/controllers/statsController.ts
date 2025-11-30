import type { Request, Response } from 'express';
import { AppDataSource } from '../../database/connection';
import { Car } from '../../database/entities/Car';
import { Refueling } from '../../database/entities/Refueling';

export const statsController = {
    // Globale Statistiken abrufen
    getGlobalStats: async (_req: Request, res: Response) => {
        try {
            const carRepository = AppDataSource.getRepository(Car);
            const refuelingRepository = AppDataSource.getRepository(Refueling);

            // Anzahl der Fahrzeuge
            const totalCars = await carRepository.count();

            // Alle Tankungen abrufen
            const refuelings = await refuelingRepository.find();
            const totalRefuelings = refuelings.length;

            // Gesamtkosten und durchschnittlicher Preis pro Liter berechnen
            const totalCost = refuelings.reduce((sum, ref) => sum + ref.price, 0);
            const totalLiters = refuelings.reduce((sum, ref) => sum + ref.amount, 0);
            const averageCostPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;

            return res.json({
                totalCars,
                totalRefuelings,
                totalCost,
                averageCostPerLiter,
                totalLiters
            });
        } catch (error) {
            console.error('Error in getGlobalStats:', error);
            return res.status(500).json({ message: "Fehler beim Abrufen der Statistiken", error });
        }
    }
};
