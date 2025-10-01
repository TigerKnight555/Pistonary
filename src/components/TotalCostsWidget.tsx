import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Stack,
  IconButton,
  Collapse,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Euro as EuroIcon,
  Build as MaintenanceIcon,
  LocalGasStation as FuelIcon,
  TrendingUp as TrendIcon
} from '@mui/icons-material';
import { useMaintenanceContext } from '../contexts/MaintenanceContext';

export type TimeRange = 'lastMonth' | 'lastQuarter' | 'lastHalfYear' | 'lastYear' | 'all';

export default function TotalCostsWidget() {
  const [expanded, setExpanded] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('all');
  const { maintenances, refuelings, loading } = useMaintenanceContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', width: '100%' }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Lade Kostendaten...
        </Typography>
      </Paper>
    );
  }

  // Berechne Zeitraum basierend auf Auswahl
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (selectedTimeRange) {
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'lastQuarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'lastHalfYear':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'all':
      default:
        startDate = new Date(1900, 0, 1); // Sehr weit in der Vergangenheit
        break;
    }
    
    return startDate;
  };

  // Filtere Daten nach ausgewähltem Zeitraum
  const getFilteredData = () => {
    const startDate = getDateRange();
    
    const filteredMaintenances = maintenances.filter(m => 
      m.lastPerformed && new Date(m.lastPerformed) >= startDate
    );
    
    const filteredRefuelings = refuelings.filter(r => 
      r.date && new Date(r.date) >= startDate
    );
    
    return { filteredMaintenances, filteredRefuelings };
  };

  const { filteredMaintenances, filteredRefuelings } = getFilteredData();

  // Berechne Gesamtkosten für Wartungen (gefiltert)
  const totalMaintenanceCosts = filteredMaintenances.reduce((total, maintenance) => {
    return total + (maintenance.cost || 0);
  }, 0);

  // Berechne Gesamtkosten für Tankungen (gefiltert)
  const totalFuelCosts = filteredRefuelings.reduce((total, refueling) => {
    return total + (refueling.price || 0);
  }, 0);

  // Gesamtkosten
  const totalCosts = totalMaintenanceCosts + totalFuelCosts;

  // Berechne Durchschnittskosten pro Monat basierend auf gewähltem Zeitraum
  const calculateMonthlyAverage = () => {
    if (selectedTimeRange === 'all') {
      // Bei "alle" verwenden wir die letzten 12 Monate für den Durchschnitt
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
      
      const recentMaintenances = maintenances.filter(m => 
        m.lastPerformed && new Date(m.lastPerformed) >= twelveMonthsAgo
      );
      
      const recentRefuelings = refuelings.filter(r => 
        r.date && new Date(r.date) >= twelveMonthsAgo
      );
      
      const recentMaintenanceCosts = recentMaintenances.reduce((total, m) => total + (m.cost || 0), 0);
      const recentFuelCosts = recentRefuelings.reduce((total, r) => total + (r.price || 0), 0);
      
      return (recentMaintenanceCosts + recentFuelCosts) / 12;
    } else {
      // Bei anderen Zeiträumen basierend auf der Anzahl der Monate im Zeitraum
      let months: number;
      switch (selectedTimeRange) {
        case 'lastMonth': months = 1; break;
        case 'lastQuarter': months = 3; break;
        case 'lastHalfYear': months = 6; break;
        case 'lastYear': months = 12; break;
        default: months = 1;
      }
      
      return totalCosts / months;
    }
  };

  const monthlyAverage = calculateMonthlyAverage();

  // Formatiere Geldbeträge
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Formatiere Anzahl
  const formatCount = (count: number, singular: string, plural: string) => {
    return `${count} ${count === 1 ? singular : plural}`;
  };

  // Zeitraum-Label für UI
  const getTimeRangeLabel = () => {
    switch (selectedTimeRange) {
      case 'lastMonth': return 'Letzter Monat';
      case 'lastQuarter': return 'Letztes Quartal';
      case 'lastHalfYear': return 'Letztes Halbjahr';
      case 'lastYear': return 'Letztes Jahr';
      case 'all': return 'Gesamt';
      default: return 'Letzter Monat';
    }
  };

  return (
    <Paper sx={{ p: isMobile ? 2 : 3, width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          mb: expanded ? (isMobile ? 1.5 : 2) : 0,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1.5 : 0,
          minHeight: 44 // Touch-friendly minimum
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? 0.5 : 1
          }}>
            <EuroIcon 
              color="primary" 
              sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }}
            />
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              fontWeight="bold" 
              color="primary"
              sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
            >
              Gesamtkosten
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1
          }}>
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              fontWeight="bold" 
              color="primary"
              sx={{ 
                fontSize: isMobile ? '1rem' : '1.25rem',
                textAlign: 'right'
              }}
            >
              {formatCurrency(totalCosts)}
            </Typography>
            <IconButton 
              size={isMobile ? "small" : "small"} 
              sx={{ 
                color: 'primary.main',
                minWidth: 44,
                minHeight: 44,
                '& svg': { fontSize: isMobile ? '1.2rem' : '1.5rem' }
              }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
      </Box>

        {/* Erweiterte Details */}
        <Collapse in={expanded}>
          <Box sx={{ mt: isMobile ? 1.5 : 2 }}>
            {/* Zeitraum-Dropdown im Body */}
            <Box sx={{ 
              mb: isMobile ? 1.5 : 2,
              display: 'flex',
              justifyContent: isMobile ? 'stretch' : 'flex-end'
            }}>
              <FormControl 
                size="small" 
                sx={{ 
                  width: isMobile ? '100%' : 'auto',
                  minWidth: isMobile ? 'auto' : 200
                }}
              >
                <InputLabel id="costs-time-range-label">Zeitraum</InputLabel>
                <Select
                  labelId="costs-time-range-label"
                  value={selectedTimeRange}
                  label="Zeitraum"
                  onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange)}
                  sx={{
                    minHeight: isMobile ? 44 : 'auto',
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                >
                  <MenuItem value="lastMonth">Letzter Monat</MenuItem>
                  <MenuItem value="lastQuarter">Letztes Quartal</MenuItem>
                  <MenuItem value="lastHalfYear">Letztes Halbjahr</MenuItem>
                  <MenuItem value="lastYear">Letztes Jahr</MenuItem>
                  <MenuItem value="all">Gesamt</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* Statistik-Caption in eigener Zeile */}
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                mb: 1, 
                display: 'block',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                lineHeight: 1.4
              }}
            >
              Kostenaufschlüsselung ({getTimeRangeLabel()}) • {formatCount(filteredMaintenances.length, 'Wartung', 'Wartungen')} • {formatCount(filteredRefuelings.length, 'Tankung', 'Tankungen')}
            </Typography>
            
            <Stack spacing={isMobile ? 1.5 : 2}>
              {/* Wartungskosten Details */}
              <Box sx={{ 
                p: isMobile ? 1.5 : 2, 
                backgroundColor: 'rgba(25, 118, 210, 0.04)', 
                borderRadius: 1,
                border: '1px solid rgba(25, 118, 210, 0.12)'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mb: 1,
                  gap: 1
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
                    <MaintenanceIcon 
                      color="primary" 
                      sx={{ fontSize: isMobile ? 16 : 18 }} 
                    />
                    <Typography 
                      variant={isMobile ? "caption" : "subtitle2"} 
                      fontWeight="bold" 
                      color="primary"
                      sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                    >
                      Wartungskosten
                    </Typography>
                  </Box>
                  <Typography 
                    variant={isMobile ? "caption" : "subtitle2"} 
                    fontWeight="bold"
                    sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                  >
                    {formatCurrency(totalMaintenanceCosts)}
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                >
                  ⌀ {formatCurrency(totalMaintenanceCosts / Math.max(filteredMaintenances.length, 1))} pro Wartung
                </Typography>
              </Box>

              {/* Kraftstoffkosten Details */}
              <Box sx={{ 
                p: isMobile ? 1.5 : 2, 
                backgroundColor: 'rgba(46, 125, 50, 0.04)', 
                borderRadius: 1,
                border: '1px solid rgba(46, 125, 50, 0.12)'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mb: 1,
                  gap: 1
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
                    <FuelIcon 
                      sx={{ 
                        color: '#2e7d32', 
                        fontSize: isMobile ? 16 : 18 
                      }} 
                    />
                    <Typography 
                      variant={isMobile ? "caption" : "subtitle2"} 
                      fontWeight="bold" 
                      sx={{ 
                        color: '#2e7d32',
                        fontSize: isMobile ? '0.8rem' : '0.875rem'
                      }}
                    >
                      Kraftstoffkosten
                    </Typography>
                  </Box>
                  <Typography 
                    variant={isMobile ? "caption" : "subtitle2"} 
                    fontWeight="bold"
                    sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                  >
                    {formatCurrency(totalFuelCosts)}
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                >
                  ⌀ {formatCurrency(totalFuelCosts / Math.max(filteredRefuelings.length, 1))} pro Tankung
                </Typography>
              </Box>

              {/* Statistiken */}
              <Box sx={{ 
                p: isMobile ? 1.5 : 2, 
                backgroundColor: 'rgba(237, 108, 2, 0.04)', 
                borderRadius: 1,
                border: '1px solid rgba(237, 108, 2, 0.12)'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? 0.5 : 1, 
                  mb: 1 
                }}>
                  <TrendIcon 
                    sx={{ 
                      color: '#ed6c02', 
                      fontSize: isMobile ? 16 : 18 
                    }} 
                  />
                  <Typography 
                    variant={isMobile ? "caption" : "subtitle2"} 
                    fontWeight="bold" 
                    sx={{ 
                      color: '#ed6c02',
                      fontSize: isMobile ? '0.8rem' : '0.875rem'
                    }}
                  >
                    Statistiken
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    Monatsdurchschnitt: {formatCurrency(monthlyAverage)}
                  </Typography>
                  {totalCosts > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`${Math.round((totalMaintenanceCosts / totalCosts) * 100)}% Wartung`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ 
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          height: isMobile ? 24 : 32
                        }}
                      />
                      <Chip 
                        label={`${Math.round((totalFuelCosts / totalCosts) * 100)}% Kraftstoff`}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: '#2e7d32',
                          color: '#2e7d32',
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          height: isMobile ? 24 : 32,
                          '&:hover': {
                            backgroundColor: 'rgba(46, 125, 50, 0.04)'
                          }
                        }}
                      />
                    </Box>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Collapse>
    </Paper>
  );
}