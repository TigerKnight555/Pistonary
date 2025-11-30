import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from "typeorm";
import { Refueling } from "./Refueling";
import { User } from "./User";
import { CarEvent } from "./CarEvent";
import { CarMaintenanceInterval } from "./CarMaintenanceInterval";

@Entity()
export class Car {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text' })
    manufacturer!: string;

    @Column({ type: 'text' })
    model!: string;

    @Column({ type: 'integer' })
    year!: number;

    @Column({ type: 'integer' })
    power!: number; // PS/HP

    @Column({ type: 'text' })
    transmission!: string; // Automatik/Manuell

    @Column({ type: 'text' })
    licensePlate!: string;

    @Column({ type: 'text' })
    fuel!: string; // Benzin/Diesel/Elektro/Hybrid

    @Column({ type: 'integer', nullable: true })
    userId!: number;

    @ManyToOne(() => User, user => user.cars)
    user!: User;

    @Column({ type: 'text', nullable: true })
    image?: string;

    @Column({ type: 'integer', nullable: true })
    engineSize?: number; // Hubraum in ccm

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'integer', nullable: true })
    mileage?: number; // Kilometerstand

    @Column({ type: 'text', nullable: true, default: 'PS' })
    powerUnit?: string; // Einheit für Leistung (PS oder kW)

    @Column({ type: 'text', nullable: true, default: 'km' })
    mileageUnit?: string; // Einheit für Kilometerstand (km oder mi)

    @Column({ type: 'real', nullable: true })
    taxCosts?: number; // Jährliche Steuerkosten in EUR

    @Column({ type: 'real', nullable: true })
    insuranceCosts?: number; // Jährliche Versicherungskosten in EUR

    @Column({ type: "simple-json", nullable: true })
    additionalInfo?: {
        vin?: string;
        color?: string;
        lastService?: string;
    };

    // Wartungsintervalle - neue Relation
    @OneToMany(() => CarMaintenanceInterval, interval => interval.car)
    maintenanceIntervals!: CarMaintenanceInterval[];

    // Wartungsintervalle (DEPRECATED - wird durch maintenanceIntervals ersetzt)
    @Column({ type: 'boolean', default: true })
    useStandardIntervals!: boolean;

    // Neue Spalte: Soll das Auto individuelle Wartungsintervalle verwenden?
    @Column('boolean', { default: false, name: 'useIndividualIntervals' })
    useIndividualIntervals!: boolean;

    @Column({ type: "simple-json", nullable: true })
    maintenanceCategories?: {
        id: number;
        name: string;
        timeInterval: number | null; // Monate
        mileageInterval: number | null; // km
        description?: string;
    }[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @OneToMany(() => Refueling, refueling => refueling.car)
    refuelings!: Refueling[];

    @OneToMany(() => CarEvent, event => event.car)
    events!: CarEvent[];

    // Berechnete Felder (werden nicht in der DB gespeichert)
    averageConsumption?: number;
    totalCost?: number;
    totalLiters?: number;
}
