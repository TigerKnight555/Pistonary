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

            console.log('Adding refueling with data:', req.body);

            const car = await carRepo.findOneBy({ id: req.body.carId });
            if (!car) {
                console.log(`Car with ID ${req.body.carId} not found`);
                return res.status(404).json({ message: "Auto nicht gefunden" });
            }

            console.log(`Found car:`, { id: car.id, manufacturer: car.manufacturer, model: car.model });

            const refueling = refuelingRepo.create({
                date: req.body.date,
                amount: req.body.amount,
                price: req.body.price,
                mileage: req.body.mileage,
                isPartialRefueling: req.body.isPartialRefueling || false,
                notes: req.body.notes,
                carId: car.id, // Explizit carId setzen
                car: car
            });

            console.log('Created refueling object:', { carId: refueling.carId, amount: refueling.amount, date: refueling.date });

            const result = await refuelingRepo.save(refueling);
            console.log('Saved refueling:', { id: result.id, carId: result.carId });
            
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
            const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

            console.log(`Getting refuelings for carId: ${carId}, limit: ${limit}`);

            const queryBuilder = refuelingRepo.createQueryBuilder('refueling')
                .where('refueling.carId = :carId', { carId })
                .orderBy('refueling.date', 'DESC');

            if (limit) {
                queryBuilder.limit(limit);
            }

            const refuelings = await queryBuilder.getMany();
            console.log(`Found ${refuelings.length} refuelings for car ${carId}:`, refuelings.map(r => ({ id: r.id, carId: r.carId, date: r.date, amount: r.amount })));

            return res.json(refuelings);
        } catch (error) {
            console.error('Error in getRefuelings:', error);
            return res.status(500).json({ message: "Fehler beim Abrufen der Tankungen", error });
        }
    },

    // Debug: Test-Tankung hinzufügen
    addTestRefueling: async (_req: Request, res: Response) => {
        try {
            const refuelingRepo = AppDataSource.getRepository(Refueling);
            const carRepo = AppDataSource.getRepository(Car);

            // Erstes Auto finden
            const car = await carRepo.findOne({ where: {}, order: { id: 'ASC' } });
            if (!car) {
                return res.status(404).json({ message: "Kein Auto gefunden" });
            }

            const testRefueling = refuelingRepo.create({
                date: new Date().toISOString(),
                carId: car.id,
                car: car,
                amount: 45.5,
                price: 72.80,
                mileage: 45000,
                isPartialRefueling: false
            });

            const result = await refuelingRepo.save(testRefueling);
            return res.json({ message: "Test-Tankung hinzugefügt", refueling: result });
        } catch (error) {
            console.error('Error in addTestRefueling:', error);
            return res.status(500).json({ message: "Fehler beim Hinzufügen der Test-Tankung", error });
        }
    },

    // Debug: Alle Tankungen anzeigen
    getAllRefuelings: async (_req: Request, res: Response) => {
        try {
            const refuelingRepo = AppDataSource.getRepository(Refueling);
            const carRepo = AppDataSource.getRepository(Car);

            const refuelings = await refuelingRepo.find({
                order: { date: 'DESC' }
            });

            const cars = await carRepo.find();

            console.log('All cars in database:', cars.map(c => ({ id: c.id, manufacturer: c.manufacturer, model: c.model, userId: c.userId })));
            console.log('All refuelings in database:', refuelings.map(r => ({ id: r.id, carId: r.carId, date: r.date, amount: r.amount })));

            return res.json({
                count: refuelings.length,
                cars: cars,
                refuelings: refuelings
            });
        } catch (error) {
            console.error('Error in getAllRefuelings:', error);
            return res.status(500).json({ message: "Fehler beim Abrufen aller Tankungen", error });
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
    },

    // Tankung aktualisieren
    updateRefueling: async (req: Request, res: Response) => {
        try {
            const refuelingRepo = AppDataSource.getRepository(Refueling);
            const carRepo = AppDataSource.getRepository(Car);
            const refuelingId = parseInt(req.params.id);

            console.log('Updating refueling with ID:', refuelingId, 'Data:', req.body);

            // Prüfen ob Tankung existiert
            const existingRefueling = await refuelingRepo.findOneBy({ id: refuelingId });
            if (!existingRefueling) {
                return res.status(404).json({ message: "Tankung nicht gefunden" });
            }

            // Prüfen ob Auto existiert (falls carId geändert wird)
            if (req.body.carId && req.body.carId !== existingRefueling.carId) {
                const car = await carRepo.findOneBy({ id: req.body.carId });
                if (!car) {
                    return res.status(404).json({ message: "Auto nicht gefunden" });
                }
            }

            // Tankung aktualisieren
            await refuelingRepo.update(refuelingId, {
                date: req.body.date || existingRefueling.date,
                amount: req.body.amount !== undefined ? req.body.amount : existingRefueling.amount,
                price: req.body.price !== undefined ? req.body.price : existingRefueling.price,
                mileage: req.body.mileage !== undefined ? req.body.mileage : existingRefueling.mileage,
                isPartialRefueling: req.body.isPartialRefueling !== undefined ? req.body.isPartialRefueling : existingRefueling.isPartialRefueling,
                notes: req.body.notes !== undefined ? req.body.notes : existingRefueling.notes,
                carId: req.body.carId || existingRefueling.carId
            });

            // Aktualisierte Tankung zurückgeben
            const updatedRefueling = await refuelingRepo.findOneBy({ id: refuelingId });
            console.log('Refueling updated successfully:', updatedRefueling);

            return res.json(updatedRefueling);
        } catch (error) {
            console.error('Error in updateRefueling:', error);
            return res.status(500).json({ message: "Fehler beim Aktualisieren der Tankung", error });
        }
    },

    // Tankung löschen
    deleteRefueling: async (req: Request, res: Response) => {
        try {
            const refuelingRepo = AppDataSource.getRepository(Refueling);
            const refuelingId = parseInt(req.params.id);

            console.log('Deleting refueling with ID:', refuelingId);

            // Prüfen ob Tankung existiert
            const existingRefueling = await refuelingRepo.findOneBy({ id: refuelingId });
            if (!existingRefueling) {
                return res.status(404).json({ message: "Tankung nicht gefunden" });
            }

            // Tankung löschen
            await refuelingRepo.delete(refuelingId);
            console.log('Refueling deleted successfully');

            return res.json({ message: "Tankung erfolgreich gelöscht", id: refuelingId });
        } catch (error) {
            console.error('Error in deleteRefueling:', error);
            return res.status(500).json({ message: "Fehler beim Löschen der Tankung", error });
        }
    },

    // Einzelne Tankung abrufen
    getRefuelingById: async (req: Request, res: Response) => {
        try {
            const refuelingRepo = AppDataSource.getRepository(Refueling);
            const refuelingId = parseInt(req.params.id);

            console.log('Getting refueling with ID:', refuelingId);

            const refueling = await refuelingRepo.findOneBy({ id: refuelingId });
            if (!refueling) {
                return res.status(404).json({ message: "Tankung nicht gefunden" });
            }

            return res.json(refueling);
        } catch (error) {
            console.error('Error in getRefuelingById:', error);
            return res.status(500).json({ message: "Fehler beim Abrufen der Tankung", error });
        }
    }
};
