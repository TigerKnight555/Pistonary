import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  InputAdornment,
  Typography,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Chip,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import {
  type Maintenance,
  MaintenanceType,
  MaintenanceTypeLabels,
  MaintenanceTypeIcons,
  getDefaultIntervals
} from '../database/entities/Maintenance';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import type { Car } from '../types/Car';

interface EditMaintenanceDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  maintenance: Maintenance | null;
}

// Reifen-Typen für spezielle Auswahl
const TireTypes = {
  SUMMER: 'summer',
  WINTER: 'winter',
  ALL_SEASON: 'all_season'
} as const;

const TireTypeLabels = {
  [TireTypes.SUMMER]: 'Sommerreifen',
  [TireTypes.WINTER]: 'Winterreifen',
  [TireTypes.ALL_SEASON]: 'Allwetterreifen'
};

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
const convertMilesToKm = (miles: number): number => Math.round(miles * 1.60934);
const convertKmToMiles = (km: number): number => Math.round(km / 1.60934);

export default function EditMaintenanceDialog({ 
  open, 
  onClose, 
  onSaved, 
  maintenance
}: EditMaintenanceDialogProps) {
  const { token } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState({
    type: '' as MaintenanceType | '',
    lastPerformed: new Date(),
    lastMileage: '',
    distanceUnit: DistanceUnits.KILOMETERS as DistanceUnit,
    cost: '',
    notes: '',
    tireType: '' // Für Reifenwechsel
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load car data when dialog opens
  useEffect(() => {
    if (open && maintenance?.carId) {
      loadCar(maintenance.carId);
    }
  }, [open, maintenance]);

  const loadCar = async (carId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const carData = await response.json();
        setCar(carData);
      }
    } catch (error) {
      console.error('Error loading car:', error);
    }
  };

  // Load maintenance data when dialog opens
  useEffect(() => {
    if (open && maintenance) {
      setFormData({
        type: maintenance.type,
        lastPerformed: maintenance.lastPerformed ? new Date(maintenance.lastPerformed) : new Date(),
        lastMileage: maintenance.lastMileage?.toString() || '',
        distanceUnit: DistanceUnits.KILOMETERS, // Immer in km gespeichert, Standard-Anzeige
        cost: maintenance.cost?.toString() || '',
        notes: maintenance.notes || '',
        tireType: '' // TODO: Extract from name if tire change
      });
      setErrors({});
    }
  }, [open, maintenance]);

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = 'Wartungstyp ist erforderlich';
    }

    if (!formData.lastPerformed) {
      newErrors.lastPerformed = 'Datum ist erforderlich';
    }

    if (formData.type === MaintenanceType.TIRE_CHANGE && !formData.tireType) {
      newErrors.tireType = 'Reifentyp ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !maintenance) return;

    setIsSubmitting(true);
    try {
      // Generate name based on type and tire type
      let generatedName = MaintenanceTypeLabels[formData.type as MaintenanceType];
      if (formData.type === MaintenanceType.TIRE_CHANGE && formData.tireType) {
        generatedName = `Reifenwechsel auf ${TireTypeLabels[formData.tireType as keyof typeof TireTypeLabels]}`;
      }

      // Get default intervals for this maintenance type
      const defaultIntervals = getDefaultIntervals(formData.type as MaintenanceType);
      
      // Calculate next due dates
      const lastPerformed = formData.lastPerformed;
      const lastMileage = formData.lastMileage ? parseInt(formData.lastMileage) : undefined;
      
      // Konvertiere Meilen zu Kilometern für die Speicherung, falls nötig
      const lastMileageInKm = lastMileage && formData.distanceUnit === DistanceUnits.MILES 
        ? convertMilesToKm(lastMileage) 
        : lastMileage;
      
      let nextDue: Date | undefined;
      let nextMileageDue: number | undefined;
      
      // Calculate next due date
      if (defaultIntervals.intervalMonths) {
        nextDue = new Date(lastPerformed);
        nextDue.setMonth(nextDue.getMonth() + defaultIntervals.intervalMonths);
      }
      
      // Calculate next mileage due
      if (defaultIntervals.intervalKilometers && lastMileageInKm) {
        nextMileageDue = lastMileageInKm + defaultIntervals.intervalKilometers;
      }

      const maintenanceData: Partial<Maintenance> = {
        type: formData.type as MaintenanceType,
        name: generatedName,
        lastPerformed: formData.lastPerformed,
        lastMileage: lastMileageInKm,
        intervalMonths: defaultIntervals.intervalMonths,
        intervalKilometers: defaultIntervals.intervalKilometers,
        nextDue: nextDue,
        nextMileageDue: nextMileageDue,
        reminderAdvanceDays: defaultIntervals.reminderAdvanceDays,
        reminderAdvanceKm: defaultIntervals.reminderAdvanceKm,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        notes: formData.notes.trim() || undefined,
        isCompleted: false
      };

      const response = await fetch(`${API_BASE_URL}/maintenance/${maintenance.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(maintenanceData)
      });

      console.log('Update response status:', response.status);
      
      if (response.ok) {
        const updatedMaintenance = await response.json();
        console.log('Maintenance updated successfully:', updatedMaintenance);
        onSaved();
        onClose();
        
        // Reset form
        setFormData({
          type: '',
          lastPerformed: new Date(),
          lastMileage: '',
          distanceUnit: DistanceUnits.KILOMETERS,
          cost: '',
          notes: '',
          tireType: ''
        });
      } else {
        throw new Error('Failed to update maintenance');
      }
    } catch (error) {
      console.error('Error updating maintenance:', error);
      setErrors({ submit: 'Fehler beim Aktualisieren der Wartung' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setErrors({});
  };

  if (!maintenance) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          Wartung bearbeiten
        </DialogTitle>
        
        {car && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', px: 3, pb: 2 }}>
            {car.manufacturer} {car.model}
          </Typography>
        )}
        
        <DialogContent sx={{ pt: 3 }}>
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Wartungstyp */}
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Wartungstyp</InputLabel>
              <Select
                value={formData.type}
                label="Wartungstyp"
                onChange={(e) => handleChange('type', e.target.value)}
              >
                <MenuItem value={maintenance.type}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{MaintenanceTypeIcons[maintenance.type]}</Typography>
                    <Typography>{MaintenanceTypeLabels[maintenance.type]}</Typography>
                  </Box>
                </MenuItem>
              </Select>
              {errors.type && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.type}
                </Typography>
              )}
            </FormControl>

            <Divider />

            {/* Datum */}
            <DatePicker
              label="Wartungsdatum"
              value={formData.lastPerformed}
              onChange={(date) => handleChange('lastPerformed', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.lastPerformed,
                  helperText: errors.lastPerformed
                }
              }}
            />

            {/* Kilometerstand mit Einheiten-Auswahl */}
            <Box>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Kilometerstand"
                  type="number"
                  value={formData.lastMileage}
                  onChange={(e) => handleChange('lastMileage', e.target.value)}
                  sx={{ flex: 2 }}
                  inputProps={{ min: 0 }}
                  error={!!errors.lastMileage}
                  helperText={errors.lastMileage || 'Kilometerstand zum Zeitpunkt der Wartung'}
                />
                <FormControl sx={{ flex: 1, minWidth: 120 }}>
                  <InputLabel>Einheit</InputLabel>
                  <Select
                    value={formData.distanceUnit}
                    label="Einheit"
                    onChange={(e) => handleChange('distanceUnit', e.target.value)}
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
              
              {/* Konvertierungs-Hinweis */}
              {formData.lastMileage && formData.distanceUnit === DistanceUnits.MILES && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  ≈ {convertMilesToKm(parseInt(formData.lastMileage)).toLocaleString('de-DE')} km
                </Typography>
              )}
            </Box>

            {/* Reifentyp für Reifenwechsel */}
            {formData.type === MaintenanceType.TIRE_CHANGE && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Reifentyp
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {Object.entries(TireTypeLabels).map(([value, label]) => (
                    <Chip
                      key={value}
                      label={label}
                      variant={formData.tireType === value ? "filled" : "outlined"}
                      onClick={() => handleChange('tireType', value)}
                      color={formData.tireType === value ? "primary" : "default"}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Stack>
                {errors.tireType && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.tireType}
                  </Typography>
                )}
              </Box>
            )}

            <Divider />

            {/* Kosten */}
            <TextField
              label="Kosten (optional)"
              type="number"
              value={formData.cost}
              onChange={(e) => handleChange('cost', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>
              }}
              error={!!errors.cost}
              helperText={errors.cost}
              fullWidth
            />

            {/* Notizen */}
            <TextField
              label="Notizen (optional)"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              error={!!errors.notes}
              helperText={errors.notes}
              fullWidth
            />
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} sx={{ flex: 1 }}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            disabled={isSubmitting}
            sx={{ flex: 2 }}
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}