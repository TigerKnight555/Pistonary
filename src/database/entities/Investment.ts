import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Car } from './Car';

@Entity('investments')
export class Investment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  carId!: number;

  @ManyToOne(() => Car)
  @JoinColumn({ name: 'carId' })
  car!: Car;

  @Column({ type: 'datetime' })
  date!: Date;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'real' })
  amount!: number;

  @Column({ type: 'text', nullable: true })
  category?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
