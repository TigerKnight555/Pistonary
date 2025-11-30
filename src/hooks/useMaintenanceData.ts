// DEPRECATED: Dieser Hook ist jetzt nur ein Wrapper um den MaintenanceContext
// Verwende stattdessen useMaintenanceContext direkt
import { useMaintenanceContext } from '../contexts/MaintenanceContext';

export type { MaintenanceStatus } from '../contexts/MaintenanceContext';

export const useMaintenanceData = () => {
  const context = useMaintenanceContext();
  
  // Für Rückwärtskompatibilität: füge ein refreshData alias hinzu
  return {
    ...context,
    refreshData: context.loadData,
    getOverallStatus: () => {
      // Bestimme Gesamtstatus basierend auf allen Wartungstypen
      const allTypes = ['engine_oil', 'oil_filter', 'inspection', 'air_filter', 'cabin_filter', 'brake_fluid'];
      const statuses = allTypes.map(type => context.getMaintenanceStatus(type as any));
      
      // Priorität: overdue > soon > good > not_recorded
      if (statuses.includes('overdue')) return 'overdue';
      if (statuses.includes('soon')) return 'soon';
      if (statuses.some(status => status === 'good')) return 'good';
      return 'not_recorded';
    },
    getAllMaintenanceStatuses: () => {
      const allTypes = ['engine_oil', 'oil_filter', 'inspection', 'air_filter', 'cabin_filter', 'brake_fluid'];
      return allTypes.map(type => ({
        type,
        status: context.getMaintenanceStatus(type as any)
      }));
    }
  };
};