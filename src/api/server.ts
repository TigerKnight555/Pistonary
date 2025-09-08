import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import { AppDataSource } from '../database/connection';
import pistonRoutes from './routes/pistonRoutes';
import carRoutes from './routes/carRoutes';
import refuelingRoutes from './routes/refuelingRoutes';
import statsRoutes from './routes/statsRoutes';

async function startServer() {
    try {
        // Initialisiere die Datenbankverbindung
        await AppDataSource.initialize();
        console.log("Datenbankverbindung wurde erfolgreich hergestellt");

        // Stelle sicher, dass die Tabellen erstellt wurden
        await AppDataSource.synchronize();
        console.log("Datenbank-Schema wurde synchronisiert");

        const app = express();
        const PORT = process.env.PORT || 3001;

        // Middleware
        app.use(cors({
            // Erlaubt Zugriffe von beiden möglichen Ports
            origin: ['http://localhost:5173', 'http://localhost:5174'],
            credentials: true
        }));
        app.use(express.json());

        // Debug middleware
        app.use((req, _res, next) => {
            console.log(`${req.method} ${req.url}`, req.body);
            next();
        });

        // Routes
        app.use('/api', pistonRoutes);
        app.use('/api', carRoutes);
        app.use('/api', refuelingRoutes);
        app.use('/api', statsRoutes);

        // Starte den Server
        app.listen(PORT, () => {
            console.log(`Server läuft auf http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Fehler beim Starten des Servers:", error);
        process.exit(1);
    }
}

startServer();
