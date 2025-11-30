import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import { AppDataSource } from '../database/connection';
import { initializeMaintenanceTypes } from '../database/initMaintenanceTypes';
import pistonRoutes from './routes/pistonRoutes';
import carRoutes from './routes/carRoutes';
import refuelingRoutes from './routes/refuelingRoutes';
import statsRoutes from './routes/statsRoutes';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import maintenanceTypeRoutes from './routes/maintenanceTypeRoutes';
import investmentRoutes from './routes/investmentRoutes';
import { optionalAuth } from './middleware/auth';

async function startServer() {
    try {
        // Initialisiere die Datenbankverbindung
        await AppDataSource.initialize();
        console.log("Datenbankverbindung wurde erfolgreich hergestellt");

        // Stelle sicher, dass die Tabellen erstellt wurden
        await AppDataSource.synchronize();
        console.log("Datenbank-Schema wurde synchronisiert");
        
        // Initialisiere Standard-Wartungstypen
        try {
          await initializeMaintenanceTypes();
          console.log("Standard-Wartungstypen erfolgreich initialisiert");
        } catch (error) {
          console.error("Fehler bei der Initialisierung der Wartungstypen:", error);
          // Trotzdem weitermachen, auch wenn die Initialisierung fehlschlägt
        }

        const app = express();
        const PORT = parseInt(process.env.PORT || '3001', 10);

        // Middleware
        app.use(cors({
            // Erlaube alle Origins in Production
            origin: true,
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

        // Simple test route for maintenance
        app.get('/api/maintenance/test', (req, res) => {
            res.json({ message: 'Maintenance API is working!' });
        });

        // Debug route for useIndividualIntervals issue
        app.get('/api/cars/:id/direct', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                
                // Direct SQL query
                const rawResult = await AppDataSource.query(
                    'SELECT id, useStandardIntervals, useIndividualIntervals FROM car WHERE id = ?', 
                    [id]
                );
                
                return res.json({
                    success: true,
                    rawSQLResult: rawResult,
                    id: id,
                    hasData: rawResult.length > 0
                });
            } catch (error) {
                return res.status(500).json({ error: (error as Error).message });
            }
        });

        // Routes
        app.use('/api/auth', authRoutes);
        app.use('/api', optionalAuth, pistonRoutes);
        app.use('/api', optionalAuth, carRoutes);
        app.use('/api', optionalAuth, refuelingRoutes);
        app.use('/api', optionalAuth, statsRoutes);
        app.use('/api', optionalAuth, eventRoutes);
        app.use('/api/maintenance', optionalAuth, maintenanceRoutes);
        app.use('/api/maintenance-intervals', optionalAuth, maintenanceTypeRoutes);
        app.use('/api/investments', optionalAuth, investmentRoutes);

        // Debug route for useIndividualIntervals issue
        app.get('/api/debug/car/:id', async (req, res) => {
            try {
                const { Car } = await import('../database/entities/Car');
                const carRepository = AppDataSource.getRepository(Car);
                const id = parseInt(req.params.id);
                
                console.log('Debug: fetching car with ID', id);
                const car = await carRepository.findOneBy({ id });
                
                if (!car) {
                    return res.status(404).json({ message: "Car not found" });
                }
                
                console.log('Debug: Raw car object from TypeORM:', {
                    id: car.id,
                    useStandardIntervals: car.useStandardIntervals,
                    useIndividualIntervals: car.useIndividualIntervals,
                    hasUseIndividualIntervals: 'useIndividualIntervals' in car,
                    allKeys: Object.keys(car)
                });
                
                // Try to manually access the property
                const manualAccess = (car as any).useIndividualIntervals;
                console.log('Debug: Manual property access:', manualAccess);
                
                return res.json({
                    success: true,
                    car: car,
                    debug: {
                        hasProperty: 'useIndividualIntervals' in car,
                        manualAccess: manualAccess,
                        allKeys: Object.keys(car)
                    }
                });
            } catch (error) {
                console.error('Debug route error:', error);
                return res.status(500).json({ error: (error as Error).message });
            }
        });

        // Starte den Server auf 0.0.0.0 um von außen erreichbar zu sein
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server läuft auf http://0.0.0.0:${PORT}`);
        });

        // Verhindere, dass der Server sich beendet
        server.keepAliveTimeout = 60000;
        server.headersTimeout = 65000;

        // Graceful shutdown handling
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, closing server...');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received, closing server...');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error("Fehler beim Starten des Servers:", error);
        process.exit(1);
    }
}

startServer();
