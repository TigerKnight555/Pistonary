import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import { AppDataSource } from '../database/connection';
import pistonRoutes from './routes/pistonRoutes';
import carRoutes from './routes/carRoutes';
import refuelingRoutes from './routes/refuelingRoutes';
import statsRoutes from './routes/statsRoutes';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import { optionalAuth } from './middleware/auth';

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
            // Erlaubt Zugriffe von allen möglichen Vite Ports
            origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
            credentials: true
        }));
        // Erhöhe das Limit für JSON-Payloads um Base64-Bilder zu unterstützen
        app.use(express.json({ limit: '50mb' }));
        app.use(express.urlencoded({ limit: '50mb', extended: true }));

        // Debug middleware
        app.use((req, _res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`, req.query, req.body ? 'Body: ' + JSON.stringify(req.body).substring(0, 100) : '');
            next();
        });

        // Routes
        app.use('/api/auth', authRoutes);
        app.use('/api', optionalAuth, pistonRoutes);
        app.use('/api', optionalAuth, carRoutes);
        app.use('/api', optionalAuth, refuelingRoutes);
        app.use('/api', optionalAuth, statsRoutes);
        app.use('/api', optionalAuth, eventRoutes);

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
