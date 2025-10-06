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
  Alert,
  useTheme,
  useMediaQuery
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
  
  // Theme und Mobile Detection
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
  const maintenanceGroups: Record<string, MaintenanceType[]> = Object.fromEntries(
    Object.entries(allMaintenanceGroups)
      .map(([groupName, types]) => [
        groupName, 
        types.filter(type => relevantTypes.includes(type))
      ])
      .filter(([, types]) => types.length > 0) // Entferne leere Gruppen
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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          margin: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : 'calc(100vh - 64px)',
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        pb: 1,
        px: isMobile ? 2 : 3
      }}>
        Wartungskategorien auswählen
      </DialogTitle>
      
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          textAlign: 'center', 
          px: isMobile ? 2 : 3, 
          pb: 2 
        }}
      >
        Fahrzeugspezifische Wartungstypen für {car.manufacturer} {car.model} ({car.fuel}, {car.transmission})
      </Typography>

      <DialogContent sx={{ px: isMobile ? 1 : 3 }}>
        <Alert severity="info" sx={{ mb: 3, mx: isMobile ? 1 : 0 }}>
          Die angezeigten Kategorien sind speziell für Ihr Fahrzeug gefiltert. Elektrofahrzeuge benötigen z.B. keine Motoröl-Wartung.
        </Alert>

        {Object.entries(maintenanceGroups).map(([groupName, types]) => (
          <Box key={groupName} sx={{ mb: 4, mx: isMobile ? 1 : 0 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                color: 'primary.main', 
                fontWeight: 'bold',
                px: isMobile ? 1 : 0
              }}
            >
              {groupName}
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile 
                ? '1fr' 
                : 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: isMobile ? 1 : 2,
              px: isMobile ? 1 : 0
            }}>
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
                    <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 1 : 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 1, 
                            justifyContent: 'space-between',
                            flexWrap: isMobile ? 'wrap' : 'nowrap'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                              <Typography component="span" sx={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>
                                {MaintenanceTypeIcons[type]}
                              </Typography>
                              <Typography 
                                variant={isMobile ? "body2" : "subtitle2"} 
                                fontWeight="bold"
                                sx={{ 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: isMobile ? 'normal' : 'nowrap'
                                }}
                              >
                                {MaintenanceTypeLabels[type]}
                              </Typography>
                            </Box>
                            {selectedCategories.includes(type) && (
                              <CheckIcon sx={{ 
                                color: 'primary.main', 
                                fontSize: isMobile ? '1rem' : '1.2rem',
                                flexShrink: 0
                              }} />
                            )}
                          </Box>
                          
                          <Chip 
                            label={formatInterval(type)}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontSize: isMobile ? '0.7rem' : '0.75rem',
                              height: isMobile ? 'auto' : undefined,
                              '& .MuiChip-label': {
                                px: isMobile ? 1 : 1.5,
                                py: isMobile ? 0.25 : 0.5
                              }
                            }}
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
      
      <DialogActions sx={{ 
        px: isMobile ? 2 : 3, 
        pb: isMobile ? 2 : 3,
        pt: isMobile ? 1 : 2,
        gap: isMobile ? 1 : 0,
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            flex: isMobile ? 'none' : 1,
            width: isMobile ? '100%' : 'auto',
            order: isMobile ? 2 : 1
          }}
        >
          Abbrechen
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained" 
          sx={{ 
            flex: isMobile ? 'none' : 2,
            width: isMobile ? '100%' : 'auto',
            order: isMobile ? 1 : 2
          }}
        >
          {selectedCategories.length} Kategorien speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}