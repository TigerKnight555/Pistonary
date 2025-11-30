import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Switch,
  Typography,
  Divider,
  Box,
  Tooltip
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PaletteIcon from '@mui/icons-material/Palette';
import LockIcon from '@mui/icons-material/Lock';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useSettings } from '../contexts/SettingsContext';
import ColorPickerDialog from './ColorPickerDialog';
import ChangePasswordDialog from './ChangePasswordDialog';
import ChartSettingsDialog from './ChartSettingsDialog';

export default function SettingsMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChartSettingsOpen, setIsChartSettingsOpen] = useState(false);
  const { isDarkMode, /* isAutoColorEnabled, */ manualColors, toggleDarkMode, /* toggleAutoColor */ } = useSettings();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDarkModeToggle = () => {
    toggleDarkMode();
  };

  /* Temporär deaktiviert
  const handleAutoColorToggle = () => {
    toggleAutoColor();
  };
  */

  const handleColorPickerOpen = () => {
    setIsColorPickerOpen(true);
    handleClose();
  };

  const handleColorPickerClose = () => {
    setIsColorPickerOpen(false);
  };

  const handleChangePasswordOpen = () => {
    setIsChangePasswordOpen(true);
    handleClose();
  };

  const handleChangePasswordClose = () => {
    setIsChangePasswordOpen(false);
  };

  const handleChartSettingsOpen = () => {
    setIsChartSettingsOpen(true);
    handleClose();
  };

  const handleChartSettingsClose = () => {
    setIsChartSettingsOpen(false);
  };

  return (
    <>
      <Tooltip title="Einstellungen">
        <IconButton
          onClick={handleClick}
          size="large"
          sx={{
            color: 'inherit',
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 280,
            mt: 1,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Einstellungen
          </Typography>
        </Box>
        
        <Divider />
        
        {/* Dark Mode Toggle */}
        <MenuItem onClick={handleDarkModeToggle} sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              {isDarkMode ? <Brightness4Icon /> : <Brightness7Icon />}
              <Typography variant="body1" sx={{ ml: 2, fontWeight: 500 }}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Switch
                checked={isDarkMode}
                onChange={handleDarkModeToggle}
                size="small"
                onClick={(e) => e.stopPropagation()} // Verhindere Menü-Schließung
              />
            </Box>
          </Box>
        </MenuItem>

        <Divider />

        {/* Auto Color Toggle */}
        {/* Temporär deaktiviert
        <MenuItem onClick={handleAutoColorToggle} sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <PaletteIcon />
              <Box sx={{ ml: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Auto-Farberkennung
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Farben automatisch aus Auto-Bild extrahieren
                </Typography>
              </Box>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Switch
                checked={isAutoColorEnabled}
                onChange={handleAutoColorToggle}
                size="small"
                onClick={(e) => e.stopPropagation()} // Verhindere Menü-Schließung
              />
            </Box>
          </Box>
        </MenuItem>

        <Divider />
        */}

        {/* Color Picker Option */}
        <MenuItem onClick={handleColorPickerOpen}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
              <PaletteIcon color="primary" />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Farben Konfigurieren
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {manualColors ? 'Manuelle Farben aktiv' : 'Manuelle Farbauswahl mit Color Picker'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </MenuItem>

        <Divider />

        {/* Chart Settings Option */}
        <MenuItem onClick={handleChartSettingsOpen}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
              <BarChartIcon color="primary" />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Statistik-Optionen
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Verfügbare Datenansichten und Diagrammtypen konfigurieren
                </Typography>
              </Box>
            </Box>
          </Box>
        </MenuItem>

        <Divider />

        {/* Password Change Option */}
        <MenuItem onClick={handleChangePasswordOpen}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
              <LockIcon color="primary" />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Passwort ändern
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Sicherheitseinstellungen verwalten
                </Typography>
              </Box>
            </Box>
          </Box>
        </MenuItem>

        <Divider />

        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Einstellungen werden automatisch gespeichert
          </Typography>
        </Box>
      </Menu>

      {/* Color Picker Dialog */}
      <ColorPickerDialog 
        open={isColorPickerOpen}
        onClose={handleColorPickerClose}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog 
        open={isChangePasswordOpen}
        onClose={handleChangePasswordClose}
      />

      {/* Chart Settings Dialog */}
      <ChartSettingsDialog 
        open={isChartSettingsOpen}
        onClose={handleChartSettingsClose}
      />
    </>
  );
}
