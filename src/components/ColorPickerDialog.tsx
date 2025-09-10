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
  TextField,
  IconButton,
  Divider,
  Paper,
  Tooltip,
  Chip
} from '@mui/material';
import ColorizeIcon from '@mui/icons-material/Colorize';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PaletteIcon from '@mui/icons-material/Palette';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSettings } from '../contexts/SettingsContext';

interface ColorPickerDialogProps {
  open: boolean;
  onClose: () => void;
}

// Vordefinierte Farbpaletten für schnelle Auswahl
const colorPresets = {
  'BMW Blau': { primary: '#1F2937', secondary: '#3B82F6', accent: '#60A5FA' },
  'Mercedes Silber': { primary: '#374151', secondary: '#9CA3AF', accent: '#D1D5DB' },
  'Ferrari Rot': { primary: '#7F1D1D', secondary: '#DC2626', accent: '#F87171' },
  'Audi Rot': { primary: '#991B1B', secondary: '#EF4444', accent: '#FCA5A5' },
  'Porsche Gelb': { primary: '#92400E', secondary: '#F59E0B', accent: '#FCD34D' },
  'Lamborghini Grün': { primary: '#14532D', secondary: '#16A34A', accent: '#4ADE80' },
  'McLaren Orange': { primary: '#C2410C', secondary: '#EA580C', accent: '#FB923C' },
  'Bentley Violett': { primary: '#581C87', secondary: '#8B5CF6', accent: '#C4B5FD' },
};

export default function ColorPickerDialog({ open, onClose }: ColorPickerDialogProps) {
  const { manualColors, setManualColors } = useSettings();
  
  const [colors, setColors] = useState({
    primary: manualColors?.primary || '#1976d2',
    secondary: manualColors?.secondary || '#dc004e',
    accent: manualColors?.accent || '#9c27b0'
  });

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', value: string) => {
    setColors(prev => ({
      ...prev,
      [colorType]: value
    }));
  };

  const handleSave = () => {
    setManualColors(colors);
    onClose();
  };

  const handleReset = () => {
    setColors({
      primary: '#1976d2',
      secondary: '#dc004e',
      accent: '#9c27b0'
    });
  };

  const handleClearManualColors = () => {
    setManualColors(null);
    onClose();
  };

  const handlePresetSelect = (preset: { primary: string; secondary: string; accent: string }) => {
    setColors(preset);
  };

  const handleClose = () => {
    // Stelle ursprüngliche Farben wieder her wenn ohne Speichern geschlossen wird
    if (manualColors) {
      setColors(manualColors);
    }
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 500
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaletteIcon color="primary" />
          <Typography variant="h6">
            Farben Konfiguration
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Vorschau der aktuellen Farben */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 3, 
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
            color: 'white',
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            Vorschau Ihres Themes
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            So werden die Farben in der Anwendung aussehen
          </Typography>
        </Paper>

        {/* Manuelle Farbauswahl */}
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ColorizeIcon />
          Manuelle Farbauswahl
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Primärfarbe
              </Typography>
              <Box 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: colors.primary,
                  borderRadius: 2,
                  mx: 'auto',
                  mb: 2,
                  border: 2,
                  borderColor: 'divider',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('primary-color-input')?.click()}
              />
              <TextField
                id="primary-color-input"
                type="color"
                value={colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                sx={{ 
                  '& input': { 
                    height: 40, 
                    cursor: 'pointer' 
                  }
                }}
                fullWidth
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Sekundärfarbe
              </Typography>
              <Box 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: colors.secondary,
                  borderRadius: 2,
                  mx: 'auto',
                  mb: 2,
                  border: 2,
                  borderColor: 'divider',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('secondary-color-input')?.click()}
              />
              <TextField
                id="secondary-color-input"
                type="color"
                value={colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                sx={{ 
                  '& input': { 
                    height: 40, 
                    cursor: 'pointer' 
                  }
                }}
                fullWidth
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Akzentfarbe
              </Typography>
              <Box 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: colors.accent,
                  borderRadius: 2,
                  mx: 'auto',
                  mb: 2,
                  border: 2,
                  borderColor: 'divider',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('accent-color-input')?.click()}
              />
              <TextField
                id="accent-color-input"
                type="color"
                value={colors.accent}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                sx={{ 
                  '& input': { 
                    height: 40, 
                    cursor: 'pointer' 
                  }
                }}
                fullWidth
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Vordefinierte Farbpaletten */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Vordefinierte Automarken-Paletten
        </Typography>
        
        <Grid container spacing={1}>
          {Object.entries(colorPresets).map(([name, preset]) => (
            <Grid item xs={6} sm={4} md={3} key={name}>
              <Tooltip title={`${name} Theme anwenden`}>
                <Chip
                  label={name}
                  onClick={() => handlePresetSelect(preset)}
                  sx={{
                    width: '100%',
                    height: 48,
                    background: `linear-gradient(45deg, ${preset.primary}, ${preset.secondary})`,
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      transition: 'transform 0.2s'
                    }
                  }}
                />
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={handleReset}
          startIcon={<RefreshIcon />}
          variant="outlined"
        >
          Zurücksetzen
        </Button>
        {manualColors && (
          <Button 
            onClick={handleClearManualColors}
            startIcon={<DeleteIcon />}
            variant="outlined"
            color="error"
          >
            Manuelle Farben Entfernen
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={handleClose}>
          Abbrechen
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
        >
          Farben Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
