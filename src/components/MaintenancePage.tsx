import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Container,
  Grid,
  Divider,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  BuildCircle as MaintenanceIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ViewModule as CardViewIcon,
  TableRows as TableViewIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import AddMaintenanceDialog from './AddMaintenanceDialog';
import EditMaintenanceDialog from './EditMaintenanceDialog';
import DeleteMaintenanceDialog from './DeleteMaintenanceDialog';
import MaintenanceCategorySelectionDialog from './MaintenanceCategorySelectionDialog';
import MaintenanceDataTable from './MaintenanceDataTable';
import { MaintenanceType, MaintenanceTypeLabels, MaintenanceTypeIcons, getDefaultIntervals } from '../database/entities/Maintenance';
import type { Maintenance } from '../database/entities/Maintenance';
import type { Car } from '../types/Car';
import { API_BASE_URL } from '../config/api';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useMaintenanceData, type MaintenanceStatus } from '../hooks/useMaintenanceData';

// Distanz-Einheiten
const DistanceUnits = {
  KILOMETERS: 'km',
  MILES: 'miles'
} as const;

type DistanceUnit = typeof DistanceUnits[keyof typeof DistanceUnits];

const DistanceUnitLabels = {
  [DistanceUnits.KILOMETERS]: 'Kilometer',
  [DistanceUnits.MILES]: 'Meilen'
};

  // Konvertierungsfunktionen
const convertKmToMiles = (km: number): number => Math.round(km / 1.60934);

const MaintenancePage: React.FC = () => {
  const [car, setCar] = useState<Car | null>(null);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [selectedCategories, setSelectedCategories] = useState<MaintenanceType[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState<MaintenanceType | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayUnit, setDisplayUnit] = useState<DistanceUnit>(DistanceUnits.KILOMETERS);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const { token, selectedCarId } = useAuth();

  // Verwende die selectedCarId aus dem Auth-Context
  const carId = selectedCarId;

  // Verwende den gemeinsamen Hook für Wartungslogik  
  const { 
    getCurrentMileage: hookGetCurrentMileage,
    refreshData: refreshMaintenanceData,
    getMaintenanceStatus,
    getIntervalForMaintenanceType
  } = useMaintenanceData();

  // Hole die Chip-Farbe basierend auf dem Status
    const getChipProps = (status: MaintenanceStatus): ChipProps => {
    const baseProps: ChipProps = {
      size: 'small',
      variant: 'filled',
    };

    switch (status) {
      case 'overdue':
        return {
          ...baseProps,
          color: 'error',
          sx: {
            backgroundColor: '#d32f2f',
            color: 'white',
            '&.MuiChip-filled': {
              backgroundColor: '#d32f2f',
            }
          }
        };
      case 'soon':
        return {
          ...baseProps,
          color: 'warning',
          sx: {
            backgroundColor: '#ed6c02',
            color: 'white',
            '&.MuiChip-filled': {
              backgroundColor: '#ed6c02',
            }
          }
        };
      case 'good':
        return {
          ...baseProps,
          color: 'success',
          sx: {
            backgroundColor: '#2e7d32',
            color: 'white',
            '&.MuiChip-filled': {
              backgroundColor: '#2e7d32',
            }
          }
        };
      default:
        return {
          size: 'small',
          variant: 'outlined',
          color: 'default',
        };
    }
  };

  // Lade Auto-Daten
  useEffect(() => {
    loadCar();
  }, [carId, token]);

  // Lade Wartungen und gespeicherte Kategorien
  useEffect(() => {
    if (car) {
      loadMaintenances();
      loadSelectedCategories();
    }
    
    // Lade bevorzugte Anzeige-Einheit aus localStorage
    const savedUnit = localStorage.getItem('maintenance-display-unit') as DistanceUnit;
    if (savedUnit && Object.values(DistanceUnits).includes(savedUnit)) {
      setDisplayUnit(savedUnit);
    }
  }, [car, token]);

  // Aktualisiere Kilometerstand wenn sich Wartungen ändern
  useEffect(() => {
    if (maintenances.length > 0) {
      calculateCurrentMileage(maintenances);
    }
  }, [maintenances, token]);

  // Speichere Anzeige-Einheit wenn sie geändert wird
  const handleDisplayUnitChange = (unit: DistanceUnit) => {
    setDisplayUnit(unit);
    localStorage.setItem('maintenance-display-unit', unit);
  };

  const loadCar = async () => {
    if (!token) return;

    try {
            const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCar(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Autos:', error);
    }
  };

  const loadMaintenances = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/maintenance/${carId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMaintenances(data);
        
        // Berechne aktuellen Kilometerstand nach dem Laden der Wartungen
        await calculateCurrentMileage(data);
        
        // Aktualisiere auch die Hook-Daten, damit das Dashboard synchron bleibt
        await refreshMaintenanceData();
      }
    } catch (error) {
      console.error('Fehler beim Laden der Wartungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentMileage = async (currentMaintenances?: Maintenance[]) => {
    try {
      // Lade alle Tankungen für dieses Auto
      const refuelingsResponse = await fetch(`${API_BASE_URL}/refuelings/car/${carId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let maxMileage = 0;
      let maxMileageSource = '';
      
      // Prüfe Tankungen
      if (refuelingsResponse.ok) {
        const refuelings = await refuelingsResponse.json();
        console.log('Geladene Tankungen für Kilometerstand-Berechnung:', refuelings.length);
        refuelings.forEach((refueling: any) => {
          if (refueling.mileage && refueling.mileage > maxMileage) {
            maxMileage = refueling.mileage;
            maxMileageSource = `Tankung vom ${new Date(refueling.date).toLocaleDateString('de-DE')}`;
            console.log('Neuer höchster Kilometerstand aus Tankung:', maxMileage, 'vom', new Date(refueling.date).toLocaleDateString('de-DE'));
          }
        });
      } else {
        console.log('Keine Tankungen gefunden oder Fehler beim Laden');
      }

      // Prüfe Wartungen (verwende übergebene oder state Wartungen)
      const maintenancesToCheck = currentMaintenances || maintenances;
      console.log('Geladene Wartungen für Kilometerstand-Berechnung:', maintenancesToCheck.length);
      maintenancesToCheck.forEach((maintenance) => {
        if (maintenance.lastMileage && maintenance.lastMileage > maxMileage) {
          maxMileage = maintenance.lastMileage;
          maxMileageSource = `Wartung ${maintenance.name} vom ${maintenance.lastPerformed ? new Date(maintenance.lastPerformed).toLocaleDateString('de-DE') : 'unbekannt'}`;
          console.log('Neuer höchster Kilometerstand aus Wartung:', maxMileage, 'von', maintenance.name);
        }
      });

      setCurrentMileage(maxMileage);
      console.log('Aktueller Kilometerstand berechnet:', maxMileage, 'km aus:', maxMileageSource);
    } catch (error) {
      console.error('Fehler beim Berechnen des aktuellen Kilometerstands:', error);
    }
  };

  const loadSelectedCategories = () => {
    const saved = localStorage.getItem(`maintenance-categories-${carId}`);
    if (saved) {
      setSelectedCategories(JSON.parse(saved));
    }
  };

  // Berechne die Gesamtkosten aller Wartungen
  const getTotalMaintenanceCost = (): number => {
    return maintenances.reduce((total, maintenance) => {
      return total + (maintenance.cost || 0);
    }, 0);
  };

  const handleCategoriesChanged = (categories: MaintenanceType[]) => {
    setSelectedCategories(categories);
    localStorage.setItem(`maintenance-categories-${carId}`, JSON.stringify(categories));
  };

  const handleMaintenanceAdded = () => {
    loadMaintenances(); // Das lädt auch den aktuellen Kilometerstand neu
    refreshMaintenanceData(); // Aktualisiere auch Hook-Daten
  };

  const handleEditMaintenance = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsEditDialogOpen(true);
  };

  const handleDeleteMaintenance = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDeleteDialogOpen(true);
  };

  const handleMaintenanceUpdated = () => {
    loadMaintenances(); // Das lädt auch den aktuellen Kilometerstand neu
    refreshMaintenanceData(); // Aktualisiere auch Hook-Daten
    setIsEditDialogOpen(false);
    setSelectedMaintenance(null);
  };

  const handleMaintenanceDeleted = () => {
    loadMaintenances(); // Das lädt auch den aktuellen Kilometerstand neu
    refreshMaintenanceData(); // Aktualisiere auch Hook-Daten
    setIsDeleteDialogOpen(false);
    setSelectedMaintenance(null);
  };

  const handleCategoryCardClick = (type: MaintenanceType) => {
    setSelectedMaintenanceType(type);
    setIsAddDialogOpen(true);
  };

  // Gruppierung der Wartungen nach Kategorien (wie im Dialog)
  const getMaintenanceGroups = () => {
    const allMaintenanceGroups = {
      'Motoröl und Filter': [
        MaintenanceType.OIL_CHANGE,
        MaintenanceType.AIR_FILTER,
        MaintenanceType.CABIN_FILTER,
        MaintenanceType.FUEL_FILTER
      ],
      'Zündung': [
        MaintenanceType.SPARK_PLUGS,
        MaintenanceType.GLOW_PLUGS
      ],
      'Riemen': [
        MaintenanceType.TIMING_BELT,
        MaintenanceType.DRIVE_BELT
      ],
      'Bremsen': [
        MaintenanceType.BRAKE_PADS,
        MaintenanceType.BRAKE_DISCS,
        MaintenanceType.BRAKE_FLUID
      ],
      'Flüssigkeiten': [
        MaintenanceType.COOLANT,
        MaintenanceType.AUTOMATIC_TRANSMISSION_FLUID,
        MaintenanceType.MANUAL_TRANSMISSION_FLUID,
        MaintenanceType.DIFFERENTIAL_OIL,
        MaintenanceType.POWER_STEERING_FLUID
      ],
      'Reifen und Elektronik': [
        MaintenanceType.TIRE_CHANGE,
        MaintenanceType.BATTERY,
        MaintenanceType.WIPER_BLADES
      ],
      'Behördliche Termine': [
        MaintenanceType.INSPECTION
      ]
    };

    return allMaintenanceGroups;
  };

  // Gruppiere nur die tatsächlich erfassten Wartungen (nur die neueste pro Typ)
  // UND nur für ausgewählte Kategorien
  const getRecordedMaintenanceGroups = () => {
    const allGroups = getMaintenanceGroups();
    const groupedMaintenances: { [key: string]: Maintenance[] } = {};
    
    Object.entries(allGroups).forEach(([groupName, types]) => {
      const groupMaintenances: Maintenance[] = [];
      
      // Für jeden Wartungstyp nur die neueste Wartung hinzufügen
      // ABER nur wenn die Kategorie auch ausgewählt ist
      (types as MaintenanceType[]).forEach(type => {
        // Prüfe zuerst, ob diese Kategorie ausgewählt ist
        if (!selectedCategories.includes(type)) {
          return; // Springe zur nächsten Kategorie, wenn nicht ausgewählt
        }
        
        const maintenancesOfType = maintenances
          .filter(maintenance => maintenance.type === type)
          .sort((a, b) => {
            // Sortiere nach Datum (neueste zuerst)
            const dateA = a.lastPerformed ? new Date(a.lastPerformed).getTime() : 0;
            const dateB = b.lastPerformed ? new Date(b.lastPerformed).getTime() : 0;
            return dateB - dateA;
          });
        
        // Nur die neueste Wartung hinzufügen (falls vorhanden)
        if (maintenancesOfType.length > 0) {
          groupMaintenances.push(maintenancesOfType[0]);
        }
      });
      
      if (groupMaintenances.length > 0) {
        groupedMaintenances[groupName] = groupMaintenances;
      }
    });

    return groupedMaintenances;
  };

  // Formatiere das Wartungsintervall für Anzeige im Chip
  const formatMaintenanceInterval = (maintenance: Maintenance): string => {
    const intervals: string[] = [];
    
    // Versuche individuelle Intervalle zu holen, falls verfügbar
    const currentIntervals = getIntervalForMaintenanceType(maintenance.type);
    const intervalMonths = currentIntervals.intervalMonths || maintenance.intervalMonths;
    const intervalKilometers = currentIntervals.intervalKilometers || maintenance.intervalKilometers;
    
    if (intervalMonths) {
      if (intervalMonths >= 12) {
        const years = intervalMonths / 12;
        intervals.push(`${years} Jahr${years > 1 ? 'e' : ''}`);
      } else {
        intervals.push(`${intervalMonths} Mon.`);
      }
    }
    
    if (intervalKilometers) {
      if (displayUnit === DistanceUnits.MILES) {
        const miles = convertKmToMiles(intervalKilometers);
        intervals.push(`${miles.toLocaleString('de-DE')} mi`);
      } else {
        intervals.push(`${intervalKilometers.toLocaleString('de-DE')} km`);
      }
    }
    
    return intervals.join(' / ');
  };

  // Berechne verbleibende Zeit/Kilometer bis zur nächsten Wartung mit echten Daten
  const getRemainingMaintenance = (maintenance: Maintenance) => {
    const now = new Date();
    const labels: string[] = [];

    // Hole die aktuellen Intervalle (individuell oder Standard)
    const currentIntervals = getIntervalForMaintenanceType(maintenance.type);
    const intervalMonths = currentIntervals.intervalMonths || maintenance.intervalMonths;
    const intervalKilometers = currentIntervals.intervalKilometers || maintenance.intervalKilometers;

    // Verbleibende Zeit berechnen basierend auf lastPerformed und intervalMonths
    if (maintenance.lastPerformed && intervalMonths) {
      const lastPerformed = new Date(maintenance.lastPerformed);
      const nextDueCalculated = new Date(lastPerformed);
      nextDueCalculated.setMonth(nextDueCalculated.getMonth() + intervalMonths);
      
      const diffTime = nextDueCalculated.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        if (diffDays >= 365) {
          const years = Math.floor(diffDays / 365);
          const months = Math.floor((diffDays % 365) / 30);
          if (months > 0) {
            labels.push(`${years} Jahr${years > 1 ? 'e' : ''} ${months} Mon.`);
          } else {
            labels.push(`${years} Jahr${years > 1 ? 'e' : ''}`);
          }
        } else if (diffDays >= 30) {
          const months = Math.floor(diffDays / 30);
          labels.push(`${months} Monat${months > 1 ? 'e' : ''}`);
        } else {
          labels.push(`${diffDays} Tag${diffDays > 1 ? 'e' : ''}`);
        }
      } else {
        // Überfällig - berechne wie lange schon
        const overdueDays = Math.abs(diffDays);
        if (overdueDays >= 365) {
          const years = Math.floor(overdueDays / 365);
          const months = Math.floor((overdueDays % 365) / 30);
          if (months > 0) {
            labels.push(`Überfällig seit ${years} Jahr${years > 1 ? 'en' : ''} ${months} Mon.`);
          } else {
            labels.push(`Überfällig seit ${years} Jahr${years > 1 ? 'en' : ''}`);
          }
        } else if (overdueDays >= 30) {
          const months = Math.floor(overdueDays / 30);
          labels.push(`Überfällig seit ${months} Monat${months > 1 ? 'en' : ''}`);
        } else if (overdueDays > 0) {
          labels.push(`Überfällig seit ${overdueDays} Tag${overdueDays > 1 ? 'en' : ''}`);
        } else {
          labels.push('Heute fällig');
        }
      }
    }

    // Verbleibende Kilometer berechnen basierend auf aktuellem Kilometerstand
    if (maintenance.lastMileage && intervalKilometers && currentMileage > 0) {
      const nextMileageDueCalculated = maintenance.lastMileage + intervalKilometers;
      const remainingKm = nextMileageDueCalculated - currentMileage;
      
      if (displayUnit === DistanceUnits.MILES) {
        if (remainingKm > 0) {
          const remainingMiles = convertKmToMiles(remainingKm);
          labels.push(`${remainingMiles.toLocaleString('de-DE')} mi`);
        } else {
          const overdueMiles = convertKmToMiles(Math.abs(remainingKm));
          labels.push(`Überfällig seit ${overdueMiles.toLocaleString('de-DE')} mi`);
        }
      } else {
        if (remainingKm > 0) {
          labels.push(`${remainingKm.toLocaleString('de-DE')} km`);
        } else {
          const overdueKm = Math.abs(remainingKm);
          labels.push(`Überfällig seit ${overdueKm.toLocaleString('de-DE')} km`);
        }
      }
    }

    return labels.join(' oder ');
  };

  // Gruppiere alle ausgewählten Kategorien (auch ohne erfasste Wartungen)
  const getSelectedCategoryGroups = () => {
    const allGroups = getMaintenanceGroups();
    const groupedCategories: { [key: string]: MaintenanceType[] } = {};
    
    Object.entries(allGroups).forEach(([groupName, types]) => {
      const groupCategories = types.filter(type => 
        selectedCategories.includes(type)
      );
      
      if (groupCategories.length > 0) {
        groupedCategories[groupName] = groupCategories;
      }
    });

    return groupedCategories;
  };

  if (loading || !car) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Lade Wartungen...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Wartungen für {car.manufacturer} {car.model}
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Ansichts-Umschalter */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="cards" aria-label="Kartenansicht">
              <CardViewIcon />
            </ToggleButton>
            <ToggleButton value="table" aria-label="Tabellenansicht">
              <TableViewIcon />
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Einheiten-Schalter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Anzeige</InputLabel>
            <Select
              value={displayUnit}
              label="Anzeige"
              onChange={(e) => handleDisplayUnitChange(e.target.value as DistanceUnit)}
            >
              <MenuItem value={DistanceUnits.KILOMETERS}>
                {DistanceUnitLabels[DistanceUnits.KILOMETERS]}
              </MenuItem>
              <MenuItem value={DistanceUnits.MILES}>
                {DistanceUnitLabels[DistanceUnits.MILES]}
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {/* Debug Info für aktuellen Kilometerstand */}
      {currentMileage > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Aktueller Kilometerstand: {displayUnit === DistanceUnits.MILES 
            ? convertKmToMiles(currentMileage).toLocaleString('de-DE')
            : currentMileage.toLocaleString('de-DE')
          } {displayUnit === DistanceUnits.MILES ? 'mi' : 'km'}
        </Typography>
      )}

      {/* Gesamtkosten aller Wartungen */}
      {maintenances.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Gesamtkosten aller Wartungen: {getTotalMaintenanceCost().toLocaleString('de-DE', { 
            style: 'currency', 
            currency: 'EUR' 
          })}
        </Typography>
      )}
      
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => setIsCategoryDialogOpen(true)}
        >
          Kategorien verwalten
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
          disabled={selectedCategories.length === 0}
        >
          Wartung erfassen
        </Button>
      </Stack>

      {selectedCategories.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <MaintenanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Keine Wartungskategorien ausgewählt
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Wählen Sie zunächst die Wartungskategorien aus, die Sie verwalten möchten.
            </Typography>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={() => setIsCategoryDialogOpen(true)}
            >
              Kategorien auswählen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabellenansicht */}
          {viewMode === 'table' ? (
            <MaintenanceDataTable
              maintenances={maintenances}
              displayUnit={displayUnit}
              onEditMaintenance={handleEditMaintenance}
              onDeleteMaintenance={handleDeleteMaintenance}
            />
          ) : (
            <>
              {/* Status-Legende */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Status-Legende:
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 2,
                  alignItems: 'flex-start'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip 
                      label="Nicht erfasst" 
                      variant="outlined" 
                      size="small" 
                      color="default"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Noch keine Wartung eingetragen
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip 
                      label="OK" 
                      variant="filled" 
                      size="small"
                      color="success"
                      sx={{
                        backgroundColor: '#2e7d32',
                        color: 'white',
                        '&.MuiChip-filled': {
                          backgroundColor: '#2e7d32',
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Wartung aktuell
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip 
                      label="Bald fällig" 
                      variant="filled" 
                      size="small"
                      color="warning"
                      sx={{
                        backgroundColor: '#ed6c02',
                        color: 'white',
                        '&.MuiChip-filled': {
                          backgroundColor: '#ed6c02',
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      &lt; 1 Monat oder &lt; 1.000 km
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip 
                      label="Überfällig" 
                      variant="filled" 
                      size="small"
                      color="error"
                      sx={{
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        '&.MuiChip-filled': {
                          backgroundColor: '#d32f2f',
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Wartung erforderlich
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Aktive Wartungskategorien ({selectedCategories.length}):
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1,
                  alignItems: 'flex-start'
                }}>
                  {selectedCategories.map((type) => {
                    const status = getMaintenanceStatus(type);
                    const chipProps = getChipProps(status);
                    return (
                      <Chip
                        key={type}
                        label={MaintenanceTypeLabels[type]}
                        {...chipProps}
                      />
                    );
                  })}
                </Box>
              </Box>

              {/* Wartungen nach Kategorien gruppiert - Kartenansicht */}
              {(() => {
                const selectedCategoryGroups = getSelectedCategoryGroups();
                const recordedMaintenanceGroups = getRecordedMaintenanceGroups();

                return (
                  <Stack spacing={4}>
                    {Object.entries(selectedCategoryGroups).map(([groupName, groupCategories]) => (
                      <Box key={groupName}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                          {groupName}
                        </Typography>
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                          gap: 2 
                        }}>
                          {/* Kategorie-Karten für noch nicht erfasste Wartungen */}
                          {groupCategories.map((type) => {
                            const hasRecordedMaintenance = recordedMaintenanceGroups[groupName]?.some(
                              maintenance => maintenance.type === type
                            );
                            
                            if (hasRecordedMaintenance) return null;
                            
                            return (
                              <Card 
                                key={type} 
                                sx={{ 
                                  cursor: 'pointer',
                                  border: 2,
                                  borderColor: 'primary.light',
                                  borderStyle: 'dashed',
                                  bgcolor: 'background.paper',
                                  '&:hover': {
                                    boxShadow: 3,
                                    transform: 'translateY(-2px)',
                                    borderColor: 'primary.main',
                                    borderStyle: 'solid',
                                    bgcolor: 'action.hover'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleCategoryCardClick(type)}
                              >
                                <CardContent sx={{ textAlign: 'center', py: 3, px: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, justifyContent: 'center' }}>
                                    <Typography variant="body1" sx={{ fontSize: '1.5rem' }}>
                                      {MaintenanceTypeIcons[type]}
                                    </Typography>
                                    <Typography variant="h6" component="h3" fontWeight="bold">
                                      {MaintenanceTypeLabels[type]}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Noch nicht erfasst
                                  </Typography>
                                  <Typography variant="caption" color="primary.main" sx={{ fontStyle: 'italic' }}>
                                    Klicken zum Erfassen
                                  </Typography>
                                </CardContent>
                              </Card>
                            );
                          })}
                          
                          {/* Wartungs-Karten für bereits erfasste Wartungen */}
                          {recordedMaintenanceGroups[groupName]?.map((maintenance) => {
                            const remainingTime = getRemainingMaintenance(maintenance);
                            const status = getMaintenanceStatus(maintenance.type);
                            
                            return (
                              <Card key={maintenance.id} sx={{ '&:hover': { boxShadow: 3 } }}>
                                <CardContent>
                                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1" sx={{ fontSize: '1.5rem' }}>
                                          {MaintenanceTypeIcons[maintenance.type]}
                                        </Typography>
                                        <Typography variant="h6" component="h3">
                                          {MaintenanceTypeLabels[maintenance.type]}
                                        </Typography>
                                      </Box>
                                      
                                      {/* Wartungsintervall Chip */}
                                      <Chip
                                        label={`Intervall: ${formatMaintenanceInterval(maintenance)}`}
                                        variant="outlined"
                                        size="small"
                                        color="info"
                                        sx={{ alignSelf: 'flex-start' }}
                                      />
                                    </Box>
                                    <Stack direction="row">
                                      <IconButton 
                                        size="small" 
                                        color="primary"
                                        onClick={() => handleEditMaintenance(maintenance)}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                      <IconButton 
                                        size="small" 
                                        color="error"
                                        onClick={() => handleDeleteMaintenance(maintenance)}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Stack>
                                  </Stack>
                                  
                                  {/* Einfaches verbleibendes Zeit/Km Label */}
                                  {remainingTime && (
                                    <Box sx={{ 
                                      backgroundColor: status === 'overdue' ? '#d32f2f' : 
                                                      status === 'soon' ? '#ed6c02' : 
                                                      status === 'good' ? '#2e7d32' : '#e0e0e0',
                                      color: 'white', 
                                      p: 2, 
                                      borderRadius: 1, 
                                      textAlign: 'center',
                                      mb: 2
                                    }}>
                                      <Typography variant="h6" fontWeight="bold">
                                        {status === 'overdue' ? '🚨 ' : 
                                         status === 'soon' ? '⚠️ ' : 
                                         status === 'good' ? '✅ ' : '⏱️ '}
                                        {remainingTime}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'white' }}>
                                        {status === 'overdue' ? 'Wartung überfällig!' : 
                                         status === 'soon' ? 'Wartung bald erforderlich' : 
                                         status === 'good' ? 'Wartung in Ordnung' : 'bis zur nächsten Wartung'}
                                      </Typography>
                                    </Box>
                                  )}
                                  
                                  <Divider sx={{ mb: 2 }} />
                                  
                                  {/* Kompakte Informationen */}
                                  <Stack spacing={1}>
                                    {maintenance.lastPerformed && (
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">
                                          Zuletzt:
                                        </Typography>
                                        <Typography variant="body2">
                                          {format(new Date(maintenance.lastPerformed), 'dd.MM.yyyy', { locale: de })}
                                        </Typography>
                                      </Box>
                                    )}
                                    
                                    {maintenance.lastMileage && (
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">
                                          Bei {displayUnit === DistanceUnits.MILES ? 'mi:' : 'km:'}
                                        </Typography>
                                        <Typography variant="body2">
                                          {displayUnit === DistanceUnits.MILES 
                                            ? convertKmToMiles(maintenance.lastMileage).toLocaleString('de-DE')
                                            : maintenance.lastMileage.toLocaleString('de-DE')
                                          } {displayUnit === DistanceUnits.MILES ? 'mi' : 'km'}
                                        </Typography>
                                      </Box>
                                    )}
                                    
                                    {maintenance.cost && (
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">
                                          Kosten:
                                        </Typography>
                                        <Typography variant="body2" color="primary">
                                          {maintenance.cost.toLocaleString('de-DE', { 
                                            style: 'currency', 
                                            currency: 'EUR' 
                                          })}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Stack>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                );
              })()}
            </>
          )}
        </>
      )}

      {/* Dialoge */}
      <AddMaintenanceDialog
        open={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setSelectedMaintenanceType(null);
        }}
        onSaved={handleMaintenanceAdded}
        carId={carId}
        availableTypes={selectedCategories}
        preselectedType={selectedMaintenanceType}
      />

      <MaintenanceCategorySelectionDialog
        open={isCategoryDialogOpen}
        onClose={() => setIsCategoryDialogOpen(false)}
        onSave={handleCategoriesChanged}
        currentCategories={selectedCategories}
        car={car}
      />

      <EditMaintenanceDialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedMaintenance(null);
        }}
        onSaved={handleMaintenanceUpdated}
        maintenance={selectedMaintenance}
      />

      <DeleteMaintenanceDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedMaintenance(null);
        }}
        onDeleted={handleMaintenanceDeleted}
        maintenance={selectedMaintenance}
      />
    </Container>
  );
};

export default MaintenancePage;
