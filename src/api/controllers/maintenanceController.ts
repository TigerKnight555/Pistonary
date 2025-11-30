import type { Request, Response } from 'express';
import { AppDataSource } from '../../database/connection';
import { MaintenanceType } from '../../database/entities/MaintenanceType';
import { CarMaintenanceInterval } from '../../database/entities/CarMaintenanceInterval';
import { Car } from '../../database/entities/Car';
import { Maintenance } from '../../database/entities/Maintenance';

const maintenanceTypeRepository = () => AppDataSource.getRepository(MaintenanceType);
const carMaintenanceIntervalRepository = () => AppDataSource.getRepository(CarMaintenanceInterval);
const carRepository = () => AppDataSource.getRepository(Car);
const maintenanceRepository = () => AppDataSource.getRepository(Maintenance);

// Standard-Wartungstypen laden
export const getMaintenanceTypes = async (_req: Request, res: Response) => {
  try {
    const maintenanceTypes = await maintenanceTypeRepository().find({
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
    res.json(maintenanceTypes);
  } catch (error) {
    console.error('Error fetching maintenance types:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Wartungstypen' });
  }
};

// Wartungsintervalle für ein bestimmtes Auto laden
export const getCarMaintenanceIntervals = async (req: Request, res: Response) => {
  try {
    const { carId } = req.params;
    
    // Alle Standard-Wartungstypen laden
    const maintenanceTypes = await maintenanceTypeRepository().find({
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
    
    // Individuelle Einstellungen für dieses Auto laden
    const carIntervals = await carMaintenanceIntervalRepository().find({
      where: { carId: parseInt(carId) },
      relations: ['maintenanceType']
    });
    
    // Kombinierte Ansicht erstellen
    const intervals = maintenanceTypes.map(type => {
      const carInterval = carIntervals.find(ci => ci.maintenanceTypeId === type.id);
      
      return {
        id: type.id,
        name: type.name,
        description: type.description,
        timeInterval: carInterval?.timeInterval ?? type.defaultTimeInterval,
        mileageInterval: carInterval?.mileageInterval ?? type.defaultMileageInterval,
        isActive: carInterval?.isActive ?? true,
        isCustomized: !!carInterval,
        maintenanceTypeId: type.id,
        carMaintenanceIntervalId: carInterval?.id
      };
    });
    
    res.json(intervals);
  } catch (error) {
    console.error('Error fetching car maintenance intervals:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Wartungsintervalle' });
  }
};

// Wartungsintervalle für ein Auto speichern/aktualisieren
export const updateCarMaintenanceIntervals = async (req: Request, res: Response) => {
  try {
    const { carId } = req.params;
    const intervals = req.body; // Array von MaintenanceIntervalView
    
    // Überprüfen ob das Auto existiert
    const car = await carRepository().findOne({ where: { id: parseInt(carId) } });
    if (!car) {
      return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });
    }
    
    // Alle bestehenden Intervalle für dieses Auto löschen
    await carMaintenanceIntervalRepository().delete({ carId: parseInt(carId) });
    
    // Neue Intervalle erstellen (nur für angepasste Werte)
    for (const interval of intervals) {
      // Prüfen ob der Wartungstyp existiert
      const maintenanceType = await maintenanceTypeRepository().findOne({ 
        where: { id: interval.maintenanceTypeId } 
      });
      
      if (!maintenanceType) {
        continue; // Wartungstyp nicht gefunden, überspringen
      }
      
      // Nur speichern wenn sich die Werte von den Standards unterscheiden
      const hasCustomTimeInterval = interval.timeInterval !== maintenanceType.defaultTimeInterval;
      const hasCustomMileageInterval = interval.mileageInterval !== maintenanceType.defaultMileageInterval;
      const isInactive = !interval.isActive;
      
      if (hasCustomTimeInterval || hasCustomMileageInterval || isInactive) {
        const carInterval = new CarMaintenanceInterval();
        carInterval.carId = parseInt(carId);
        carInterval.maintenanceTypeId = interval.maintenanceTypeId;
        carInterval.timeInterval = interval.timeInterval;
        carInterval.mileageInterval = interval.mileageInterval;
        carInterval.isActive = interval.isActive;
        
        await carMaintenanceIntervalRepository().save(carInterval);
      }
    }
    
    res.json({ success: true, message: 'Wartungsintervalle erfolgreich gespeichert' });
  } catch (error) {
    console.error('Error updating car maintenance intervals:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Wartungsintervalle' });
  }
};

// Neuen Wartungstyp erstellen (benutzerdefiniert)
export const createMaintenanceType = async (req: Request, res: Response) => {
  try {
    const { name, description, defaultTimeInterval, defaultMileageInterval } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }
    
    const maintenanceType = new MaintenanceType();
    maintenanceType.name = name;
    maintenanceType.description = description;
    maintenanceType.defaultTimeInterval = defaultTimeInterval;
    maintenanceType.defaultMileageInterval = defaultMileageInterval;
    maintenanceType.isStandard = false; // Benutzerdefiniert
    maintenanceType.sortOrder = 1000; // Benutzerdefinierte am Ende
    
    const saved = await maintenanceTypeRepository().save(maintenanceType);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating maintenance type:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Wartungstyps' });
  }
};

// Wartungstyp löschen (nur benutzerdefinierte)
export const deleteMaintenanceType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const maintenanceType = await maintenanceTypeRepository().findOne({ 
      where: { id: parseInt(id) } 
    });
    
    if (!maintenanceType) {
      return res.status(404).json({ error: 'Wartungstyp nicht gefunden' });
    }
    
    if (maintenanceType.isStandard) {
      return res.status(400).json({ error: 'Standard-Wartungstypen können nicht gelöscht werden' });
    }
    
    // Zuerst alle CarMaintenanceInterval-Einträge löschen
    await carMaintenanceIntervalRepository().delete({ maintenanceTypeId: parseInt(id) });
    
    // Dann den MaintenanceType löschen
    await maintenanceTypeRepository().delete(parseInt(id));
    
    res.json({ success: true, message: 'Wartungstyp erfolgreich gelöscht' });
  } catch (error) {
    console.error('Error deleting maintenance type:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Wartungstyps' });
  }
};

// === MAINTENANCE RECORDS ===

// Get all maintenance records for a car
export const getMaintenanceByCarId = async (req: Request, res: Response) => {
  try {
    const carId = parseInt(req.params.carId);
    
    console.log('Loading maintenance records for car:', carId);
    
    const maintenanceRecords = await maintenanceRepository().findBy({ carId });
    console.log('Found maintenance records:', maintenanceRecords.length);
    
    res.json(maintenanceRecords);
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Wartungsdaten' });
  }
};

// Create new maintenance record
export const createMaintenance = async (req: Request, res: Response) => {
  try {
    const maintenanceData = req.body;
    
    console.log('Creating new maintenance record:', maintenanceData);
    
    const repo = maintenanceRepository();
    const newMaintenance = repo.create(maintenanceData);
    const savedMaintenance = await repo.save(newMaintenance);
    
    console.log('Maintenance created with ID:', (savedMaintenance as any).id);
    
    res.status(201).json(savedMaintenance);
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Wartung' });
  }
};

// Update maintenance record
export const updateMaintenance = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updateData = req.body;
    
    console.log('Updating maintenance record:', id, updateData);
    
    const repo = maintenanceRepository();
    const maintenance = await repo.findOneBy({ id });
    
    if (!maintenance) {
      return res.status(404).json({ error: 'Wartung nicht gefunden' });
    }
    
    // Update the maintenance record
    Object.assign(maintenance, updateData);
    const updatedMaintenance = await repo.save(maintenance);
    
    console.log('Maintenance updated successfully:', updatedMaintenance);
    
    res.json(updatedMaintenance);
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Wartung' });
  }
};

// Delete maintenance record
export const deleteMaintenance = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    console.log('Deleting maintenance record:', id);
    
    const maintenance = await maintenanceRepository().findOneBy({ id });
    
    if (!maintenance) {
      return res.status(404).json({ error: 'Wartung nicht gefunden' });
    }
    
    await maintenanceRepository().remove(maintenance);
    console.log('Maintenance deleted successfully:', maintenance.name);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Wartung' });
  }
};