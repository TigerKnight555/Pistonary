import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Refueling } from "./Refueling";

@Entity()
export class Car {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    manufacturer!: string;

    @Column()
    model!: string;

    @Column()
    year!: number;

    @Column()
    power!: number; // PS/HP

    @Column()
    transmission!: string; // Automatik/Manuell

    @Column()
    licensePlate!: string;

    @Column()
    fuel!: string; // Benzin/Diesel/Elektro/Hybrid

    @Column({ nullable: true })
    engineSize?: number; // Hubraum in ccm

    @Column({ nullable: true })
    notes?: string;

    @Column({ nullable: true })
    mileage?: number; // Kilometerstand

    @Column({ type: "simple-json", nullable: true })
    additionalInfo?: {
        vin?: string;
        color?: string;
        lastService?: string;
    };

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @OneToMany(() => Refueling, refueling => refueling.car)
    refuelings!: Refueling[];

    // Berechnete Felder (werden nicht in der DB gespeichert)
    averageConsumption?: number;
    totalCost?: number;
    totalLiters?: number;
}
