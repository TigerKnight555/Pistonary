import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('maintenance_types')
export class MaintenanceType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'integer', nullable: true, name: 'default_time_interval' })
  defaultTimeInterval?: number; // in Monaten

  @Column({ type: 'integer', nullable: true, name: 'default_mileage_interval' })
  defaultMileageInterval?: number; // in Kilometern

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string; // Kategorie wie "Motoröl und Filter", "Bremsen", etc.

  @Column({ type: 'boolean', default: true, name: 'is_standard' })
  isStandard!: boolean; // true für Standard-Kategorien, false für benutzerdefinierte

  @Column({ type: 'integer', default: 0, name: 'sort_order' })
  sortOrder!: number; // für Sortierung in der UI

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt!: Date;
}