import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
  CloudUpload as UploadIcon,
  Delete as RemoveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  EditNote as EditAllIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import { getCarMaintenanceIntervals, updateCarMaintenanceIntervals, getMaintenanceTypes, createMaintenanceType, deleteMaintenanceType } from '../config/maintenanceApi';
import type { Car } from '../database/entities/Car';
import type { MaintenanceIntervalView, MaintenanceType } from '../types/Maintenance';
import type { PowerUnitType } from '../utils/powerConversion';
import { convertPowerValue } from '../utils/powerConversion';
import type { DistanceUnitType } from '../utils/distanceConversion';
import { convertDistanceValue } from '../utils/distanceConversion';
import CarSettings from './CarSettings';
import MileageInput from './MileageInput';
import PowerInput from './PowerInput';

// Temporäre Standard-Kategorien für Kompatibilität (wird durch API-Aufruf ersetzt)
const defaultMaintenanceCategories = [
  { id: 1, name: 'Ölwechsel', timeInterval: 12, mileageInterval: 15000, description: 'Motoröl und Ölfilter wechseln' },
  { id: 2, name: 'Inspektion', timeInterval: 12, mileageInterval: 20000, description: 'Große Inspektion nach Herstellervorgabe' }
];

// Legacy MaintenanceCategory für Kompatibilität mit alten Daten
export interface MaintenanceCategory {
  id: number;
  name: string;
  timeInterval: number | null; // Monate
  mileageInterval: number | null; // km
  description?: string;
}

// EditCategoryForm Komponente
interface EditCategoryFormProps {
  category: MaintenanceCategory;
  onSave: (id: number, name: string, timeInterval: number | null, mileageInterval: number | null, description?: string) => void;
  onCancel: () => void;
}

function EditCategoryForm({ category, onSave, onCancel }: EditCategoryFormProps) {
  const [name, setName] = useState(category.name);
  const [timeInterval, setTimeInterval] = useState<number | null>(category.timeInterval);
  const [mileageInterval, setMileageInterval] = useState<number | null>(category.mileageInterval);
  const [description, setDescription] = useState(category.description || '');

  const handleSave = () => {
    if (name.trim() && (timeInterval || mileageInterval)) {
      onSave(category.id, name.trim(), timeInterval, mileageInterval, description);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={2}>
        <TextField
          label="Wartungsart"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          label="Beschreibung"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          size="small"
          multiline
          rows={2}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Zeit-Intervall (Monate)"
            type="number"
            value={timeInterval || ''}
            onChange={(e) => setTimeInterval(e.target.value ? parseInt(e.target.value) : null)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{
              inputProps: { min: 1, max: 120 }
            }}
            placeholder="z.B. 12"
          />
          <TextField
            label="km-Intervall"
            type="number"
            value={mileageInterval || ''}
            onChange={(e) => setMileageInterval(e.target.value ? parseInt(e.target.value) : null)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{
              inputProps: { min: 1000, max: 200000, step: 1000 }
            }}
            placeholder="z.B. 15000"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<CheckIcon />}
            onClick={handleSave}
            disabled={!name.trim() || (!timeInterval && !mileageInterval)}
          >
            Speichern
          </Button>
          <Button
            size="small"
            startIcon={<CloseIcon />}
            onClick={onCancel}
          >
            Abbrechen
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

const fuelTypes = [
  'Benzin',
  'Diesel',
  'Elektro',
  'Hybrid',
  'Wasserstoff',
  'Erdgas'
];

const transmissionTypes = [
  'Manuell',
  'Automatik',
  'CVT',
  'Doppelkupplung'
];

export default function CarDetailPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState(0);
  
  // Formularfelder
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [licensePlate, setLicensePlate] = useState('');
  const [fuel, setFuel] = useState('Benzin');
  const [power, setPower] = useState<number>(0);
  const [powerUnit, setPowerUnit] = useState<PowerUnitType>('PS');
  const [transmission, setTransmission] = useState('Manuell');
  const [engineSize, setEngineSize] = useState<number>(0);
  const [mileage, setMileage] = useState<number>(0);
  const [mileageUnit, setMileageUnit] = useState<DistanceUnitType>('km');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Wartungsintervalle - neue Struktur
  const [useStandardIntervals, setUseStandardIntervals] = useState(true);
  const [useIndividualIntervals, setUseIndividualIntervals] = useState(false);
  const [maintenanceIntervals, setMaintenanceIntervals] = useState<MaintenanceIntervalView[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [isEditingAll, setIsEditingAll] = useState(false);
  const [tempMaintenanceIntervals, setTempMaintenanceIntervals] = useState<MaintenanceIntervalView[]>([]);
  const [tempMaintenanceCategories, setTempMaintenanceCategories] = useState<MaintenanceCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryTimeInterval, setNewCategoryTimeInterval] = useState<number | null>(12);
  const [newCategoryMileageInterval, setNewCategoryMileageInterval] = useState<number | null>(15000);
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  
  // Legacy für Kompatibilität mit alten Daten (wird entfernt nach Migration)
  const [maintenanceCategories, setMaintenanceCategories] = useState<MaintenanceCategory[]>([]);
  
  const { carId } = useParams<{ carId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const isNewCar = carId === 'new';

  const loadCar = async () => {
    if (isNewCar || !carId || !token) {
      if (isNewCar) {
        // Für neues Auto, Felder leer lassen
        setManufacturer('');
        setModel('');
        setYear(new Date().getFullYear());
        setLicensePlate('');
        setFuel('Benzin');
        setPower(0);
        setTransmission('Manuell');
        setEngineSize(0);
        setMileage(0);
        setNotes('');
        setImage('');
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Fahrzeug nicht gefunden');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: Car = await response.json();
      
      // Lade Daten in die Formularfelder
      setManufacturer(data.manufacturer || '');
      setModel(data.model || '');
      setYear(data.year || new Date().getFullYear());
      setLicensePlate(data.licensePlate || '');
      setFuel(data.fuel || 'Benzin');
      setPower(data.power || 0);
      setTransmission(data.transmission || 'Manuell');
      setEngineSize(data.engineSize || 0);
      setMileage(data.mileage || 0);
      setNotes(data.notes || '');
      setImage(data.image || '');
      
      // Lade Einheiten aus der Datenbank
      setPowerUnit((data.powerUnit as PowerUnitType) || 'PS');
      setMileageUnit((data.mileageUnit as DistanceUnitType) || 'km');
      
      // Wartungsintervalle laden - neue API
      console.log('Loading car data - useStandardIntervals from DB:', data.useStandardIntervals);
      console.log('Loading car data - useIndividualIntervals from DB:', data.useIndividualIntervals);
      setUseStandardIntervals(data.useStandardIntervals ?? true);
      setUseIndividualIntervals(data.useIndividualIntervals ?? false);
      console.log('Set useStandardIntervals to:', data.useStandardIntervals ?? true);
      console.log('Set useIndividualIntervals to:', data.useIndividualIntervals ?? false);
      
      // Lade individuelle Wartungsintervalle aus der neuen Tabelle
      if (!isNewCar && carId) {
        try {
          const intervals = await getCarMaintenanceIntervals(parseInt(carId), token);
          setMaintenanceIntervals(intervals);
        } catch (intervalError) {
          console.error('Fehler beim Laden der Wartungsintervalle:', intervalError);
          // Fallback: Erstelle Standard-Intervalle aus maintenanceTypes wenn verfügbar
          if (maintenanceTypes.length > 0) {
            createDefaultIntervals();
          }
        }
      } else {
        // Für neue Autos: Erstelle Standard-Intervalle aus maintenanceTypes wenn verfügbar
        if (maintenanceTypes.length > 0) {
          createDefaultIntervals();
        }
      }
      
      // Legacy: Lade alte maintenanceCategories für Kompatibilität
      setMaintenanceCategories(data.maintenanceCategories || defaultMaintenanceCategories);
      
      // Reset upload states
      setImageFile(null);
      setImagePreview(null);
      
    } catch (err) {
      console.error('Error loading car:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden des Fahrzeugs');
    } finally {
      setLoading(false);
    }
  };

  // Lade Standard-Wartungstypen aus der Datenbank
  const loadMaintenanceTypes = async () => {
    if (!token) return;
    
    try {
      const types = await getMaintenanceTypes(token);
      setMaintenanceTypes(types);
    } catch (error) {
      console.error('Fehler beim Laden der Wartungstypen:', error);
      // Fallback auf leeres Array
      setMaintenanceTypes([]);
    }
  };

  // Erstelle Standard-Wartungsintervalle aus den maintenanceTypes
  const createDefaultIntervals = () => {
    if (maintenanceTypes.length > 0) {
      const defaultIntervals: MaintenanceIntervalView[] = maintenanceTypes.map(type => ({
        id: type.id,
        name: type.name,
        description: type.description,
        timeInterval: type.defaultTimeInterval || undefined,
        mileageInterval: type.defaultMileageInterval || undefined,
        isActive: true,
        isCustomized: false,
        maintenanceTypeId: type.id,
        carMaintenanceIntervalId: undefined
      }));
      setMaintenanceIntervals(defaultIntervals);
    }
  };

  useEffect(() => {
    loadCar();
    loadMaintenanceTypes(); // Lade Standard-Wartungstypen
  }, [carId, token]);

  // Erstelle Standard-Intervalle nachdem maintenanceTypes geladen wurden
  useEffect(() => {
    if (maintenanceTypes.length > 0 && maintenanceIntervals.length === 0) {
      createDefaultIntervals();
    }
  }, [maintenanceTypes]);

  const handleFieldChange = () => {
    console.log('handleFieldChange called - setting hasChanges to true');
    setHasChanges(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Erstelle eine Vorschau-URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setImage(''); // Leere URL-Feld wenn Datei hochgeladen wird
        handleFieldChange();
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage('');
    setImageFile(null);
    setImagePreview(null);
    handleFieldChange();
  };

  const getCurrentImageSrc = () => {
    if (imagePreview) return imagePreview;
    if (image) return image;
    return null;
  };

  // Wartungskategorien Funktionen
  const handleAddCategory = () => {
    if (newCategoryName.trim() && (newCategoryTimeInterval || newCategoryMileageInterval)) {
      const newId = Math.max(...maintenanceCategories.map(c => c.id), 0) + 1;
      const newCategory: MaintenanceCategory = {
        id: newId,
        name: newCategoryName.trim(),
        timeInterval: newCategoryTimeInterval,
        mileageInterval: newCategoryMileageInterval,
        description: newCategoryDescription
      };
      
      setMaintenanceCategories([...maintenanceCategories, newCategory]);
      setNewCategoryName('');
      setNewCategoryTimeInterval(12);
      setNewCategoryMileageInterval(15000);
      setNewCategoryDescription('');
      setIsAddingCategory(false);
      handleFieldChange();
    }
  };

  const handleEditCategory = (id: number, name: string, timeInterval: number | null, mileageInterval: number | null, description?: string) => {
    setMaintenanceCategories(categories =>
      categories.map(cat =>
        cat.id === id ? { ...cat, name, timeInterval, mileageInterval, description } : cat
      )
    );
    setEditingCategoryId(null);
    handleFieldChange();
  };

  const handleDeleteCategory = (id: number) => {
    setMaintenanceCategories(categories => categories.filter(cat => cat.id !== id));
    handleFieldChange();
  };

  const resetToStandardCategories = () => {
    setMaintenanceCategories(defaultMaintenanceCategories);
    handleFieldChange();
  };

  // Helper function to format interval display
  const formatInterval = (category: MaintenanceCategory) => {
    const parts = [];
    if (category.timeInterval) {
      parts.push(`${category.timeInterval} Monate`);
    }
    if (category.mileageInterval) {
      parts.push(`${category.mileageInterval.toLocaleString()} km`);
    }
    return parts.length > 0 ? parts.join(' oder ') : 'Nicht definiert';
  };

  // Helper function to format MaintenanceIntervalView display
  const formatIntervalView = (interval: MaintenanceIntervalView) => {
    const parts = [];
    if (interval.timeInterval) {
      parts.push(`${interval.timeInterval} Monate`);
    }
    if (interval.mileageInterval) {
      parts.push(`${interval.mileageInterval.toLocaleString()} km`);
    }
    return parts.length > 0 ? parts.join(' oder ') : 'Nicht definiert';
  };

  // Bulk-Edit Funktionen
  const handleStartEditAll = () => {
    setTempMaintenanceCategories([...maintenanceCategories]);
    setIsEditingAll(true);
    setEditingCategoryId(null); // Schließe einzelne Edits
    setIsAddingCategory(false); // Schließe Add-Form
  };

  const handleSaveAllChanges = () => {
    setMaintenanceCategories(tempMaintenanceCategories);
    setIsEditingAll(false);
    handleFieldChange();
  };

  const handleCancelAllChanges = () => {
    setTempMaintenanceCategories([]);
    setIsEditingAll(false);
  };

  const handleUpdateTempCategory = (id: number, updates: Partial<MaintenanceCategory>) => {
    setTempMaintenanceCategories(categories =>
      categories.map(cat => cat.id === id ? { ...cat, ...updates } : cat)
    );
  };

  // Auto-Save-Funktion speziell für Toggle-Werte
  const saveToggleSettings = async (standardIntervals: boolean, individualIntervals: boolean) => {
    if (!token || isNewCar || !carId) {
      console.log('Cannot auto-save toggle: missing token, is new car, or no carId');
      return;
    }

    try {
      console.log('Auto-saving toggle settings:', { standardIntervals, individualIntervals });
      
      const toggleData = {
        useStandardIntervals: standardIntervals,
        useIndividualIntervals: individualIntervals
      };

      const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toggleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Toggle settings auto-saved successfully:', result);
      
    } catch (error) {
      console.error('Error auto-saving toggle settings:', error);
      setError(`Fehler beim Speichern der Einstellungen: ${error}`);
    }
  };

  // Auto-Save-Funktion für Wartungsintervalle
  const saveMaintenanceIntervals = async (intervals: MaintenanceIntervalView[]) => {
    if (!token || isNewCar || !carId || useStandardIntervals) {
      console.log('Cannot auto-save intervals: missing token, is new car, no carId, or using standard intervals');
      return;
    }

    try {
      console.log('Auto-saving maintenance intervals:', intervals.length, 'intervals');
      
      await updateCarMaintenanceIntervals(parseInt(carId), intervals, token);
      console.log('Maintenance intervals auto-saved successfully');
      
    } catch (error) {
      console.error('Error auto-saving maintenance intervals:', error);
      setError(`Fehler beim Speichern der Wartungsintervalle: ${error}`);
    }
  };

  const handleSave = async () => {
    if (!token) return;

    try {
      setSaving(true);
      setError(null);
      
      let finalImageData = image;
      
      // Wenn eine Datei hochgeladen wurde, verwende die Vorschau-URL
      if (imageFile && imagePreview) {
        finalImageData = imagePreview;
      }
      
      // Konvertiere Leistung immer zu PS für die Datenbank
      const powerInPs = powerUnit === 'PS' 
        ? power
        : convertPowerValue(power, 'kW', 'PS');
      
      // Konvertiere Kilometerstand immer zu km für die Datenbank
      const mileageInKm = mileageUnit === 'km' 
        ? mileage
        : convertDistanceValue(mileage, 'mi', 'km');
      
      const carData = {
        manufacturer,
        model,
        year,
        licensePlate,
        fuel,
        power: powerInPs,
        powerUnit,
        transmission,
        engineSize,
        mileage: mileageInKm,
        mileageUnit,
        notes,
        image: finalImageData,
        // Wartungsintervalle
        useStandardIntervals,
        useIndividualIntervals,
        maintenanceCategories: useStandardIntervals ? defaultMaintenanceCategories : maintenanceCategories
      };

      console.log('Saving car with useStandardIntervals:', useStandardIntervals);
      console.log('Saving car with useIndividualIntervals:', useIndividualIntervals);
      console.log('Car data being sent:', {
        useStandardIntervals: carData.useStandardIntervals,
        useIndividualIntervals: carData.useIndividualIntervals,
        hasMaintenanceCategories: !!carData.maintenanceCategories,
        categoriesCount: carData.maintenanceCategories?.length
      });

      const url = isNewCar ? `${API_BASE_URL}/cars` : `${API_BASE_URL}/cars/${carId}`;
      const method = isNewCar ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(carData),
      });

      if (!response.ok) {
        throw new Error(`Fehler beim Speichern: ${response.statusText}`);
      }

      // Speichere auch die Wartungsintervalle (neue Datenstruktur)
      if (!isNewCar && carId && !useStandardIntervals && maintenanceIntervals.length > 0) {
        try {
          await updateCarMaintenanceIntervals(parseInt(carId), maintenanceIntervals, token);
        } catch (intervalError) {
          console.error('Fehler beim Speichern der Wartungsintervalle:', intervalError);
          // Warnung anzeigen, aber nicht den ganzen Speichervorgang abbrechen
        }
      }

      setHasChanges(false);
      
      if (isNewCar) {
        navigate('/cars');
      } else {
        // Erfolgsmeldung oder refresh
        await loadCar();
      }
    } catch (err) {
      console.error('Error saving car:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !carId || isNewCar) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Fehler beim Löschen: ${response.statusText}`);
      }

      navigate('/cars');
    } catch (err) {
      console.error('Error deleting car:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          {isNewCar ? 'Vorbereitung...' : 'Lade Fahrzeugdaten...'}
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/cars')}>
          Zurück zur Übersicht
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate('/cars')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isNewCar ? 'Neues Fahrzeug hinzufügen' : 'Fahrzeug bearbeiten'}
        </Typography>
      </Box>

      {/* Tab Navigation */}
      <Card sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Details" />
          <Tab label="Wartungsintervalle" />
          <Tab label="Einstellungen" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Stack spacing={3}>
            {/* Bild-Upload und URL */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Fahrzeugbild
              </Typography>
              
              {/* Datei-Upload Button */}
              <Box sx={{ mb: 2 }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  sx={{ mr: 2 }}
                >
                  Bild hochladen
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
                
                {(getCurrentImageSrc() || image || imagePreview) && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<RemoveIcon />}
                    onClick={removeImage}
                  >
                    Bild entfernen
                  </Button>
                )}
              </Box>
            </Box>
            
            {/* Bild-Vorschau */}
            {getCurrentImageSrc() ? (
              <CardMedia
                component="img"
                height="250"
                image={getCurrentImageSrc() || ''}
                alt={`${manufacturer} ${model}`}
                sx={{ objectFit: 'cover', borderRadius: 1 }}
                onError={() => {
                  console.warn('Fehler beim Laden des Bildes');
                }}
              />
            ) : (
              <Box
                sx={{
                  height: 250,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'grey.100',
                  borderRadius: 1,
                  border: '2px dashed',
                  borderColor: 'grey.300'
                }}
              >
                <CarIcon sx={{ fontSize: 60, color: 'grey.400' }} />
              </Box>
            )}

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Fahrzeugdaten
            </Typography>

            {/* Hersteller und Modell */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Hersteller"
                value={manufacturer}
                onChange={(e) => {
                  setManufacturer(e.target.value);
                  handleFieldChange();
                }}
                required
              />
              <TextField
                fullWidth
                label="Modell"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  handleFieldChange();
                }}
                required
              />
            </Box>

            {/* Kennzeichen und Baujahr */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Kennzeichen"
                value={licensePlate}
                onChange={(e) => {
                  setLicensePlate(e.target.value);
                  handleFieldChange();
                }}
                required
              />
              <TextField
                fullWidth
                label="Baujahr"
                type="number"
                value={year}
                onChange={(e) => {
                  setYear(parseInt(e.target.value) || new Date().getFullYear());
                  handleFieldChange();
                }}
                required
              />
            </Box>

            {/* Kraftstoff und Getriebe */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Kraftstoff"
                value={fuel}
                onChange={(e) => {
                  setFuel(e.target.value);
                  handleFieldChange();
                }}
                required
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: {
                        textAlign: 'left'
                      }
                    }
                  }
                }}
                sx={{
                  '& .MuiSelect-select': {
                    textAlign: 'left !important',
                    paddingLeft: '14px !important'
                  },
                  '& .MuiInputBase-input': {
                    textAlign: 'left !important'
                  }
                }}
              >
                {fuelTypes.map((fuelType) => (
                  <MenuItem key={fuelType} value={fuelType}>
                    {fuelType}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Getriebe"
                value={transmission}
                onChange={(e) => {
                  setTransmission(e.target.value);
                  handleFieldChange();
                }}
                required
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: {
                        textAlign: 'left'
                      }
                    }
                  }
                }}
                sx={{
                  '& .MuiSelect-select': {
                    textAlign: 'left !important',
                    paddingLeft: '14px !important'
                  },
                  '& .MuiInputBase-input': {
                    textAlign: 'left !important'
                  }
                }}
              >
                {transmissionTypes.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Hubraum */}
            <TextField
              fullWidth
              margin="normal"
              label="Hubraum (ccm)"
              type="number"
              value={engineSize}
              onChange={(e) => {
                setEngineSize(parseInt(e.target.value) || 0);
                handleFieldChange();
              }}
            />

            {/* Leistung und Kilometerstand */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <PowerInput
                  value={power}
                  unit={powerUnit}
                  onValueChange={(value) => {
                    setPower(parseInt(value) || 0);
                    handleFieldChange();
                  }}
                  onUnitChange={(unit) => {
                    setPowerUnit(unit);
                    handleFieldChange();
                  }}
                  required
                  clearOnUnitChange={false}
                  showConversion={true}
                  textFieldProps={{
                    margin: "normal"
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <MileageInput
                  value={mileage}
                  unit={mileageUnit}
                  onValueChange={(value) => {
                    setMileage(parseInt(value) || 0);
                    handleFieldChange();
                  }}
                  onUnitChange={(unit) => {
                    setMileageUnit(unit);
                    handleFieldChange();
                  }}
                  clearOnUnitChange={false}
                  showConversion={true}
                  textFieldProps={{
                    margin: "normal"
                  }}
                />
              </Box>
            </Box>

            {/* Notizen */}
            <TextField
              fullWidth
              label="Notizen"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                handleFieldChange();
              }}
              helperText="Zusätzliche Informationen zum Fahrzeug"
            />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, pt: 3 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || (!hasChanges && !isNewCar)}
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                size="large"
              >
                {saving ? 'Speichere...' : (isNewCar ? 'Fahrzeug hinzufügen' : 'Änderungen speichern')}
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => navigate('/cars')}
                disabled={saving}
                size="large"
              >
                {isNewCar ? 'Abbrechen' : 'Zurück zur Übersicht'}
              </Button>

              {!isNewCar && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={saving}
                  size="large"
                >
                  Löschen
                </Button>
              )}
            </Box>

            {/* Info wenn Änderungen vorhanden */}
            {hasChanges && !isNewCar && (
              <Alert severity="info">
                Sie haben ungespeicherte Änderungen. Klicken Sie auf "Änderungen speichern" um sie zu übernehmen.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
      )}

      {/* Wartungsintervalle Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Wartungsintervalle
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={useStandardIntervals}
                  onChange={async (e) => {
                    const isUsingStandardIntervals = e.target.checked;
                    console.log('Toggle changed to:', isUsingStandardIntervals);
                    
                    // Setze beide Werte entsprechend der Logik
                    setUseStandardIntervals(isUsingStandardIntervals);
                    setUseIndividualIntervals(!isUsingStandardIntervals);
                    
                    console.log('useStandardIntervals set to:', isUsingStandardIntervals);
                    console.log('useIndividualIntervals set to:', !isUsingStandardIntervals);
                    
                    if (isUsingStandardIntervals) {
                      // Zurück zu Standard-Intervallen - zeige alle maintenanceTypes
                      createDefaultIntervals();
                    } else {
                      // Wechsel zu individuellen Wartungsintervallen
                      if (!isNewCar && carId && token) {
                        try {
                          const intervals = await getCarMaintenanceIntervals(parseInt(carId), token);
                          setMaintenanceIntervals(intervals);
                          console.log('Loaded individual intervals:', intervals.length);
                        } catch (error) {
                          console.error('Fehler beim Laden der Wartungsintervalle:', error);
                          // Fallback: Zeige alle verfügbaren Wartungstypen
                          createDefaultIntervals();
                        }
                      } else {
                        // Für neue Autos: Zeige alle verfügbaren Wartungstypen
                        createDefaultIntervals();
                      }
                    }
                    
                    // Auto-Save der Toggle-Einstellungen
                    await saveToggleSettings(isUsingStandardIntervals, !isUsingStandardIntervals);
                    
                    handleFieldChange();
                  }}
                />
              }
              label={`${useStandardIntervals ? 'Standard-Wartungsintervalle' : 'Individuelle Wartungsintervalle'} verwenden`}
              sx={{ mb: 2 }}
            />

            {useStandardIntervals ? (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Es werden die Standard-Wartungsintervalle verwendet. Schalten Sie auf benutzerdefiniert um, um eigene Intervalle festzulegen.
                </Alert>
                <Typography variant="subtitle2" gutterBottom>
                  Standard-Intervalle (aus Datenbank):
                </Typography>
                <List dense>
                  {maintenanceTypes.map((type) => (
                    <ListItem key={type.id}>
                      <ListItemText
                        primary={type.name}
                        secondary={`${type.defaultTimeInterval ? `${type.defaultTimeInterval} Monate` : ''} ${type.defaultTimeInterval && type.defaultMileageInterval ? 'oder' : ''} ${type.defaultMileageInterval ? `${type.defaultMileageInterval.toLocaleString()} km` : ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
                {maintenanceTypes.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Wartungstypen werden geladen...
                  </Typography>
                )}
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">
                    Benutzerdefinierte Wartungsintervalle
                  </Typography>
                  <Box>
                    <Button
                      size="small"
                      onClick={resetToStandardCategories}
                      sx={{ mr: 1 }}
                      disabled={isEditingAll}
                    >
                      Standard wiederherstellen
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditAllIcon />}
                      onClick={handleStartEditAll}
                      sx={{ mr: 1 }}
                      disabled={isAddingCategory || editingCategoryId !== null}
                    >
                      Alle bearbeiten
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setIsAddingCategory(true)}
                      disabled={isAddingCategory || isEditingAll}
                    >
                      Kategorie hinzufügen
                    </Button>
                  </Box>
                </Box>

                {/* Hinzufügen-Form */}
                {isAddingCategory && (
                  <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                    <Stack spacing={2}>
                      <TextField
                        label="Wartungsart"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="z.B. Klimaservice"
                        fullWidth
                      />
                      <TextField
                        label="Beschreibung"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder="z.B. Klimaanlage warten und desinfizieren"
                        fullWidth
                        multiline
                        rows={2}
                      />
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="Zeit-Intervall (Monate)"
                          type="number"
                          value={newCategoryTimeInterval || ''}
                          onChange={(e) => setNewCategoryTimeInterval(e.target.value ? parseInt(e.target.value) : null)}
                          sx={{ flex: 1 }}
                          InputProps={{
                            inputProps: { min: 1, max: 120 }
                          }}
                          placeholder="z.B. 12"
                        />
                        <TextField
                          label="km-Intervall"
                          type="number"
                          value={newCategoryMileageInterval || ''}
                          onChange={(e) => setNewCategoryMileageInterval(e.target.value ? parseInt(e.target.value) : null)}
                          sx={{ flex: 1 }}
                          InputProps={{
                            inputProps: { min: 1000, max: 200000, step: 1000 }
                          }}
                          placeholder="z.B. 15000"
                        />
                      </Box>
                      <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                        Sie können entweder ein Zeit-Intervall, ein km-Intervall oder beide angeben. 
                        Die Wartung wird fällig, sobald einer der Werte erreicht wird.
                      </Alert>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CheckIcon />}
                          onClick={handleAddCategory}
                          disabled={!newCategoryName.trim() || (!newCategoryTimeInterval && !newCategoryMileageInterval)}
                        >
                          Hinzufügen
                        </Button>
                        <Button
                          size="small"
                          startIcon={<CloseIcon />}
                          onClick={() => {
                            setIsAddingCategory(false);
                            setNewCategoryName('');
                            setNewCategoryTimeInterval(12);
                            setNewCategoryMileageInterval(15000);
                            setNewCategoryDescription('');
                          }}
                        >
                          Abbrechen
                        </Button>
                      </Box>
                    </Stack>
                  </Card>
                )}

                {/* Bulk-Edit Modus */}
                {isEditingAll && (
                  <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Alle Wartungskategorien bearbeiten
                      </Typography>
                      <Box>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CheckIcon />}
                          onClick={handleSaveAllChanges}
                          sx={{ mr: 1 }}
                        >
                          Alle Änderungen speichern
                        </Button>
                        <Button
                          size="small"
                          startIcon={<CloseIcon />}
                          onClick={handleCancelAllChanges}
                        >
                          Abbrechen
                        </Button>
                      </Box>
                    </Box>
                    
                    <Stack spacing={2}>
                      {tempMaintenanceCategories.map((category) => (
                        <Card key={category.id} variant="outlined" sx={{ p: 2 }}>
                          <Stack spacing={2}>
                            <TextField
                              label="Wartungsart"
                              value={category.name}
                              onChange={(e) => handleUpdateTempCategory(category.id, { name: e.target.value })}
                              fullWidth
                              size="small"
                            />
                            <TextField
                              label="Beschreibung"
                              value={category.description || ''}
                              onChange={(e) => handleUpdateTempCategory(category.id, { description: e.target.value })}
                              fullWidth
                              size="small"
                              multiline
                              rows={2}
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <TextField
                                label="Zeit-Intervall (Monate)"
                                type="number"
                                value={category.timeInterval || ''}
                                onChange={(e) => handleUpdateTempCategory(category.id, { 
                                  timeInterval: e.target.value ? parseInt(e.target.value) : null 
                                })}
                                size="small"
                                sx={{ flex: 1 }}
                                InputProps={{
                                  inputProps: { min: 1, max: 120 }
                                }}
                                placeholder="z.B. 12"
                              />
                              <TextField
                                label="km-Intervall"
                                type="number"
                                value={category.mileageInterval || ''}
                                onChange={(e) => handleUpdateTempCategory(category.id, { 
                                  mileageInterval: e.target.value ? parseInt(e.target.value) : null 
                                })}
                                size="small"
                                sx={{ flex: 1 }}
                                InputProps={{
                                  inputProps: { min: 1000, max: 200000, step: 1000 }
                                }}
                                placeholder="z.B. 15000"
                              />
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => setTempMaintenanceCategories(cats => 
                                  cats.filter(cat => cat.id !== category.id)
                                )}
                                sx={{ minWidth: 'auto' }}
                              >
                                Löschen
                              </Button>
                            </Box>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Card>
                )}

                {/* Kategorien-Liste - Neue Datenstruktur */}
                {!isEditingAll && (
                  <List>
                    {maintenanceIntervals.map((interval) => (
                      <ListItem key={interval.id} divider>
                        {editingCategoryId === interval.id ? (
                          <EditCategoryForm
                            category={{
                              id: interval.id,
                              name: interval.name,
                              timeInterval: interval.timeInterval || null,
                              mileageInterval: interval.mileageInterval || null,
                              description: interval.description
                            }}
                            onSave={async (id, name, timeInterval, mileageInterval, description) => {
                              // Update maintenanceIntervals state
                              const updatedIntervals = maintenanceIntervals.map(int => int.id === id 
                                ? { 
                                    ...int, 
                                    timeInterval: timeInterval || undefined, 
                                    mileageInterval: mileageInterval || undefined,
                                    isCustomized: true 
                                  } 
                                : int
                              );
                              
                              setMaintenanceIntervals(updatedIntervals);
                              setEditingCategoryId(null);
                              handleFieldChange();
                              
                              // Auto-Save der Wartungsintervalle
                              await saveMaintenanceIntervals(updatedIntervals);
                            }}
                            onCancel={() => setEditingCategoryId(null)}
                          />
                        ) : (
                          <>
                            <ListItemText
                              primary={interval.name}
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {formatIntervalView(interval)}
                                  </Typography>
                                  {interval.description && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                      {interval.description}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {interval.isCustomized ? 'Angepasst' : 'Standard-Werte'}
                                  </Typography>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                size="small"
                                onClick={() => setEditingCategoryId(interval.id)}
                                sx={{ mr: 1 }}
                              >
                                <EditIcon />
                              </IconButton>
                              {interval.isCustomized && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={async () => {
                                    // Zurücksetzen auf Standard-Werte
                                    const maintenanceType = maintenanceTypes.find(t => t.id === interval.maintenanceTypeId);
                                    if (maintenanceType) {
                                      const updatedIntervals = maintenanceIntervals.map(int => int.id === interval.id 
                                        ? { 
                                            ...int, 
                                            timeInterval: maintenanceType.defaultTimeInterval || undefined,
                                            mileageInterval: maintenanceType.defaultMileageInterval || undefined,
                                            isCustomized: false 
                                          } 
                                        : int
                                      );
                                      
                                      setMaintenanceIntervals(updatedIntervals);
                                      handleFieldChange();
                                      
                                      // Auto-Save der Wartungsintervalle
                                      await saveMaintenanceIntervals(updatedIntervals);
                                    }
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </ListItemSecondaryAction>
                          </>
                        )}
                      </ListItem>
                    ))}
                  </List>
                )}
                
                {/* Fallback wenn keine Intervalle geladen */}
                {!isEditingAll && maintenanceIntervals.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Wartungsintervalle werden geladen...
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Einstellungen Tab */}
      {activeTab === 2 && !isNewCar && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Fahrzeug-Einstellungen
            </Typography>
            <CarSettings />
          </CardContent>
        </Card>
      )}

      {/* Neue Fahrzeuge haben keine Einstellungen */}
      {activeTab === 2 && isNewCar && (
        <Card>
          <CardContent>
            <Alert severity="info">
              Fahrzeug-Einstellungen sind erst nach dem Speichern des Fahrzeugs verfügbar.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Fahrzeug löschen
        </DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie das Fahrzeug "{manufacturer} {model}" wirklich löschen? 
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Lösche...' : 'Löschen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}