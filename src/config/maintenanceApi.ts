import { API_BASE_URL } from './api';
import type { MaintenanceType, MaintenanceIntervalView } from '../types/Maintenance';

// Standard-Wartungstypen laden
export const getMaintenanceTypes = async (token: string): Promise<MaintenanceType[]> => {
  const response = await fetch(`${API_BASE_URL}/maintenance-intervals/types`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Wartungsintervalle für ein Auto laden
export const getCarMaintenanceIntervals = async (carId: number, token: string): Promise<MaintenanceIntervalView[]> => {
  const response = await fetch(`${API_BASE_URL}/maintenance-intervals/car/${carId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Wartungsintervalle für ein Auto speichern
export const updateCarMaintenanceIntervals = async (
  carId: number, 
  intervals: MaintenanceIntervalView[], 
  token: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/maintenance-intervals/car/${carId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(intervals),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Neuen benutzerdefinierten Wartungstyp erstellen
export const createMaintenanceType = async (
  maintenanceType: Partial<MaintenanceType>, 
  token: string
): Promise<MaintenanceType> => {
  const response = await fetch(`${API_BASE_URL}/maintenance-intervals/types`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(maintenanceType),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Benutzerdefinierten Wartungstyp löschen
export const deleteMaintenanceType = async (
  typeId: number, 
  token: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/maintenance-intervals/types/${typeId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};