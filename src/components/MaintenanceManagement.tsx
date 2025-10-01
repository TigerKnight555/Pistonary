import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Button,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    TablePagination,
    useTheme,
    useMediaQuery,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TableSortLabel,
    Collapse
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Build as BuildIcon,
    FilterList as FilterIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import type { JWTPayload } from '../types/Auth';
import { API_BASE_URL } from '../config/api';
import dayjs from 'dayjs';

// Maintenance-Interface angepasst an die echte Datenbank-Entität
interface Maintenance {
    id: number;
    carId: number;
    type: string;
    name: string;
    description?: string;
    lastPerformed?: string;
    lastMileage?: number;
    intervalMonths?: number;
    intervalKilometers?: number;
    nextDue?: string;
    nextMileageDue?: number;
    reminderAdvanceDays?: number;
    reminderAdvanceKm?: number;
    cost?: number;
    location?: string;
    notes?: string;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
    maintenanceType?: {
        id: number;
        name: string;
        category?: string;
    };
}

interface EditMaintenanceDialogProps {
    open: boolean;
    maintenance: Maintenance | null;
    onClose: () => void;
    onSave: (maintenance: Maintenance) => Promise<void>;
}

function EditMaintenanceDialog({ open, maintenance, onClose, onSave }: EditMaintenanceDialogProps) {
    const [formData, setFormData] = useState({
        lastPerformed: dayjs(),
        name: '',
        type: 'other',
        cost: '',
        lastMileage: '',
        notes: ''
    });

    useEffect(() => {
        if (maintenance) {
            setFormData({
                lastPerformed: maintenance.lastPerformed ? dayjs(maintenance.lastPerformed) : dayjs(),
                name: maintenance.name,
                type: maintenance.type,
                cost: maintenance.cost?.toString() || '',
                lastMileage: maintenance.lastMileage?.toString() || '',
                notes: maintenance.notes || ''
            });
        }
    }, [maintenance]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!maintenance) return;

        const updatedMaintenance: Maintenance = {
            ...maintenance,
            lastPerformed: formData.lastPerformed.toISOString(),
            name: formData.name,
            type: formData.type,
            cost: formData.cost ? parseFloat(formData.cost) : undefined,
            lastMileage: formData.lastMileage ? parseInt(formData.lastMileage) : undefined,
            notes: formData.notes || undefined
        };

        await onSave(updatedMaintenance);
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const maintenanceTypes = [
        { value: 'oil_change', label: 'Ölwechsel' },
        { value: 'inspection', label: 'Inspektion' },
        { value: 'tire_change', label: 'Reifenwechsel' },
        { value: 'brake_service', label: 'Bremsenwartung' },
        { value: 'other', label: 'Sonstiges' }
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Wartung bearbeiten</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Typ</InputLabel>
                            <Select
                                name="type"
                                value={formData.type}
                                label="Typ"
                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Maintenance['type'] }))}
                            >
                                {maintenanceTypes.map(type => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Datum"
                                value={formData.lastPerformed}
                                onChange={(newValue) => setFormData(prev => ({ ...prev, lastPerformed: newValue || dayjs() }))}
                                format="DD.MM.YYYY"
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true
                                    }
                                }}
                            />
                        </LocalizationProvider>

                        <TextField
                            name="lastMileage"
                            label="Kilometerstand"
                            type="number"
                            value={formData.lastMileage}
                            onChange={handleChange}
                            fullWidth
                            inputProps={{ min: 0 }}
                        />

                        <TextField
                            name="cost"
                            label="Kosten (€)"
                            type="number"
                            value={formData.cost}
                            onChange={handleChange}
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                        />

                        <TextField
                            name="notes"
                            label="Notizen"
                            value={formData.notes}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Zusätzliche Informationen..."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Abbrechen</Button>
                    <Button type="submit" variant="contained">Speichern</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default function MaintenanceManagement() {
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Sortierung und Filterung
    const [orderBy, setOrderBy] = useState<keyof Maintenance>('lastPerformed');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        name: '',
        costMin: '',
        costMax: ''
    });
    
    const { token } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const fetchMaintenances = async () => {
        if (!token) {
            setError('Nicht angemeldet');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const decoded = jwtDecode<JWTPayload>(token);
            if (!decoded.selectedCarId) {
                setError('Kein Auto ausgewählt');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/maintenance/${decoded.selectedCarId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setMaintenances([]);
                    setLoading(false);
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            // Nach Datum sortieren (neueste zuerst)
            const sortedData = data.sort((a: Maintenance, b: Maintenance) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setMaintenances(sortedData);
        } catch (err) {
            console.error('Error fetching maintenances:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Laden der Wartungen');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (maintenance: Maintenance) => {
        setSelectedMaintenance(maintenance);
        setEditDialogOpen(true);
    };

    const handleSave = async (updatedMaintenance: Maintenance) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/maintenance/${updatedMaintenance.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedMaintenance),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await fetchMaintenances(); // Daten neu laden
        } catch (err) {
            console.error('Error updating maintenance:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
        }
    };

    const handleDelete = async (maintenanceId: number) => {
        if (!token || !confirm('Möchten Sie diese Wartung wirklich löschen?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/maintenance/${maintenanceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await fetchMaintenances(); // Daten neu laden
        } catch (err) {
            console.error('Error deleting maintenance:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
        }
    };

    const getMaintenanceTypeLabel = (type: Maintenance['type']) => {
        const types = {
            oil_change: 'Ölwechsel',
            inspection: 'Inspektion',
            tire_change: 'Reifenwechsel',
            brake_service: 'Bremsenwartung',
            other: 'Sonstiges'
        };
        return types[type];
    };

    const getMaintenanceTypeColor = (type: Maintenance['type']) => {
        const colors = {
            oil_change: 'warning',
            inspection: 'primary',
            tire_change: 'info',
            brake_service: 'error',
            other: 'default'
        } as const;
        return colors[type];
    };

    useEffect(() => {
        fetchMaintenances();
    }, [token]);

    // Sortier- und Filterfunktionen
    const handleRequestSort = (property: keyof Maintenance) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(0); // Reset zur ersten Seite
    };

    const sortMaintenances = (maintenances: Maintenance[]) => {
        return maintenances.sort((a, b) => {
            let aVal: any = a[orderBy];
            let bVal: any = b[orderBy];

            // Spezielle Behandlung für Datumsfelder
            if (orderBy === 'lastPerformed' || orderBy === 'nextDue') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }

            if (bVal < aVal) {
                return order === 'asc' ? 1 : -1;
            }
            if (bVal > aVal) {
                return order === 'asc' ? -1 : 1;
            }
            return 0;
        });
    };

    const filterMaintenances = (maintenances: Maintenance[]) => {
        return maintenances.filter(maintenance => {
            // Datumsfilter
            if (filters.dateFrom && dayjs(maintenance.lastPerformed).isBefore(dayjs(filters.dateFrom))) {
                return false;
            }
            if (filters.dateTo && dayjs(maintenance.lastPerformed).isAfter(dayjs(filters.dateTo))) {
                return false;
            }

            // Namefilter
            if (filters.name && !maintenance.name.toLowerCase().includes(filters.name.toLowerCase())) {
                return false;
            }

            // Kostenfilter
            if (filters.costMin && (!maintenance.cost || maintenance.cost < parseFloat(filters.costMin))) {
                return false;
            }
            if (filters.costMax && (!maintenance.cost || maintenance.cost > parseFloat(filters.costMax))) {
                return false;
            }

            return true;
        });
    };

    const processedMaintenances = sortMaintenances(filterMaintenances(maintenances));

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    const paginatedMaintenances = processedMaintenances.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Wartungen ({processedMaintenances.length} von {maintenances.length})
                </Typography>
            </Box>

            {maintenances.length === 0 ? (
                <Alert severity="info">
                    Noch keine Wartungen vorhanden.
                </Alert>
            ) : (
                <>
                    {/* Filter-Bereich - Temporär auskommentiert */}
                    {/*
                    <Paper sx={{ mb: 2 }}>
                        <Box sx={{ p: 2 }}>
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'action.hover' },
                                    borderRadius: 1,
                                    p: 1,
                                    mx: -1
                                }}
                                onClick={() => setFiltersOpen(!filtersOpen)}
                            >
                                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FilterIcon />
                                    Filter
                                </Typography>
                                {filtersOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </Box>
                            
                            <Collapse in={filtersOpen}>
                                <Box sx={{ pt: 2 }}>
                                    <Stack spacing={2}>
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 2
                                        }}>
                                            <TextField
                                                label="Von Datum"
                                                type="date"
                                                value={filters.dateFrom}
                                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                                size="small"
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                            />
                                            <TextField
                                                label="Bis Datum"
                                                type="date"
                                                value={filters.dateTo}
                                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                                size="small"
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Box>
                                        
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 2
                                        }}>
                                            <TextField
                                                label="Min. Kosten"
                                                type="number"
                                                value={filters.costMin}
                                                onChange={(e) => handleFilterChange('costMin', e.target.value)}
                                                size="small"
                                                fullWidth
                                                inputProps={{ min: 0, step: 0.01 }}
                                            />
                                            <TextField
                                                label="Max. Kosten"
                                                type="number"
                                                value={filters.costMax}
                                                onChange={(e) => handleFilterChange('costMax', e.target.value)}
                                                size="small"
                                                fullWidth
                                                inputProps={{ min: 0, step: 0.01 }}
                                            />
                                        </Box>
                                        
                                        <Box>
                                            <TextField
                                                label="Name suchen"
                                                value={filters.name}
                                                onChange={(e) => handleFilterChange('name', e.target.value)}
                                                size="small"
                                                fullWidth
                                            />
                                        </Box>
                                    </Stack>
                                </Box>
                            </Collapse>
                        </Box>
                    </Paper>
                    */}

                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table size={isMobile ? "small" : "medium"}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'lastPerformed'}
                                            direction={orderBy === 'lastPerformed' ? order : 'asc'}
                                            onClick={() => handleRequestSort('lastPerformed')}
                                        >
                                            Datum
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'name'}
                                            direction={orderBy === 'name' ? order : 'asc'}
                                            onClick={() => handleRequestSort('name')}
                                        >
                                            Name
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={orderBy === 'cost'}
                                            direction={orderBy === 'cost' ? order : 'asc'}
                                            onClick={() => handleRequestSort('cost')}
                                        >
                                            Kosten
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={orderBy === 'lastMileage'}
                                            direction={orderBy === 'lastMileage' ? order : 'asc'}
                                            onClick={() => handleRequestSort('lastMileage')}
                                        >
                                            KM-Stand
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="center">Aktionen</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedMaintenances.map((maintenance) => (
                                    <TableRow key={maintenance.id} hover>
                                        <TableCell>
                                            {dayjs(maintenance.lastPerformed).format('DD.MM.YYYY')}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                {maintenance.name}
                                            </Typography>
                                            {maintenance.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {maintenance.description.length > 40 
                                                        ? maintenance.description.substring(0, 40) + '...'
                                                        : maintenance.description
                                                    }
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            {maintenance.cost ? `${maintenance.cost.toFixed(2)} €` : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {maintenance.lastMileage ? `${maintenance.lastMileage.toLocaleString()} km` : '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(maintenance)}
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(maintenance.id)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={processedMaintenances.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_event, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(event) => {
                            setRowsPerPage(parseInt(event.target.value, 10));
                            setPage(0);
                        }}
                        labelRowsPerPage="Zeilen pro Seite:"
                    />
                </>
            )}

            <EditMaintenanceDialog
                open={editDialogOpen}
                maintenance={selectedMaintenance}
                onClose={() => {
                    setEditDialogOpen(false);
                    setSelectedMaintenance(null);
                }}
                onSave={handleSave}
            />
        </Box>
    );
}