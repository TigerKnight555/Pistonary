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
import MileageInput from './MileageInput';
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

interface AddMaintenanceDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  carId?: number;
  availableTypes?: MaintenanceType[];
  preselectedType?: MaintenanceType | null;
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

// Konvertierungsfunktionen
const convertMilesToKm = (miles: number): number => Math.round(miles * 1.60934);

export default function AddMaintenanceDialog({ 
  open, 
  onClose, 
  onSaved, 
  carId = 1,
  availableTypes,
  preselectedType
}: AddMaintenanceDialogProps) {
  const { token } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState({
    type: (preselectedType || '') as MaintenanceType | '',
    lastPerformed: new Date(),
    lastMileage: '',
    mileageUnit: 'km' as 'km' | 'mi',
    cost: '',
    notes: '',
    tireType: '' // Für Reifenwechsel
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load car data when dialog opens
  useEffect(() => {
    if (open && carId) {
      loadCar();
    }
  }, [open, carId]);

  const loadCar = async () => {
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

  // Set preselected type when dialog opens
  useEffect(() => {
    if (open && preselectedType) {
      setFormData(prev => ({
        ...prev,
        type: preselectedType
      }));
    }
  }, [open, preselectedType]);

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
    
    if (!validateForm()) return;

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
      const lastMileageInKm = lastMileage && formData.mileageUnit === 'mi' 
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

      const maintenanceData: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'> = {
        carId,
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

      const response = await fetch(`${API_BASE_URL}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(maintenanceData)
      });

      if (!response.ok) {
        throw new Error('Failed to save maintenance');
      }
      
      console.log('Maintenance saved successfully');
      onSaved();
      handleClose();
    } catch (error) {
      console.error('Error saving maintenance:', error);
      setErrors({ submit: 'Fehler beim Speichern der Wartung' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    setFormData({
      type: '',
      lastPerformed: new Date(),
      lastMileage: '',
      mileageUnit: 'km',
      cost: '',
      notes: '',
      tireType: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            Neue Wartung
          </DialogTitle>
          
          {car && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', px: 3, pb: 2 }}>
              {car.manufacturer} {car.model}
            </Typography>
          )}

          <DialogContent>
            {errors.submit && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.submit}
              </Alert>
            )}

            <Stack spacing={3}>
              {/* Wartungstyp */}
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Wartungstyp *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  label="Wartungstyp *"
                >
                  {availableTypes?.map((type) => (
                    <MenuItem key={type} value={type}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span">
                          {MaintenanceTypeIcons[type]}
                        </Typography>
                        {MaintenanceTypeLabels[type]}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.type && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.type}
                  </Typography>
                )}
              </FormControl>

              {/* Spezielle Reifen-Auswahl */}
              {formData.type === MaintenanceType.TIRE_CHANGE && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Reifentyp auswählen:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {Object.entries(TireTypeLabels).map(([key, label]) => (
                      <Chip
                        key={key}
                        label={label}
                        onClick={() => handleChange('tireType', key)}
                        color={formData.tireType === key ? 'primary' : 'default'}
                        variant={formData.tireType === key ? 'filled' : 'outlined'}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                  {errors.tireType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {errors.tireType}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Datum */}
              <DatePicker
                label="Datum der Durchführung *"
                value={formData.lastPerformed}
                onChange={(newValue) => handleChange('lastPerformed', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.lastPerformed,
                    helperText: errors.lastPerformed
                  }
                }}
              />

              <Divider />

              {/* Kilometerstand mit MileageInput-Komponente */}
              <MileageInput
                value={formData.lastMileage}
                unit={formData.mileageUnit}
                onValueChange={(value) => handleChange('lastMileage', value)}
                onUnitChange={(unit) => handleChange('mileageUnit', unit)}
                label="Kilometerstand"
                required={false}
              />

              {/* Kosten */}
              <TextField
                label="Kosten"
                type="number"
                value={formData.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">€</InputAdornment>
                }}
              />

              {/* Notizen */}
              <TextField
                label="Notizen"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="Zusätzliche Informationen..."
              />
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} sx={{ flex: 1 }}>
              Abbrechen
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              sx={{ flex: 2 }}
              disabled={isSubmitting || !formData.type}
            >
              {isSubmitting ? 'Speichert...' : 'Speichern'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
}