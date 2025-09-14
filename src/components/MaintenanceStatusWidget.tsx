import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Chip,
  Collapse,
  IconButton,
  Typography,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { MaintenanceType, MaintenanceTypeLabels } from '../database/entities/Maintenance';
import { useMaintenanceData, type MaintenanceStatus } from '../hooks/useMaintenanceData';

export default function MaintenanceStatusWidget() {
  const [expanded, setExpanded] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<MaintenanceType[]>([]);
  
  const { 
    loading, 
    getMaintenanceStatus,
    maintenances
  } = useMaintenanceData();

  // Debug: Lade die ausgewählten Kategorien aus localStorage (wie in MaintenancePage)
  useEffect(() => {
    const carId = 1; // Dummy carId - später aus Context holen
    const saved = localStorage.getItem(`maintenance-categories-${carId}`);
    if (saved) {
      const categories = JSON.parse(saved);
      console.log('MaintenanceStatusWidget - Kategorien geladen:', categories);
      setSelectedCategories(categories);
    }
  }, []);

  // Debug: Zeige Wartungsdaten an
  useEffect(() => {
    console.log('MaintenanceStatusWidget - Wartungsdaten:', {
      loading,
      maintenancesCount: maintenances?.length || 0,
      maintenances: maintenances,
      selectedCategories
    });
  }, [loading, maintenances, selectedCategories]);

  // Bestimme Gesamtstatus basierend auf ausgewählten Kategorien (schlechtester Status)
  const getOverallStatus = (): MaintenanceStatus => {
    if (selectedCategories.length === 0) return 'not_recorded';
    
    const statuses = selectedCategories.map(type => getMaintenanceStatus(type));
    
    // Priorität: overdue > soon > good > not_recorded
    if (statuses.includes('overdue')) return 'overdue';
    if (statuses.includes('soon')) return 'soon';
    if (statuses.some(status => status === 'good')) return 'good';
    return 'not_recorded';
  };

  // Bestimme Icon und Farbe für Gesamtstatus
  const getOverallStatusDisplay = () => {
    const status = getOverallStatus();
    
    switch (status) {
      case 'overdue':
        return {
          icon: <ErrorIcon />,
          color: '#d32f2f',
          text: 'Wartung überfällig',
          bgColor: '#ffebee'
        };
      case 'soon':
        return {
          icon: <WarningIcon />,
          color: '#ed6c02',
          text: 'Wartung bald fällig',
          bgColor: '#fff3e0'
        };
      case 'good':
        return {
          icon: <CheckCircleIcon />,
          color: '#2e7d32',
          text: 'Alle Wartungen OK',
          bgColor: '#e8f5e8'
        };
      default:
        return {
          icon: <BuildIcon />,
          color: '#1976d2',
          text: selectedCategories.length === 0 ? 'Wartungskategorien auswählen' : 'Wartungen nicht erfasst',
          bgColor: 'transparent'
        };
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, minHeight: 80, textAlign: 'center' }}>
        <CircularProgress size={24} />
      </Paper>
    );
  }

  const overallDisplay = getOverallStatusDisplay();

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          mb: expanded ? 2 : 0
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: overallDisplay.color }}>
            {overallDisplay.icon}
          </Box>
          <Typography variant="h6" fontWeight="bold" sx={{ color: overallDisplay.color }}>
            Wartungsstatus
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ color: overallDisplay.color }}>
            {overallDisplay.text}
          </Typography>
          <IconButton size="small" sx={{ color: overallDisplay.color }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Aktive Wartungskategorien ({selectedCategories.length}) - Wartungen geladen: {maintenances?.length || 0}
            </Typography>
            {selectedCategories.length === 0 ? (
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'rgba(25, 118, 210, 0.04)', 
                borderRadius: 1,
                border: '1px dashed #1976d2'
              }}>
                <Typography variant="body2" color="primary" textAlign="center">
                  Gehe zur Wartungsseite, um Kategorien auszuwählen
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1,
                  alignItems: 'flex-start'
                }}>
                  {selectedCategories.map((type) => {
                    const status = getMaintenanceStatus(type);
                    
                    // Direkte Chip-Implementierung mit einfachen Farben
                    let chipStyle = {};
                    if (status === 'overdue') {
                      chipStyle = { backgroundColor: '#d32f2f', color: 'white' };
                    } else if (status === 'soon') {
                      chipStyle = { backgroundColor: '#ed6c02', color: 'white' };
                    } else if (status === 'good') {
                      chipStyle = { backgroundColor: '#2e7d32', color: 'white' };
                    }
                    
                    return (
                      <Chip
                        key={type}
                        label={MaintenanceTypeLabels[type]}
                        size="small"
                        style={chipStyle}
                      />
                    );
                  })}
                </Box>
                {maintenances?.length === 0 && (
                  <Box sx={{ mt: 2, p: 1, backgroundColor: '#fff3cd', borderRadius: 1 }}>
                    <Typography variant="caption" color="warning.main">
                      ⚠️ Keine Wartungsdaten gefunden! Gehe zur Wartungsseite und füge Wartungen hinzu.
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Collapse>
    </Paper>
  );
}