import "reflect-metadata";
import { DataSource } from "typeorm";
import { Piston } from "./entities/Piston";
import { Car } from "./entities/Car";
import { Refueling } from "./entities/Refueling";
import { User } from "./entities/User";
import { CarEvent } from "./entities/CarEvent";
import { MaintenanceType } from "./entities/MaintenanceType";
import { CarMaintenanceInterval } from "./entities/CarMaintenanceInterval";
import { Maintenance } from "./entities/Maintenance";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "./src/database/pistonary.sqlite",
    synchronize: process.env.NODE_ENV !== 'production', // Nur in Entwicklung synchronisieren
    logging: ["error", "warn"],
    entities: [Piston, Car, Refueling, User, CarEvent, MaintenanceType, CarMaintenanceInterval, Maintenance],
    subscribers: [],
    migrations: []
})
