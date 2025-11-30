import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import type { Car } from '../types/Car';

interface CarSettingsProps {
  showOnlyFixedCosts?: boolean;
}

export default function CarSettings({ showOnlyFixedCosts = false }: CarSettingsProps) {
  const { carId } = useParams<{ carId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [car, setCar] = useState<Car | null>(null);
  const [taxCosts, setTaxCosts] = useState<string>('');
  const [insuranceCosts, setInsuranceCosts] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchCarData();
  }, [carId]);

  const fetchCarData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Fehler beim Laden der Fahrzeugdaten');
      const data: Car = await response.json();
      setCar(data);
      setTaxCosts(data.taxCosts?.toString() || '');
      setInsuranceCosts(data.insuranceCosts?.toString() || '');
    } catch (error) {
      console.error('Error fetching car data:', error);
      setSnackbar({
        open: true,
        message: 'Fehler beim Laden der Fahrzeugdaten',
        severity: 'error'
      });
    }
  };

  const handleSaveCosts = async () => {
    try {
      const updatedData = {
        ...car,
        taxCosts: taxCosts ? parseFloat(taxCosts) : undefined,
        insuranceCosts: insuranceCosts ? parseFloat(insuranceCosts) : undefined,
      };

      console.log('Saving costs:', updatedData);

      const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save error:', errorText);
        throw new Error('Fehler beim Speichern der Kosten');
      }
      
      const savedData = await response.json();
      console.log('Saved successfully:', savedData);
      
      setSnackbar({
        open: true,
        message: 'Kosten erfolgreich gespeichert',
        severity: 'success'
      });
      
      // Update local state without refetching
      setCar(savedData);
      setTaxCosts(savedData.taxCosts?.toString() || '');
      setInsuranceCosts(savedData.insuranceCosts?.toString() || '');
    } catch (error) {
      console.error('Error saving costs:', error);
      setSnackbar({
        open: true,
        message: 'Fehler beim Speichern der Kosten',
        severity: 'error'
      });
    }
  };

  const handleDeleteCar = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Fehler beim Löschen des Fahrzeugs');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting car:', error);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Fixkosten
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Tragen Sie hier die jährlichen Kosten für Steuer und Versicherung ein.
          Diese werden bei der Gesamtkostenberechnung berücksichtigt.
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
          <TextField
            label="Jährliche Steuerkosten"
            type="number"
            value={taxCosts}
            onChange={(e) => setTaxCosts(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
            }}
            helperText="Kosten pro Jahr"
            fullWidth
          />
          
          <TextField
            label="Jährliche Versicherungskosten"
            type="number"
            value={insuranceCosts}
            onChange={(e) => setInsuranceCosts(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
            }}
            helperText="Kosten pro Jahr"
            fullWidth
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveCosts}
          sx={{ mt: 1 }}
        >
          Kosten speichern
        </Button>
      </Paper>

      {!showOnlyFixedCosts && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Gefahrenzone
          </Typography>
          <Typography variant="body1" paragraph>
            In diesem Bereich können Sie gefährliche oder irreversible Änderungen an Ihrem Fahrzeug vornehmen.
            Bitte seien Sie vorsichtig, da einige dieser Aktionen nicht rückgängig gemacht werden können.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Fahrzeug löschen
          </Button>
        </Paper>
      )}

      {!showOnlyFixedCosts && (
        <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
          <DialogTitle>Fahrzeug löschen</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten des Fahrzeugs,
              einschließlich aller Betankungen und Statistiken, werden dauerhaft gelöscht.
              Bitte geben Sie "LÖSCHEN" ein, um zu bestätigen.
            </DialogContentText>
            <TextField
              autoFocus
              fullWidth
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              margin="dense"
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleDeleteCar}
              color="error"
              disabled={deleteConfirmText !== 'LÖSCHEN'}
            >
              Fahrzeug endgültig löschen
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
