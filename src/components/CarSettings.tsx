import { useState } from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { API_BASE_URL } from '../config/api';

export default function CarSettings() {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleDeleteCar = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
        method: 'DELETE',
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
    </Box>
  );
}
