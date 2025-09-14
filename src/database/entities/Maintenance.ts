import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Car } from './Car';

@Entity('maintenance')
export class Maintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  carId: number;

  @ManyToOne(() => Car)
  @JoinColumn({ name: 'carId' })
  car: Car;

  @Column({ type: 'text' })
  type: MaintenanceType;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'datetime', nullable: true })
  lastPerformed?: Date;

  @Column({ type: 'integer', nullable: true })
  lastMileage?: number;

  @Column({ type: 'integer', nullable: true })
  intervalMonths?: number;

  @Column({ type: 'integer', nullable: true })
  intervalKilometers?: number;

  @Column({ type: 'datetime', nullable: true })
  nextDue?: Date;

  @Column({ type: 'integer', nullable: true })
  nextMileageDue?: number;

  @Column({ type: 'integer', nullable: true })
  reminderAdvanceDays?: number;

  @Column({ type: 'integer', nullable: true })
  reminderAdvanceKm?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ type: 'text', nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export const MaintenanceType = {
  // Motoröl und Filter
  OIL_CHANGE: 'oil_change',                    // Motoröl + Ölfilter
  AIR_FILTER: 'air_filter',                   // Luftfilter
  CABIN_FILTER: 'cabin_filter',               // Innenraumfilter (Pollen)
  FUEL_FILTER: 'fuel_filter',                 // Kraftstofffilter
  
  // Zündung
  SPARK_PLUGS: 'spark_plugs',                 // Zündkerzen (Benziner)
  GLOW_PLUGS: 'glow_plugs',                   // Glühkerzen (Diesel)
  
  // Riemen
  TIMING_BELT: 'timing_belt',                 // Zahnriemen
  DRIVE_BELT: 'drive_belt',                   // Keil-/Rippenriemen
  
  // Bremsen
  BRAKE_PADS: 'brake_pads',                   // Bremsbeläge
  BRAKE_DISCS: 'brake_discs',                 // Bremsscheiben
  BRAKE_FLUID: 'brake_fluid',                 // Bremsflüssigkeit
  
  // Flüssigkeiten
  COOLANT: 'coolant',                         // Kühlmittel
  AUTOMATIC_TRANSMISSION_FLUID: 'automatic_transmission_fluid', // Automatikgetriebeöl
  MANUAL_TRANSMISSION_FLUID: 'manual_transmission_fluid',       // Schaltgetriebeöl
  DIFFERENTIAL_OIL: 'differential_oil',       // Differenzialöl
  POWER_STEERING_FLUID: 'power_steering_fluid', // Servolenkungsöl
  
  // Reifen und Räder
  TIRE_CHANGE: 'tire_change',                 // Reifen
  
  // Elektronik
  BATTERY: 'battery',                         // Batterie (Starterbatterie)
  
  // Sonstiges
  WIPER_BLADES: 'wiper_blades',              // Scheibenwischerblätter
  
  // Behördliche Termine
  INSPECTION: 'inspection',                   // HU/TÜV
  OTHER: 'other'                             // Sonstiges
} as const;

export type MaintenanceType = typeof MaintenanceType[keyof typeof MaintenanceType];

export const MaintenanceTypeLabels: Record<MaintenanceType, string> = {
  [MaintenanceType.OIL_CHANGE]: 'Motoröl + Ölfilter',
  [MaintenanceType.AIR_FILTER]: 'Luftfilter',
  [MaintenanceType.CABIN_FILTER]: 'Innenraumfilter (Pollen)',
  [MaintenanceType.FUEL_FILTER]: 'Kraftstofffilter',
  [MaintenanceType.SPARK_PLUGS]: 'Zündkerzen (Benziner)',
  [MaintenanceType.GLOW_PLUGS]: 'Glühkerzen (Diesel)',
  [MaintenanceType.TIMING_BELT]: 'Zahnriemen',
  [MaintenanceType.DRIVE_BELT]: 'Keil-/Rippenriemen',
  [MaintenanceType.BRAKE_PADS]: 'Bremsbeläge',
  [MaintenanceType.BRAKE_DISCS]: 'Bremsscheiben',
  [MaintenanceType.BRAKE_FLUID]: 'Bremsflüssigkeit',
  [MaintenanceType.COOLANT]: 'Kühlmittel',
  [MaintenanceType.AUTOMATIC_TRANSMISSION_FLUID]: 'Automatikgetriebeöl',
  [MaintenanceType.MANUAL_TRANSMISSION_FLUID]: 'Schaltgetriebeöl',
  [MaintenanceType.DIFFERENTIAL_OIL]: 'Differenzialöl',
  [MaintenanceType.POWER_STEERING_FLUID]: 'Servolenkungsöl',
  [MaintenanceType.TIRE_CHANGE]: 'Reifen',
  [MaintenanceType.BATTERY]: 'Batterie (Starterbatterie)',
  [MaintenanceType.WIPER_BLADES]: 'Scheibenwischerblätter',
  [MaintenanceType.INSPECTION]: 'HU/TÜV',
  [MaintenanceType.OTHER]: 'Sonstiges'
};

export const MaintenanceTypeIcons: Record<MaintenanceType, string> = {
  [MaintenanceType.OIL_CHANGE]: '🛢️',
  [MaintenanceType.AIR_FILTER]: '🌬️',
  [MaintenanceType.CABIN_FILTER]: '🌿',
  [MaintenanceType.FUEL_FILTER]: '⛽',
  [MaintenanceType.SPARK_PLUGS]: '⚡',
  [MaintenanceType.GLOW_PLUGS]: '🔥',
  [MaintenanceType.TIMING_BELT]: '⚙️',
  [MaintenanceType.DRIVE_BELT]: '🔗',
  [MaintenanceType.BRAKE_PADS]: '🛑',
  [MaintenanceType.BRAKE_DISCS]: '💿',
  [MaintenanceType.BRAKE_FLUID]: '🟦',
  [MaintenanceType.COOLANT]: '❄️',
  [MaintenanceType.AUTOMATIC_TRANSMISSION_FLUID]: '🔄',
  [MaintenanceType.MANUAL_TRANSMISSION_FLUID]: '⚙️',
  [MaintenanceType.DIFFERENTIAL_OIL]: '🔧',
  [MaintenanceType.POWER_STEERING_FLUID]: '🎯',
  [MaintenanceType.TIRE_CHANGE]: '🛞',
  [MaintenanceType.BATTERY]: '🔋',
  [MaintenanceType.WIPER_BLADES]: '🧽',
  [MaintenanceType.INSPECTION]: '🔍',
  [MaintenanceType.OTHER]: '🔧'
};

// Standard-Wartungsintervalle basierend auf der Tabelle
export const DefaultMaintenanceIntervals: Record<MaintenanceType, { intervalKilometers?: number; intervalMonths?: number; reminderAdvanceKm?: number; reminderAdvanceDays?: number }> = {
  [MaintenanceType.OIL_CHANGE]: {
    intervalKilometers: 15000,
    intervalMonths: 12,
    reminderAdvanceKm: 1000,
    reminderAdvanceDays: 14
  },
  [MaintenanceType.AIR_FILTER]: {
    intervalKilometers: 30000,
    intervalMonths: 24,
    reminderAdvanceKm: 2000,
    reminderAdvanceDays: 30
  },
  [MaintenanceType.CABIN_FILTER]: {
    intervalKilometers: 15000,
    intervalMonths: 12,
    reminderAdvanceKm: 1000,
    reminderAdvanceDays: 14
  },
  [MaintenanceType.FUEL_FILTER]: {
    intervalKilometers: 60000,
    intervalMonths: 48,
    reminderAdvanceKm: 5000,
    reminderAdvanceDays: 60
  },
  [MaintenanceType.SPARK_PLUGS]: {
    intervalKilometers: 60000,
    intervalMonths: 48,
    reminderAdvanceKm: 5000,
    reminderAdvanceDays: 60
  },
  [MaintenanceType.GLOW_PLUGS]: {
    intervalKilometers: 120000,
    intervalMonths: 72,
    reminderAdvanceKm: 10000,
    reminderAdvanceDays: 90
  },
  [MaintenanceType.TIMING_BELT]: {
    intervalKilometers: 120000,
    intervalMonths: 72,
    reminderAdvanceKm: 10000,
    reminderAdvanceDays: 90
  },
  [MaintenanceType.DRIVE_BELT]: {
    intervalKilometers: 90000,
    intervalMonths: 72,
    reminderAdvanceKm: 8000,
    reminderAdvanceDays: 90
  },
  [MaintenanceType.BRAKE_PADS]: {
    intervalKilometers: 40000,
    reminderAdvanceKm: 3000,
    reminderAdvanceDays: 30
  },
  [MaintenanceType.BRAKE_DISCS]: {
    intervalKilometers: 80000,
    reminderAdvanceKm: 5000,
    reminderAdvanceDays: 60
  },
  [MaintenanceType.BRAKE_FLUID]: {
    intervalMonths: 24,
    reminderAdvanceDays: 30
  },
  [MaintenanceType.COOLANT]: {
    intervalMonths: 48,
    reminderAdvanceDays: 60
  },
  [MaintenanceType.AUTOMATIC_TRANSMISSION_FLUID]: {
    intervalKilometers: 80000,
    intervalMonths: 72,
    reminderAdvanceKm: 5000,
    reminderAdvanceDays: 90
  },
  [MaintenanceType.MANUAL_TRANSMISSION_FLUID]: {
    intervalKilometers: 100000,
    intervalMonths: 96,
    reminderAdvanceKm: 8000,
    reminderAdvanceDays: 120
  },
  [MaintenanceType.DIFFERENTIAL_OIL]: {
    intervalKilometers: 100000,
    intervalMonths: 96,
    reminderAdvanceKm: 8000,
    reminderAdvanceDays: 120
  },
  [MaintenanceType.POWER_STEERING_FLUID]: {
    intervalKilometers: 100000,
    intervalMonths: 96,
    reminderAdvanceKm: 8000,
    reminderAdvanceDays: 120
  },
  [MaintenanceType.TIRE_CHANGE]: {
    intervalKilometers: 40000,
    intervalMonths: 72,
    reminderAdvanceKm: 3000,
    reminderAdvanceDays: 90
  },
  [MaintenanceType.BATTERY]: {
    intervalMonths: 60,
    reminderAdvanceDays: 60
  },
  [MaintenanceType.WIPER_BLADES]: {
    intervalMonths: 12,
    reminderAdvanceDays: 14
  },
  [MaintenanceType.INSPECTION]: {
    intervalMonths: 24,
    reminderAdvanceDays: 30
  },
  [MaintenanceType.OTHER]: {
    reminderAdvanceDays: 7
  }
};

// Hilfsfunktion um Standard-Intervalle für einen Wartungstyp zu erhalten
export function getDefaultIntervals(type: MaintenanceType) {
  return DefaultMaintenanceIntervals[type] || {};
}