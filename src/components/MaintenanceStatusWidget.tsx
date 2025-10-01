import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Chip,
  Collapse,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { MaintenanceType, MaintenanceTypeLabels } from '../database/entities/Maintenance';
import { useMaintenanceData, type MaintenanceStatus } from '../hooks/useMaintenanceData';
import { useAuth } from '../contexts/AuthContext';

export default function MaintenanceStatusWidget() {
  const [expanded, setExpanded] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<MaintenanceType[]>([]);
  const { selectedCarId } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { 
    loading, 
    getMaintenanceStatus,
    maintenances
  } = useMaintenanceData();

  // Lade die ausgewählten Kategorien aus localStorage
  useEffect(() => {
    if (!selectedCarId) return;
    
    const saved = localStorage.getItem(`maintenance-categories-${selectedCarId}`);
    if (saved) {
      const categories = JSON.parse(saved);
      console.log('MaintenanceStatusWidget - Kategorien geladen:', categories);
      setSelectedCategories(categories);
    }
  }, [selectedCarId]);

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
      <Paper sx={{ 
        p: isMobile ? 2 : 3, 
        minHeight: isMobile ? 60 : 80, 
        textAlign: 'center',
        width: '100%'
      }}>
        <CircularProgress size={isMobile ? 20 : 24} />
      </Paper>
    );
  }

  const overallDisplay = getOverallStatusDisplay();

  return (
    <Paper sx={{ p: isMobile ? 2 : 3, width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          mb: expanded ? (isMobile ? 1.5 : 2) : 0,
          minHeight: 44 // Touch-friendly minimum
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
          <Box sx={{ 
            color: overallDisplay.color,
            '& svg': { fontSize: isMobile ? '1.2rem' : '1.5rem' }
          }}>
            {overallDisplay.icon}
          </Box>
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            fontWeight="bold" 
            sx={{ 
              color: overallDisplay.color,
              fontSize: isMobile ? '1rem' : '1.25rem'
            }}
          >
            Wartungsstatus
          </Typography>
        </Box>
        <IconButton 
          size={isMobile ? "small" : "small"} 
          sx={{ 
            color: overallDisplay.color,
            minWidth: 44,
            minHeight: 44,
            '& svg': { fontSize: isMobile ? '1.2rem' : '1.5rem' }
          }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: isMobile ? 1.5 : 2 }}>
            {/* Wartungsstatus Anzeige */}
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant={isMobile ? "body2" : "subtitle2"} 
                fontWeight="bold" 
                sx={{ 
                  color: overallDisplay.color,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
              >
                {overallDisplay.text}
              </Typography>
            </Box>
            
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                mb: 1, 
                display: 'block',
                fontSize: isMobile ? '0.7rem' : '0.75rem'
              }}
            >
              Aktive Wartungskategorien ({selectedCategories.length}) - Wartungen geladen: {maintenances?.length || 0}
            </Typography>
            {selectedCategories.length === 0 ? (
              <Box sx={{ 
                p: isMobile ? 1.5 : 2, 
                backgroundColor: 'rgba(25, 118, 210, 0.04)', 
                borderRadius: 1,
                border: '1px dashed #1976d2'
              }}>
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  color="primary" 
                  textAlign="center"
                  sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                >
                  Gehe zur Wartungsseite, um Kategorien auszuwählen
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: isMobile ? 0.5 : 1,
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
                        size={isMobile ? "small" : "small"}
                        style={chipStyle}
                        sx={{
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          height: isMobile ? 24 : 32,
                          '& .MuiChip-label': {
                            px: isMobile ? 1 : 1.5
                          }
                        }}
                      />
                    );
                  })}
                </Box>
                {maintenances?.length === 0 && (
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      mt: isMobile ? 1.5 : 2,
                      '& .MuiAlert-message': {
                        fontSize: isMobile ? '0.7rem' : '0.75rem'
                      }
                    }}
                  >
                    Keine Wartungsdaten gefunden! Gehe zur Wartungsseite und füge Wartungen hinzu.
                  </Alert>
                )}
              </>
            )}
          </Box>
        </Collapse>
    </Paper>
  );
}