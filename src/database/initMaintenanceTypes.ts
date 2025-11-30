import { AppDataSource } from './connection';
import { MaintenanceType } from './entities/MaintenanceType';
import { 
  MaintenanceType as MaintenanceTypeEnum, 
  MaintenanceTypeLabels,
  DefaultMaintenanceIntervals 
} from './entities/Maintenance';

// Hilfsfunktion um Kategorie für Wartungstyp zu bestimmen
const getCategoryForType = (type: string): string => {
  const categoryMap: Record<string, string[]> = {
    'Motoröl und Filter': [
      'oil_change', 'air_filter', 'cabin_filter', 'fuel_filter'
    ],
    'Zündung': [
      'spark_plugs', 'glow_plugs'
    ],
    'Riemen': [
      'timing_belt', 'drive_belt'
    ],
    'Bremsen': [
      'brake_pads', 'brake_discs', 'brake_fluid'
    ],
    'Flüssigkeiten': [
      'coolant', 'automatic_transmission_fluid', 'manual_transmission_fluid', 'differential_oil', 'power_steering_fluid'
    ],
    'Reifen und Elektronik': [
      'tire_change', 'tire_replacement', 'battery', 'wiper_blades'
    ],
    'Behördliche Termine': [
      'inspection'
    ]
  };
  
  for (const [category, types] of Object.entries(categoryMap)) {
    if (types.includes(type)) {
      return category;
    }
  }
  return 'Sonstiges';
};

// Convert the comprehensive MaintenanceType enum to database format
const defaultMaintenanceTypes = Object.values(MaintenanceTypeEnum).map((typeKey, index) => {
  const intervals = DefaultMaintenanceIntervals[typeKey];
  
  // Create meaningful descriptions based on the type
  const descriptions: Record<string, string> = {
    [MaintenanceTypeEnum.OIL_CHANGE]: 'Motoröl und Ölfilter wechseln',
    [MaintenanceTypeEnum.AIR_FILTER]: 'Luftfilter reinigen oder wechseln',
    [MaintenanceTypeEnum.CABIN_FILTER]: 'Innenraumfilter (Pollenfilter) wechseln',
    [MaintenanceTypeEnum.FUEL_FILTER]: 'Kraftstofffilter wechseln',
    [MaintenanceTypeEnum.SPARK_PLUGS]: 'Zündkerzen prüfen und wechseln (Benziner)',
    [MaintenanceTypeEnum.GLOW_PLUGS]: 'Glühkerzen prüfen und wechseln (Diesel)',
    [MaintenanceTypeEnum.TIMING_BELT]: 'Zahnriemen und Spannrollen wechseln',
    [MaintenanceTypeEnum.DRIVE_BELT]: 'Keil-/Rippenriemen prüfen und wechseln',
    [MaintenanceTypeEnum.BRAKE_PADS]: 'Bremsbeläge prüfen und wechseln',
    [MaintenanceTypeEnum.BRAKE_DISCS]: 'Bremsscheiben prüfen und wechseln',
    [MaintenanceTypeEnum.BRAKE_FLUID]: 'Bremsflüssigkeit wechseln',
    [MaintenanceTypeEnum.COOLANT]: 'Kühlmittel prüfen und wechseln',
    [MaintenanceTypeEnum.AUTOMATIC_TRANSMISSION_FLUID]: 'Automatikgetriebeöl wechseln',
    [MaintenanceTypeEnum.MANUAL_TRANSMISSION_FLUID]: 'Schaltgetriebeöl wechseln',
    [MaintenanceTypeEnum.DIFFERENTIAL_OIL]: 'Differenzialöl wechseln',
    [MaintenanceTypeEnum.POWER_STEERING_FLUID]: 'Servolenkungsöl wechseln',
    [MaintenanceTypeEnum.TIRE_CHANGE]: 'Saisonaler Reifenwechsel (Sommer/Winter)',
    [MaintenanceTypeEnum.TIRE_REPLACEMENT]: 'Reifen auf Verschleiß prüfen und erneuern',
    [MaintenanceTypeEnum.BATTERY]: 'Starterbatterie prüfen und wechseln',
    [MaintenanceTypeEnum.WIPER_BLADES]: 'Scheibenwischerblätter wechseln',
    [MaintenanceTypeEnum.INSPECTION]: 'Gesetzlich vorgeschriebene Hauptuntersuchung (HU/TÜV)',
    [MaintenanceTypeEnum.OTHER]: 'Sonstige Wartungsarbeiten'
  };

  return {
    name: MaintenanceTypeLabels[typeKey],
    description: descriptions[typeKey] || `Wartung: ${MaintenanceTypeLabels[typeKey]}`,
    category: getCategoryForType(typeKey),
    defaultTimeInterval: intervals.intervalMonths || null,
    defaultMileageInterval: intervals.intervalKilometers || null,
    sortOrder: index + 1
  };
});

export const initializeMaintenanceTypes = async () => {
  try {
    const maintenanceTypeRepository = AppDataSource.getRepository(MaintenanceType);
    
    // Prüfen ob bereits Standard-Wartungstypen existieren
    const existingCount = await maintenanceTypeRepository.count({ 
      where: { isStandard: true } 
    });
    
    // Nur initialisieren wenn KEINE Standard-Wartungstypen vorhanden sind
    if (existingCount > 0) {
      console.log(`${existingCount} Standard-Wartungstypen bereits vorhanden. Keine Neuinitialisierung nötig.`);
      return; // Früher Ausstieg - bestehende Daten werden NICHT gelöscht
    }
    
    console.log('Erstelle Standard-Wartungstypen (erste Initialisierung)...');
    
    for (const typeData of defaultMaintenanceTypes) {
      const maintenanceType = new MaintenanceType();
      maintenanceType.name = typeData.name;
      maintenanceType.description = typeData.description;
      maintenanceType.category = typeData.category;
      maintenanceType.defaultTimeInterval = typeData.defaultTimeInterval ?? undefined;
      maintenanceType.defaultMileageInterval = typeData.defaultMileageInterval ?? undefined;
      maintenanceType.isStandard = true;
      maintenanceType.sortOrder = typeData.sortOrder;
      
      await maintenanceTypeRepository.save(maintenanceType);
    }
    
    console.log(`${defaultMaintenanceTypes.length} Standard-Wartungstypen erfolgreich erstellt`);
  } catch (error) {
    console.error('Fehler beim Initialisieren der Standard-Wartungstypen:', error);
  }
};