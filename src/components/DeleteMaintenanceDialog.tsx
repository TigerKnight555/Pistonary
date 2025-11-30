import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { useState } from 'react';
import {
  MaintenanceTypeLabels,
  MaintenanceTypeIcons,
  type Maintenance
} from '../database/entities/Maintenance';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface DeleteMaintenanceDialogProps {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  maintenance: Maintenance | null;
}

export default function DeleteMaintenanceDialog({
  open,
  onClose,
  onDeleted,
  maintenance
}: DeleteMaintenanceDialogProps) {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleDelete = async () => {
    if (!maintenance) return;

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/maintenance/${maintenance.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        console.log('Maintenance deleted successfully');
        onDeleted();
        onClose();
      } else {
        throw new Error('Failed to delete maintenance');
      }
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      setError('Fehler beim Löschen der Wartung');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setError('');
  };

  if (!maintenance) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        Wartung löschen
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          Möchten Sie diese Wartung wirklich löschen? 
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Diese Aktion kann nicht rückgängig gemacht werden.
        </Typography>

        {/* Wartungsdetails */}
        <Box sx={{ 
          bgcolor: 'grey.800', 
          color: 'white',
          p: 2, 
          borderRadius: 1,
          border: 1,
          borderColor: 'grey.600'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="body1" sx={{ fontSize: '1.5rem' }}>
              {MaintenanceTypeIcons[maintenance.type]}
            </Typography>
            <Typography variant="h6" component="h3">
              {MaintenanceTypeLabels[maintenance.type]}
            </Typography>
          </Box>
          
          {maintenance.lastPerformed && (
            <Typography variant="body2" sx={{ color: 'grey.300' }}>
              Durchgeführt am: {format(new Date(maintenance.lastPerformed), 'dd.MM.yyyy', { locale: de })}
            </Typography>
          )}
          
          {maintenance.lastMileage && (
            <Typography variant="body2" sx={{ color: 'grey.300' }}>
              Bei Kilometerstand: {maintenance.lastMileage.toLocaleString('de-DE')} km
            </Typography>
          )}
          
          {maintenance.cost && (
            <Typography variant="body2" sx={{ color: 'grey.300' }}>
              Kosten: {maintenance.cost.toLocaleString('de-DE', { 
                style: 'currency', 
                currency: 'EUR' 
              })}
            </Typography>
          )}
          
          {maintenance.notes && (
            <Typography variant="body2" sx={{ color: 'grey.300', mt: 1 }}>
              Notizen: {maintenance.notes}
            </Typography>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} sx={{ flex: 1 }}>
          Abbrechen
        </Button>
        <Button 
          onClick={handleDelete}
          variant="contained" 
          color="error"
          disabled={isDeleting}
          sx={{ flex: 1 }}
        >
          {isDeleting ? 'Wird gelöscht...' : 'Löschen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}