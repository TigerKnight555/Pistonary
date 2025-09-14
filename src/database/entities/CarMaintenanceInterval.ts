import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Car } from './Car';
import { MaintenanceType } from './MaintenanceType';

@Entity('car_maintenance_intervals')
@Index(['carId', 'maintenanceTypeId'], { unique: true }) // Ein Auto kann nur ein Intervall pro Wartungstyp haben
export class CarMaintenanceInterval {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'car_id' })
  carId!: number;

  @Column({ type: 'integer', name: 'maintenance_type_id' })
  maintenanceTypeId!: number;

  @Column({ type: 'integer', nullable: true, name: 'time_interval' })
  timeInterval?: number; // in Monaten, null = deaktiviert

  @Column({ type: 'integer', nullable: true, name: 'mileage_interval' })
  mileageInterval?: number; // in Kilometern, null = deaktiviert

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean; // false = Wartung für dieses Auto deaktiviert

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt!: Date;

  // Relationen
  @ManyToOne(() => Car, car => car.maintenanceIntervals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'car_id' })
  car!: Car;

  @ManyToOne(() => MaintenanceType, maintenanceType => maintenanceType.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'maintenance_type_id' })
  maintenanceType!: MaintenanceType;
}