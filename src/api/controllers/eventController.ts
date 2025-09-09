import type { Request, Response } from 'express';
import { AppDataSource } from '../../database/connection';
import { CarEvent } from '../../database/entities/CarEvent';
import { Car } from '../../database/entities/Car';

export const eventController = {
    // Event hinzufügen
    addEvent: async (req: Request, res: Response) => {
        try {
            const eventRepo = AppDataSource.getRepository(CarEvent);
            const carRepo = AppDataSource.getRepository(Car);

            console.log('Adding event with data:', req.body);

            const car = await carRepo.findOneBy({ id: req.body.carId });
            if (!car) {
                console.log(`Car with ID ${req.body.carId} not found`);
                return res.status(404).json({ message: "Auto nicht gefunden" });
            }

            console.log(`Found car:`, { id: car.id, manufacturer: car.manufacturer, model: car.model });

            const event = eventRepo.create({
                title: req.body.title,
                description: req.body.description,
                date: req.body.date,
                mileage: req.body.mileage,
                type: req.body.type,
                cost: req.body.cost,
                notes: req.body.notes,
                carId: car.id,
                car: car
            });

            console.log('Created event object:', { carId: event.carId, title: event.title, date: event.date, type: event.type });

            const savedEvent = await eventRepo.save(event);
            console.log('Event saved successfully:', savedEvent.id);

            return res.status(201).json(savedEvent);
        } catch (error) {
            console.error('Error in addEvent:', error);
            return res.status(500).json({ message: "Fehler beim Hinzufügen des Ereignisses", error });
        }
    },

    // Events für ein Auto abrufen
    getEvents: async (req: Request, res: Response) => {
        try {
            const eventRepo = AppDataSource.getRepository(CarEvent);
            const carId = parseInt(req.params.carId);

            console.log(`Getting events for carId: ${carId}`);

            const events = await eventRepo.find({
                where: { carId },
                order: { date: 'DESC' }
            });

            console.log(`Found ${events.length} events for car ${carId}`);

            return res.json(events);
        } catch (error) {
            console.error('Error in getEvents:', error);
            return res.status(500).json({ message: "Fehler beim Abrufen der Ereignisse", error });
        }
    },

    // Event aktualisieren
    updateEvent: async (req: Request, res: Response) => {
        try {
            const eventRepo = AppDataSource.getRepository(CarEvent);
            const carRepo = AppDataSource.getRepository(Car);
            const eventId = parseInt(req.params.id);

            console.log('Updating event with ID:', eventId, 'Data:', req.body);

            // Prüfen ob Event existiert
            const existingEvent = await eventRepo.findOneBy({ id: eventId });
            if (!existingEvent) {
                return res.status(404).json({ message: "Ereignis nicht gefunden" });
            }

            // Prüfen ob Auto existiert (falls carId geändert wird)
            if (req.body.carId && req.body.carId !== existingEvent.carId) {
                const car = await carRepo.findOneBy({ id: req.body.carId });
                if (!car) {
                    return res.status(404).json({ message: "Auto nicht gefunden" });
                }
            }

            // Event aktualisieren
            await eventRepo.update(eventId, {
                title: req.body.title || existingEvent.title,
                description: req.body.description !== undefined ? req.body.description : existingEvent.description,
                date: req.body.date || existingEvent.date,
                mileage: req.body.mileage !== undefined ? req.body.mileage : existingEvent.mileage,
                type: req.body.type || existingEvent.type,
                cost: req.body.cost !== undefined ? req.body.cost : existingEvent.cost,
                notes: req.body.notes !== undefined ? req.body.notes : existingEvent.notes,
                carId: req.body.carId || existingEvent.carId
            });

            // Aktualisiertes Event zurückgeben
            const updatedEvent = await eventRepo.findOneBy({ id: eventId });
            console.log('Event updated successfully:', updatedEvent);

            return res.json(updatedEvent);
        } catch (error) {
            console.error('Error in updateEvent:', error);
            return res.status(500).json({ message: "Fehler beim Aktualisieren des Ereignisses", error });
        }
    },

    // Event löschen
    deleteEvent: async (req: Request, res: Response) => {
        try {
            const eventRepo = AppDataSource.getRepository(CarEvent);
            const eventId = parseInt(req.params.id);

            console.log('Deleting event with ID:', eventId);

            // Prüfen ob Event existiert
            const existingEvent = await eventRepo.findOneBy({ id: eventId });
            if (!existingEvent) {
                return res.status(404).json({ message: "Ereignis nicht gefunden" });
            }

            // Event löschen
            await eventRepo.delete(eventId);
            console.log('Event deleted successfully');

            return res.json({ message: "Ereignis erfolgreich gelöscht", id: eventId });
        } catch (error) {
            console.error('Error in deleteEvent:', error);
            return res.status(500).json({ message: "Fehler beim Löschen des Ereignisses", error });
        }
    },

    // Einzelnes Event abrufen
    getEventById: async (req: Request, res: Response) => {
        try {
            const eventRepo = AppDataSource.getRepository(CarEvent);
            const eventId = parseInt(req.params.id);

            console.log('Getting event with ID:', eventId);

            const event = await eventRepo.findOneBy({ id: eventId });
            if (!event) {
                return res.status(404).json({ message: "Ereignis nicht gefunden" });
            }

            return res.json(event);
        } catch (error) {
            console.error('Error in getEventById:', error);
            return res.status(500).json({ message: "Fehler beim Abrufen des Ereignisses", error });
        }
    }
};
