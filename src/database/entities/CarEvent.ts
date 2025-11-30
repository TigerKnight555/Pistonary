import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Car } from './Car';

// Event Types als const assertion für TypeScript
export const EventType = {
    MAINTENANCE: 'maintenance',        // Wartung
    REPAIR: 'repair',                 // Reparatur
    MODIFICATION: 'modification',      // Modifikation
    INSPECTION: 'inspection',         // Inspektion
    TIRE_CHANGE: 'tire_change',       // Reifenwechsel
    ENGINE_OIL: 'engine_oil',         // Motoröl
    OIL_FILTER: 'oil_filter',         // Ölfilter
    SPARK_PLUGS: 'spark_plugs',       // Zündkerzen
    FILTER_CHANGE: 'filter_change',   // Filter wechseln
    BRAKE_SERVICE: 'brake_service',   // Bremsenservice
    OTHER: 'other'                    // Sonstiges
} as const;

export type EventTypeKey = typeof EventType[keyof typeof EventType];

@Entity()
export class CarEvent {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text' })
    title!: string;

    @Column('text', { nullable: true })
    description?: string;

    @Column('date')
    date!: string;

    @Column('int', { nullable: true })
    mileage?: number; // Kilometerstand zum Zeitpunkt des Ereignisses

    @Column({
        type: 'varchar',
        default: EventType.OTHER
    })
    type!: EventTypeKey;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    cost?: number; // Kosten des Ereignisses

    @Column('text', { nullable: true })
    notes?: string; // Zusätzliche Notizen

    // Beziehung zum Auto
    @Column({ type: 'integer' })
    carId!: number;

    @ManyToOne(() => Car, car => car.events)
    car!: Car;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
