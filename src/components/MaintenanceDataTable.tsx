import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Chip,
  IconButton,
  Typography,
  Tooltip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Maintenance } from '../database/entities/Maintenance';
import { MaintenanceTypeLabels, MaintenanceTypeIcons, MaintenanceType } from '../database/entities/Maintenance';
import { useMaintenanceData } from '../hooks/useMaintenanceData';
import type { MaintenanceStatus } from '../hooks/useMaintenanceData';

type DistanceUnit = 'km' | 'miles';

interface MaintenanceDataTableProps {
  maintenances: Maintenance[];
  displayUnit: DistanceUnit;
  onEditMaintenance: (maintenance: Maintenance) => void;
  onDeleteMaintenance: (maintenance: Maintenance) => void;
}

type SortableFields = 'type' | 'lastPerformed' | 'lastMileage' | 'nextDue' | 'nextMileageDue' | 'cost' | 'location';

interface SortConfig {
  field: SortableFields | null;
  direction: 'asc' | 'desc';
}

const MaintenanceDataTable: React.FC<MaintenanceDataTableProps> = ({
  maintenances,
  displayUnit,
  onEditMaintenance,
  onDeleteMaintenance
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<MaintenanceType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  
  const { getMaintenanceStatus } = useMaintenanceData();

  // Hilfsfunktion um die Kategorie für einen Wartungstyp zu finden
  const getMaintenanceCategory = (type: MaintenanceType): string => {
    const categoryMap = {
      'Motoröl und Filter': [
        MaintenanceType.ENGINE_OIL,
        MaintenanceType.OIL_FILTER,
        MaintenanceType.AIR_FILTER,
        MaintenanceType.CABIN_FILTER,
        MaintenanceType.FUEL_FILTER
      ],
      'Zündung': [
        MaintenanceType.SPARK_PLUGS,
        MaintenanceType.GLOW_PLUGS
      ],
      'Riemen': [
        MaintenanceType.TIMING_BELT,
        MaintenanceType.DRIVE_BELT
      ],
      'Bremsen': [
        MaintenanceType.BRAKE_PADS,
        MaintenanceType.BRAKE_DISCS,
        MaintenanceType.BRAKE_FLUID
      ],
      'Flüssigkeiten': [
        MaintenanceType.COOLANT,
        MaintenanceType.AUTOMATIC_TRANSMISSION_FLUID,
        MaintenanceType.MANUAL_TRANSMISSION_FLUID,
        MaintenanceType.DIFFERENTIAL_OIL,
        MaintenanceType.POWER_STEERING_FLUID
      ],
      'Reifen und Elektronik': [
        MaintenanceType.TIRE_CHANGE,
        MaintenanceType.BATTERY,
        MaintenanceType.WIPER_BLADES
      ],
      'Behördliche Termine': [
        MaintenanceType.INSPECTION
      ]
    };

    for (const [category, types] of Object.entries(categoryMap)) {
      if (types.includes(type)) {
        return category;
      }
    }
    return 'Sonstiges';
  };

  // Konvertierungsfunktion
  const convertKmToMiles = (km: number): number => Math.round(km / 1.60934);

  // Status-Chip-Eigenschaften
  const getStatusChip = (status: MaintenanceStatus) => {
    switch (status) {
      case 'overdue':
        return { label: 'Überfällig', color: 'error' as const, variant: 'filled' as const };
      case 'soon':
        return { label: 'Bald fällig', color: 'warning' as const, variant: 'filled' as const };
      case 'good':
        return { label: 'OK', color: 'success' as const, variant: 'filled' as const };
      default:
        return { label: 'Unbekannt', color: 'default' as const, variant: 'outlined' as const };
    }
  };

  // Sortierung
  const handleSort = (field: SortableFields) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Gefilterte und sortierte Daten
  const processedMaintenances = useMemo(() => {
    let filtered = maintenances;

    // Textsuche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(maintenance =>
        MaintenanceTypeLabels[maintenance.type]?.toLowerCase().includes(search) ||
        maintenance.name?.toLowerCase().includes(search) ||
        maintenance.description?.toLowerCase().includes(search) ||
        maintenance.location?.toLowerCase().includes(search) ||
        maintenance.notes?.toLowerCase().includes(search)
      );
    }

    // Status-Filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(maintenance => 
        getMaintenanceStatus(maintenance.type) === statusFilter
      );
    }

    // Typ-Filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(maintenance => maintenance.type === typeFilter);
    }

    // Kategorie-Filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(maintenance => 
        getMaintenanceCategory(maintenance.type) === categoryFilter
      );
    }

    // Sortierung
    if (sortConfig.field) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.field) {
          case 'type':
            aValue = getMaintenanceCategory(a.type);
            bValue = getMaintenanceCategory(b.type);
            break;
          case 'lastPerformed':
            aValue = a.lastPerformed ? new Date(a.lastPerformed).getTime() : 0;
            bValue = b.lastPerformed ? new Date(b.lastPerformed).getTime() : 0;
            break;
          case 'lastMileage':
            aValue = a.lastMileage || 0;
            bValue = b.lastMileage || 0;
            break;
          case 'nextDue':
            aValue = a.nextDue ? new Date(a.nextDue).getTime() : 0;
            bValue = b.nextDue ? new Date(b.nextDue).getTime() : 0;
            break;
          case 'nextMileageDue':
            aValue = a.nextMileageDue || 0;
            bValue = b.nextMileageDue || 0;
            break;
          case 'cost':
            aValue = a.cost || 0;
            bValue = b.cost || 0;
            break;
          case 'location':
            aValue = a.location || '';
            bValue = b.location || '';
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [maintenances, searchTerm, statusFilter, typeFilter, categoryFilter, sortConfig, getMaintenanceStatus]);

  // Unique Types für Filter
  const availableTypes = Array.from(new Set(maintenances.map(m => m.type)));
  const availableCategories = Array.from(new Set(maintenances.map(m => getMaintenanceCategory(m.type))));

  if (maintenances.length === 0) {
    return (
      <Alert severity="info">
        Noch keine Wartungsdaten vorhanden. Fügen Sie zuerst Wartungen hinzu.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filter und Suche */}
      <Box sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Suchen..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | 'all')}
            >
              <MenuItem value="all">Alle Status</MenuItem>
              <MenuItem value="overdue">Überfällig</MenuItem>
              <MenuItem value="soon">Bald fällig</MenuItem>
              <MenuItem value="good">OK</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Kategorie Filter</InputLabel>
            <Select
              value={categoryFilter}
              label="Kategorie Filter"
              onChange={(e) => setCategoryFilter(e.target.value as string | 'all')}
            >
              <MenuItem value="all">Alle Kategorien</MenuItem>
              {availableCategories.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Typ Filter</InputLabel>
            <Select
              value={typeFilter}
              label="Typ Filter"
              onChange={(e) => setTypeFilter(e.target.value as MaintenanceType | 'all')}
            >
              <MenuItem value="all">Alle Typen</MenuItem>
              {availableTypes.map(type => (
                <MenuItem key={type} value={type}>
                  {MaintenanceTypeIcons[type]} {MaintenanceTypeLabels[type]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            {processedMaintenances.length} von {maintenances.length} Einträgen
          </Typography>
        </Stack>
      </Box>

      {/* Tabelle */}
      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'type'}
                  direction={sortConfig.field === 'type' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('type')}
                >
                  Kategorie
                </TableSortLabel>
              </TableCell>
              <TableCell>Wartungstyp</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'lastPerformed'}
                  direction={sortConfig.field === 'lastPerformed' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('lastPerformed')}
                >
                  Zuletzt durchgeführt
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'lastMileage'}
                  direction={sortConfig.field === 'lastMileage' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('lastMileage')}
                >
                  {displayUnit === 'miles' ? 'Letzter Stand (mi)' : 'Letzter Stand (km)'}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'nextDue'}
                  direction={sortConfig.field === 'nextDue' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('nextDue')}
                >
                  Nächster Termin
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'nextMileageDue'}
                  direction={sortConfig.field === 'nextMileageDue' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('nextMileageDue')}
                >
                  {displayUnit === 'miles' ? 'Nächster Stand (mi)' : 'Nächster Stand (km)'}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'cost'}
                  direction={sortConfig.field === 'cost' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('cost')}
                >
                  Kosten
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'location'}
                  direction={sortConfig.field === 'location' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('location')}
                >
                  Werkstatt/Ort
                </TableSortLabel>
              </TableCell>
              <TableCell>Notizen</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processedMaintenances.map((maintenance) => {
              const status = getMaintenanceStatus(maintenance.type);
              const statusChip = getStatusChip(status);
              
              return (
                <TableRow key={maintenance.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium" color="primary">
                      {getMaintenanceCategory(maintenance.type)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
                        {MaintenanceTypeIcons[maintenance.type]}
                      </Typography>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {MaintenanceTypeLabels[maintenance.type]}
                        </Typography>
                        {maintenance.name && maintenance.name !== MaintenanceTypeLabels[maintenance.type] && (
                          <Typography variant="caption" color="text.secondary">
                            {maintenance.name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={statusChip.label}
                      color={statusChip.color}
                      variant={statusChip.variant}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    {maintenance.lastPerformed ? (
                      <Typography variant="body2">
                        {format(new Date(maintenance.lastPerformed), 'dd.MM.yyyy', { locale: de })}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {maintenance.lastMileage ? (
                      <Typography variant="body2">
                        {displayUnit === 'miles' 
                          ? convertKmToMiles(maintenance.lastMileage).toLocaleString('de-DE')
                          : maintenance.lastMileage.toLocaleString('de-DE')
                        }
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {maintenance.nextDue ? (
                      <Typography variant="body2">
                        {format(new Date(maintenance.nextDue), 'dd.MM.yyyy', { locale: de })}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {maintenance.nextMileageDue ? (
                      <Typography variant="body2">
                        {displayUnit === 'miles' 
                          ? convertKmToMiles(maintenance.nextMileageDue).toLocaleString('de-DE')
                          : maintenance.nextMileageDue.toLocaleString('de-DE')
                        }
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {maintenance.cost ? (
                      <Typography variant="body2" color="primary">
                        {maintenance.cost.toLocaleString('de-DE', { 
                          style: 'currency', 
                          currency: 'EUR' 
                        })}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {maintenance.location ? (
                      <Typography variant="body2">
                        {maintenance.location}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {maintenance.notes ? (
                      <Tooltip title={maintenance.notes} arrow>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 150, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            cursor: 'help'
                          }}
                        >
                          {maintenance.notes}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => onEditMaintenance(maintenance)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => onDeleteMaintenance(maintenance)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {processedMaintenances.length === 0 && maintenances.length > 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Keine Wartungen entsprechen den aktuellen Filterkriterien.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MaintenanceDataTable;