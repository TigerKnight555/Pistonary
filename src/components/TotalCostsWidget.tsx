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
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('lastMonth');
  const { maintenances, refuelings, loading } = useMaintenanceContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
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
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          mb: expanded ? 2 : 0,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EuroIcon color="primary" />
          <Typography variant="h6" fontWeight="bold" color="primary">
            Gesamtkosten
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="costs-time-range-label">Zeitraum</InputLabel>
            <Select
              labelId="costs-time-range-label"
              value={selectedTimeRange}
              label="Zeitraum"
              onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange)}
              onClick={(e) => e.stopPropagation()} // Verhindert Expand/Collapse beim Klicken auf Select
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.87)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
              }}
            >
              <MenuItem value="lastMonth">Letzter Monat</MenuItem>
              <MenuItem value="lastQuarter">Letztes Quartal</MenuItem>
              <MenuItem value="lastHalfYear">Letztes Halbjahr</MenuItem>
              <MenuItem value="lastYear">Letztes Jahr</MenuItem>
              <MenuItem value="all">Gesamt</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" fontWeight="bold" color="primary">
            {formatCurrency(totalCosts)}
          </Typography>
          <IconButton size="small" sx={{ color: 'primary.main' }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

        {/* Erweiterte Details */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Kostenaufschlüsselung ({getTimeRangeLabel()}) • {formatCount(filteredMaintenances.length, 'Wartung', 'Wartungen')} • {formatCount(filteredRefuelings.length, 'Tankung', 'Tankungen')}
            </Typography>
            
            <Stack spacing={2}>
              {/* Wartungskosten Details */}
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'rgba(25, 118, 210, 0.04)', 
                borderRadius: 1,
                border: '1px solid rgba(25, 118, 210, 0.12)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MaintenanceIcon color="primary" sx={{ fontSize: 18 }} />
                    <Typography variant="subtitle2" fontWeight="bold" color="primary">
                      Wartungskosten
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {formatCurrency(totalMaintenanceCosts)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  ⌀ {formatCurrency(totalMaintenanceCosts / Math.max(filteredMaintenances.length, 1))} pro Wartung
                </Typography>
              </Box>

              {/* Kraftstoffkosten Details */}
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'rgba(46, 125, 50, 0.04)', 
                borderRadius: 1,
                border: '1px solid rgba(46, 125, 50, 0.12)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FuelIcon sx={{ color: '#2e7d32', fontSize: 18 }} />
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#2e7d32' }}>
                      Kraftstoffkosten
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {formatCurrency(totalFuelCosts)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  ⌀ {formatCurrency(totalFuelCosts / Math.max(filteredRefuelings.length, 1))} pro Tankung
                </Typography>
              </Box>

              {/* Statistiken */}
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'rgba(237, 108, 2, 0.04)', 
                borderRadius: 1,
                border: '1px solid rgba(237, 108, 2, 0.12)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendIcon sx={{ color: '#ed6c02', fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#ed6c02' }}>
                    Statistiken
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Monatsdurchschnitt: {formatCurrency(monthlyAverage)}
                  </Typography>
                  {totalCosts > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`${Math.round((totalMaintenanceCosts / totalCosts) * 100)}% Wartung`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                      <Chip 
                        label={`${Math.round((totalFuelCosts / totalCosts) * 100)}% Kraftstoff`}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: '#2e7d32',
                          color: '#2e7d32',
                          fontSize: '0.75rem',
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