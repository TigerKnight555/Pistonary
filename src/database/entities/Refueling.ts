import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Car } from "./Car";

@Entity()
export class Refueling {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'datetime' })
    date!: string;

    @Column({ type: 'float' })
    amount!: number;

    @Column({ type: 'float' })
    price!: number;

    @Column({ type: 'integer' })
    mileage!: number;

    @Column({ type: 'boolean', default: false })
    isPartialRefueling!: boolean;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column()
    carId!: number;

    @ManyToOne(() => Car, car => car.refuelings)
    car!: Car;

    @CreateDateColumn()
    created_at!: string;

    @UpdateDateColumn()
    updated_at!: string;
}
