import "reflect-metadata";
import { DataSource } from "typeorm";
import { Piston } from "./entities/Piston";
import { Car } from "./entities/Car";
import { Refueling } from "./entities/Refueling";
import { User } from "./entities/User";
import { CarEvent } from "./entities/CarEvent";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "./src/database/pistonary.sqlite",
    synchronize: true, // Im Produktivbetrieb auf false setzen
    logging: ["error", "warn"],
    entities: [Piston, Car, Refueling, User, CarEvent],
    subscribers: [],
    migrations: []
})
