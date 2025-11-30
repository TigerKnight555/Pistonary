import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Car } from './Car';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text', unique: true })
    email!: string;

    @Column({ type: 'text' })
    name!: string;

    @Column({ type: 'text' })
    password!: string;

    @Column({ type: 'integer', nullable: true })
    selectedCarId?: number;

    @OneToMany(() => Car, car => car.userId)
    cars!: Car[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
