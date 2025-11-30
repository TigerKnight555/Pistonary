import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api';
import { MaintenanceType } from '../database/entities/Maintenance';
import type { Maintenance } from '../database/entities/Maintenance';
import type { Refueling } from '../database/entities/Refueling';
import type { Car } from '../database/entities/Car';
import type { MaintenanceIntervalView } from '../types/Maintenance';

// Investment Type
interface Investment {
  id: number;
  carId: number;
  date: string;
  description: string;
  amount: number;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Status Types
export type MaintenanceStatus = 'not_recorded' | 'good' | 'soon' | 'overdue';

interface MaintenanceContextType {
  maintenances: Maintenance[];
  refuelings: Refueling[];
  investments: Investment[];
  car: Car | null;
  individualIntervals: MaintenanceIntervalView[];
  loading: boolean;
  loadData: () => Promise<void>;
  getCurrentMileage: () => number;
  getIntervalForMaintenanceType: (maintenanceType: MaintenanceType) => { intervalMonths?: number; intervalKilometers?: number };
  getMaintenanceStatus: (maintenanceType: MaintenanceType) => MaintenanceStatus;
  getNextDueDate: (maintenanceType: MaintenanceType) => Date | null;
  getNextDueMileage: (maintenanceType: MaintenanceType) => number | null;
  getDaysUntilDue: (maintenanceType: MaintenanceType) => number | null;
  getKilometersUntilDue: (maintenanceType: MaintenanceType) => number | null;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const useMaintenanceContext = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenanceContext must be used within a MaintenanceProvider');
  }
  return context;
};

interface MaintenanceProviderProps {
  children: React.ReactNode;
}

export const MaintenanceProvider: React.FC<MaintenanceProviderProps> = ({ children }) => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [refuelings, setRefuelings] = useState<Refueling[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [car, setCar] = useState<Car | null>(null);
  const [individualIntervals, setIndividualIntervals] = useState<MaintenanceIntervalView[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, selectedCarId } = useAuth();

  // Lade alle Daten
  const loadData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Verwende die selectedCarId aus dem Auth-Context
      const carId = selectedCarId;
      
      if (!carId) {
        throw new Error('Kein Auto ausgewählt');
      }

      // Lade Wartungen (korrekte carId verwenden)
      const maintenanceResponse = await fetch(`${API_BASE_URL}/maintenance/${carId}`, { headers });
      const maintenanceData = await maintenanceResponse.json();

      // Lade Betankungen (korrekte carId verwenden)
      const refuelingResponse = await fetch(`${API_BASE_URL}/refuelings/car/${carId}`, { headers });
      const refuelingData = await refuelingResponse.json();

      // Lade Auto-Daten
      const carResponse = await fetch(`${API_BASE_URL}/cars/${carId}`, { headers });
      const carData = await carResponse.json();

      // Lade Investitionen
      let investmentsData: Investment[] = [];
      try {
        const investmentsResponse = await fetch(`${API_BASE_URL}/investments/car/${carId}`, { headers });
        if (investmentsResponse.ok) {
          investmentsData = await investmentsResponse.json();
        }
      } catch (investmentError) {
        console.error('Fehler beim Laden der Investitionen:', investmentError);
      }

      // Lade individuelle Wartungsintervalle (falls das Auto sie verwendet)
      // WORKAROUND: Lade immer die individuellen Intervalle, da das useIndividualIntervals Feld Backend-Probleme hat
      let individualIntervalsData: MaintenanceIntervalView[] = [];
      try {
        const intervalsResponse = await fetch(`${API_BASE_URL}/maintenance-intervals/car/${carId}`, { headers });
        if (intervalsResponse.ok) {
          individualIntervalsData = await intervalsResponse.json();
        }
      } catch (intervalError) {
        console.error('Fehler beim Laden der individuellen Wartungsintervalle:', intervalError);
      }

      console.log('MaintenanceContext - Daten geladen:', {
        maintenances: maintenanceData?.length || 0,
        refuelings: refuelingData?.length || 0,
        investments: investmentsData?.length || 0,
        car: carData,
        useIndividualIntervals: carData?.useIndividualIntervals,
        individualIntervals: individualIntervalsData?.length || 0
      });

      setMaintenances(maintenanceData || []);
      setRefuelings(refuelingData || []);
      setInvestments(investmentsData || []);
      setCar(carData || null);
      setIndividualIntervals(individualIntervalsData || []);
    } catch (error) {
      console.error('Fehler beim Laden der Wartungsdaten:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Berechne aktuellen Kilometerstand
  const getCurrentMileage = useCallback((): number => {
    if (maintenances.length === 0 && refuelings.length === 0) return 0;
    
    const allMileages = [
      ...maintenances.map(m => m.lastMileage || 0),
      ...refuelings.map(r => r.mileage || 0)
    ];
    
    return Math.max(...allMileages);
  }, [maintenances, refuelings]);

  // Hilfsfunktion: Hole die richtigen Intervalle basierend auf der Auto-Konfiguration
  const getIntervalForMaintenanceType = useCallback((maintenanceType: MaintenanceType): { intervalMonths?: number; intervalKilometers?: number } => {
    // Prüfe die Auto-Konfiguration für Wartungsintervalle
    const hasIndividualData = individualIntervals && individualIntervals.length > 0;
    const shouldUseStandardIntervals = car?.useStandardIntervals ?? true; // Default: Standard verwenden
    const shouldUseIndividualIntervals = car?.useIndividualIntervals ?? false; // Default: Individuelle nicht verwenden
    
    // Wenn explizit individuelle Intervalle gewählt wurden UND Daten vorhanden sind
    const useIndividualLogic = shouldUseIndividualIntervals && hasIndividualData;

    console.log('getIntervalForMaintenanceType:', {
      maintenanceType,
      hasIndividualData,
      shouldUseStandardIntervals,
      shouldUseIndividualIntervals,
      useIndividualLogic,
      individualIntervalsCount: individualIntervals?.length || 0,
      carUseStandardIntervals: car?.useStandardIntervals,
      carUseIndividualIntervals: car?.useIndividualIntervals
    });

    if (useIndividualLogic) {
      // Erstelle ein Mapping zwischen MaintenanceType enum und Namen in der Datenbank
      const typeNameMapping: Record<string, string> = {
        'engine_oil': 'Motoröl',
        'oil_filter': 'Ölfilter',
        'air_filter': 'Luftfilter',
        'cabin_filter': 'Innenraumfilter',
        'fuel_filter': 'Kraftstofffilter', 
        'spark_plugs': 'Zündkerzen',
        'glow_plugs': 'Glühkerzen',
        'timing_belt': 'Zahnriemen',
        'drive_belt': 'Keil-/Rippenriemen',
        'brake_pads': 'Bremsbeläge',
        'brake_discs': 'Bremsscheiben',
        'brake_fluid': 'Bremsflüssigkeit',
        'coolant': 'Kühlmittel',
        'automatic_transmission_fluid': 'Automatikgetriebeöl',
        'manual_transmission_fluid': 'Schaltgetriebeöl',
        'differential_oil': 'Differenzialöl',
        'power_steering_fluid': 'Servolenkungsöl',
        'tire_change': 'Reifen',
        'battery': 'Batterie',
        'wiper_blades': 'Scheibenwischerblätter',
        'inspection': 'HU/TÜV',
        'other': 'Sonstiges'
      };

      const expectedName = typeNameMapping[maintenanceType];
      
      // Suche nach dem passenden Intervall in den geladenen Daten über den Namen
      const individualInterval = individualIntervals.find(interval => 
        interval.name === expectedName
      );
      
      console.log('Individual interval lookup:', {
        expectedName,
        foundInterval: individualInterval,
        allIntervalNames: individualIntervals.map(i => i.name)
      });
      
      if (individualInterval) {
        return {
          intervalMonths: individualInterval.timeInterval || undefined,
          intervalKilometers: individualInterval.mileageInterval || undefined
        };
      }
    }

    // Standard-Intervalle verwenden
    // Diese müssten aus einer Konfiguration oder den Default-Intervallen kommen
    // Hier verwenden wir die Standardwerte aus der Maintenance.ts
    return getDefaultIntervals(maintenanceType);
  }, [car, individualIntervals]);

  // Berechne Wartungsstatus (basierend auf der neuesten Wartung pro Typ)
  const getMaintenanceStatus = useCallback((maintenanceType: MaintenanceType): MaintenanceStatus => {
    // Finde die neueste Wartung für diesen Typ
    const maintenancesOfType = maintenances
      .filter(m => m.type === maintenanceType)
      .sort((a, b) => {
        // Sortiere nach Datum (neueste zuerst)
        const dateA = a.lastPerformed ? new Date(a.lastPerformed).getTime() : 0;
        const dateB = b.lastPerformed ? new Date(b.lastPerformed).getTime() : 0;
        return dateB - dateA;
      });
    
    const maintenance = maintenancesOfType[0]; // Neueste Wartung
    
    if (!maintenance) {
      return 'not_recorded';
    }

    const intervals = getIntervalForMaintenanceType(maintenanceType);
    const currentMileage = getCurrentMileage();
    const today = new Date();

    let isOverdue = false;

    // Prüfe Kilometerstand-basierte Fälligkeit
    if (intervals.intervalKilometers && maintenance.lastMileage) {
      const nextMileageDue = maintenance.lastMileage + intervals.intervalKilometers;
      if (currentMileage >= nextMileageDue) {
        isOverdue = true;
      }
    }

    // Prüfe Zeit-basierte Fälligkeit
    if (intervals.intervalMonths && maintenance.lastPerformed) {
      const lastPerformedDate = new Date(maintenance.lastPerformed);
      const nextDueDate = new Date(lastPerformedDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + intervals.intervalMonths);
      
      if (today >= nextDueDate) {
        isOverdue = true;
      }
    }

    if (isOverdue) {
      return 'overdue';
    }

    // Prüfe "soon" Status (innerhalb der nächsten 30 Tage oder 1000km)
    let isSoon = false;

    if (intervals.intervalKilometers && maintenance.lastMileage) {
      const nextMileageDue = maintenance.lastMileage + intervals.intervalKilometers;
      if (currentMileage >= (nextMileageDue - 1000)) {
        isSoon = true;
      }
    }

    if (intervals.intervalMonths && maintenance.lastPerformed) {
      const lastPerformedDate = new Date(maintenance.lastPerformed);
      const nextDueDate = new Date(lastPerformedDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + intervals.intervalMonths);
      
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      if (nextDueDate <= thirtyDaysFromNow) {
        isSoon = true;
      }
    }

    return isSoon ? 'soon' : 'good';
  }, [maintenances, getIntervalForMaintenanceType, getCurrentMileage]);

  // Weitere Hilfsfunktionen...
  const getNextDueDate = useCallback((maintenanceType: MaintenanceType): Date | null => {
    const maintenance = maintenances.find(m => m.type === maintenanceType);
    if (!maintenance || !maintenance.lastPerformed) return null;

    const intervals = getIntervalForMaintenanceType(maintenanceType);
    if (!intervals.intervalMonths) return null;

    const lastPerformedDate = new Date(maintenance.lastPerformed);
    const nextDueDate = new Date(lastPerformedDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + intervals.intervalMonths);
    
    return nextDueDate;
  }, [maintenances, getIntervalForMaintenanceType]);

  const getNextDueMileage = useCallback((maintenanceType: MaintenanceType): number | null => {
    const maintenance = maintenances.find(m => m.type === maintenanceType);
    if (!maintenance || !maintenance.lastMileage) return null;

    const intervals = getIntervalForMaintenanceType(maintenanceType);
    if (!intervals.intervalKilometers) return null;

    return maintenance.lastMileage + intervals.intervalKilometers;
  }, [maintenances, getIntervalForMaintenanceType]);

  const getDaysUntilDue = useCallback((maintenanceType: MaintenanceType): number | null => {
    const nextDueDate = getNextDueDate(maintenanceType);
    if (!nextDueDate) return null;

    const today = new Date();
    const diffTime = nextDueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [getNextDueDate]);

  const getKilometersUntilDue = useCallback((maintenanceType: MaintenanceType): number | null => {
    const nextMileageDue = getNextDueMileage(maintenanceType);
    if (!nextMileageDue) return null;

    const currentMileage = getCurrentMileage();
    return Math.max(0, nextMileageDue - currentMileage);
  }, [getNextDueMileage, getCurrentMileage]);

  const value: MaintenanceContextType = {
    maintenances,
    refuelings,
    investments,
    car,
    individualIntervals,
    loading,
    loadData,
    getCurrentMileage,
    getIntervalForMaintenanceType,
    getMaintenanceStatus,
    getNextDueDate,
    getNextDueMileage,
    getDaysUntilDue,
    getKilometersUntilDue,
  };

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
};

// Helper function for default intervals (imported from Maintenance.ts)
function getDefaultIntervals(type: MaintenanceType): { intervalMonths?: number; intervalKilometers?: number } {
  // Diese Funktion sollte aus der Maintenance.ts importiert werden
  // Für jetzt verwende ich einige Standard-Intervalle als Fallback
  const defaultIntervals: Record<string, { intervalMonths?: number; intervalKilometers?: number }> = {
    'engine_oil': { intervalKilometers: 12000, intervalMonths: 12 },
    'oil_filter': { intervalKilometers: 12000, intervalMonths: 12 },
    'inspection': { intervalMonths: 24 },
    'air_filter': { intervalKilometers: 30000, intervalMonths: 24 },
    'cabin_filter': { intervalKilometers: 15000, intervalMonths: 12 },
    'brake_fluid': { intervalMonths: 24 },
    'spark_plugs': { intervalKilometers: 60000, intervalMonths: 48 },
    'timing_belt': { intervalKilometers: 120000, intervalMonths: 72 },
    // ... weitere Standard-Intervalle
  };

  return defaultIntervals[type] || {};
}