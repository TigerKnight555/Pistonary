import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert
} from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import {
  MaintenanceType,
  MaintenanceTypeLabels,
  MaintenanceTypeIcons,
  DefaultMaintenanceIntervals
} from '../database/entities/Maintenance';
import type { Car } from '../types/Car';

interface MaintenanceCategorySelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (selectedCategories: MaintenanceType[]) => void;
  currentCategories: MaintenanceType[];
  car: Car;
}

export default function MaintenanceCategorySelectionDialog({
  open,
  onClose,
  onSave,
  currentCategories,
  car
}: MaintenanceCategorySelectionDialogProps) {
  const [selectedCategories, setSelectedCategories] = useState<MaintenanceType[]>(currentCategories);

  // Filterfunktion basierend auf Fahrzeugdaten
  const getRelevantMaintenanceTypes = (car: Car): MaintenanceType[] => {
    const fuelType = car.fuel.toLowerCase();
    const transmission = car.transmission.toLowerCase();
    
    let relevantTypes = Object.values(MaintenanceType);
    
    // Kraftstoff-abhängige Filterung
    if (fuelType.includes('elektro')) {
      // Elektrofahrzeuge: Keine Motoröl, Zündkerzen, Glühkerzen, Filter
      relevantTypes = relevantTypes.filter(type => ![
        MaintenanceType.OIL_CHANGE,
        MaintenanceType.SPARK_PLUGS,
        MaintenanceType.GLOW_PLUGS,
        MaintenanceType.AIR_FILTER,
        MaintenanceType.FUEL_FILTER,
        MaintenanceType.MANUAL_TRANSMISSION_FLUID,
        MaintenanceType.AUTOMATIC_TRANSMISSION_FLUID
      ].includes(type));
    } else {
      // Verbrenner: Glühkerzen nur bei Diesel
      if (!fuelType.includes('diesel')) {
        relevantTypes = relevantTypes.filter(type => type !== MaintenanceType.GLOW_PLUGS);
      }
      
      // Zündkerzen nur bei Benzin/Hybrid
      if (!fuelType.includes('benzin') && !fuelType.includes('hybrid')) {
        relevantTypes = relevantTypes.filter(type => type !== MaintenanceType.SPARK_PLUGS);
      }
    }
    
    // Getriebe-abhängige Filterung
    if (transmission.includes('automatik')) {
      // Automatikgetriebe: Kein manuelles Getriebeöl
      relevantTypes = relevantTypes.filter(type => type !== MaintenanceType.MANUAL_TRANSMISSION_FLUID);
    } else {
      // Schaltgetriebe: Kein Automatik-Getriebeöl
      relevantTypes = relevantTypes.filter(type => type !== MaintenanceType.AUTOMATIC_TRANSMISSION_FLUID);
    }
    
    return relevantTypes;
  };

  const relevantTypes = getRelevantMaintenanceTypes(car);

  // Gruppierung der gefilterten Wartungstypen
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

  // Filtere Gruppen und Typen basierend auf relevantem Fahrzeug
  const maintenanceGroups = Object.fromEntries(
    Object.entries(allMaintenanceGroups)
      .map(([groupName, types]) => [
        groupName, 
        types.filter(type => relevantTypes.includes(type))
      ])
      .filter(([groupName, types]) => types.length > 0) // Entferne leere Gruppen
  );

  const handleCategoryToggle = (category: MaintenanceType) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSave = () => {
    onSave(selectedCategories);
    onClose();
  };

  const formatInterval = (type: MaintenanceType) => {
    const intervals = DefaultMaintenanceIntervals[type];
    const parts = [];
    
    if (intervals.intervalKilometers) {
      parts.push(`${intervals.intervalKilometers.toLocaleString()} km`);
    }
    if (intervals.intervalMonths) {
      const years = Math.floor(intervals.intervalMonths / 12);
      const months = intervals.intervalMonths % 12;
      if (years > 0) {
        parts.push(`${years} Jahr${years > 1 ? 'e' : ''}${months > 0 ? ` ${months} Mon.` : ''}`);
      } else {
        parts.push(`${months} Mon.`);
      }
    }
    
    return parts.join(' / ') || 'Nach Bedarf';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        Wartungskategorien auswählen
      </DialogTitle>
      
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', px: 3, pb: 2 }}>
        Fahrzeugspezifische Wartungstypen für {car.manufacturer} {car.model} ({car.fuel}, {car.transmission})
      </Typography>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Die angezeigten Kategorien sind speziell für Ihr Fahrzeug gefiltert. Elektrofahrzeuge benötigen z.B. keine Motoröl-Wartung.
        </Alert>

        {Object.entries(maintenanceGroups).map(([groupName, types]) => (
          <Box key={groupName} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              {groupName}
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
              {types.map(type => (
                <Card 
                  key={type}
                  sx={{ 
                    cursor: 'pointer',
                    border: 2,
                    borderColor: selectedCategories.includes(type) ? 'primary.main' : 'divider',
                    bgcolor: selectedCategories.includes(type) ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                      borderColor: selectedCategories.includes(type) ? 'primary.main' : 'primary.light'
                    },
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handleCategoryToggle(type)}
                >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography component="span" sx={{ fontSize: '1.2rem' }}>
                                {MaintenanceTypeIcons[type]}
                              </Typography>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {MaintenanceTypeLabels[type]}
                              </Typography>
                            </Box>
                            {selectedCategories.includes(type) && (
                              <CheckIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                            )}
                          </Box>
                          
                          <Chip 
                            label={formatInterval(type)}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        ))}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ flex: 1 }}>
          Abbrechen
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained" 
          sx={{ flex: 2 }}
        >
          {selectedCategories.length} Kategorien speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}