import type { Request, Response } from 'express';
import { AppDataSource } from '../../database/connection';
import { Refueling } from '../../database/entities/Refueling';
import { Car } from '../../database/entities/Car';

export const refuelingController = {
    // Tankung hinzufügen
    addRefueling: async (req: Request, res: Response) => {
        try {
            const refuelingRepo = AppDataSource.getRepository(Refueling);
            const carRepo = AppDataSource.getRepository(Car);

            const car = await carRepo.findOneBy({ id: req.body.carId });
            if (!car) {
                return res.status(404).json({ message: "Auto nicht gefunden" });
            }

            const refueling = refuelingRepo.create({
                ...req.body,
                car
            });

            const result = await refuelingRepo.save(refueling);
            return res.json(result);
        } catch (error) {
            console.error('Error in addRefueling:', error);
            return res.status(500).json({ message: "Fehler beim Hinzufügen der Tankung", error });
        }
    },

    // Tankungen für ein Auto abrufen
    getRefuelings: async (req: Request, res: Response) => {
        try {
            const refuelingRepo = AppDataSource.getRepository(Refueling);
            const carId = parseInt(req.params.carId);

            const refuelings = await refuelingRepo.find({
                where: { carId },
                order: { date: 'DESC' }
            });

            return res.json(refuelings);
        } catch (error) {
            console.error('Error in getRefuelings:', error);
            return res.status(500).json({ message: "Fehler beim Abrufen der Tankungen", error });
        }
    },

    // Verbrauchsstatistiken für ein Auto berechnen
    getStatistics: async (req: Request, res: Response) => {
        try {
            const refuelingRepo = AppDataSource.getRepository(Refueling);
            const carId = parseInt(req.params.carId);

            const refuelings = await refuelingRepo.find({
                where: { carId },
                order: { date: 'ASC' }
            });

            if (refuelings.length < 2) {
                return res.json({
                    averageConsumption: 0,
                    totalCost: refuelings[0]?.price || 0,
                    totalLiters: refuelings[0]?.amount || 0
                });
            }

            let totalDistance = 0;
            let totalLiters = 0;
            let totalCost = 0;

            // Berechne den Verbrauch zwischen aufeinanderfolgenden Tankungen
            for (let i = 1; i < refuelings.length; i++) {
                const distance = refuelings[i].mileage - refuelings[i-1].mileage;
                totalDistance += distance;
                totalLiters += refuelings[i-1].amount;
                totalCost += refuelings[i-1].price;
            }

            // Füge die letzte Tankung hinzu
            totalLiters += refuelings[refuelings.length-1].amount;
            totalCost += refuelings[refuelings.length-1].price;

            const averageConsumption = (totalLiters * 100) / totalDistance;

            return res.json({
                averageConsumption,
                totalCost,
                totalLiters,
                totalDistance
            });
        } catch (error) {
            console.error('Error in getStatistics:', error);
            return res.status(500).json({ message: "Fehler beim Berechnen der Statistiken", error });
        }
    }
};
