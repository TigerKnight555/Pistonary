// Standard-Wartungskategorien (aus der Datenbank)
export interface MaintenanceType {
  id: number;
  name: string;
  description?: string;
  defaultTimeInterval?: number; // in Monaten
  defaultMileageInterval?: number; // in Kilometern
  isStandard: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Individuelle Wartungsintervalle pro Fahrzeug
export interface CarMaintenanceInterval {
  id: number;
  carId: number;
  maintenanceTypeId: number;
  timeInterval?: number; // in Monaten, null = deaktiviert
  mileageInterval?: number; // in Kilometern, null = deaktiviert
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  maintenanceType?: MaintenanceType; // Wird über JOIN geladen
}

// Kombinierte Ansicht für das Frontend
export interface MaintenanceIntervalView {
  id: number; // maintenanceTypeId
  name: string; // aus MaintenanceType
  description?: string; // aus MaintenanceType
  timeInterval?: number; // aus CarMaintenanceInterval oder Default
  mileageInterval?: number; // aus CarMaintenanceInterval oder Default
  isActive: boolean; // aus CarMaintenanceInterval
  isCustomized: boolean; // true wenn CarMaintenanceInterval existiert
  maintenanceTypeId: number;
  carMaintenanceIntervalId?: number; // ID des CarMaintenanceInterval-Eintrags falls vorhanden
}