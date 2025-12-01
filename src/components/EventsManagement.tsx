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
    Chip,
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
    Event as EventIcon,
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
import dayjs, { Dayjs } from 'dayjs';

// Temporäre Event-Interface (sollte später aus der richtigen Datei importiert werden)
interface Event {
    id: number;
    date: string;
    title: string;
    description?: string;
    type: 'maintenance' | 'repair' | 'accident' | 'other';
    cost?: number;
    mileage?: number;
    carId: number;
    created_at: string;
    updated_at: string;
}

interface EditEventDialogProps {
    open: boolean;
    event: Event | null;
    onClose: () => void;
    onSave: (event: Event) => Promise<void>;
}

function EditEventDialog({ open, event, onClose, onSave }: EditEventDialogProps) {
    const [formData, setFormData] = useState({
        date: dayjs(),
        title: '',
        description: '',
        type: 'other' as Event['type'],
        cost: '',
        mileage: ''
    });

    useEffect(() => {
        if (event) {
            setFormData({
                date: dayjs(event.date),
                title: event.title,
                description: event.description || '',
                type: event.type,
                cost: event.cost?.toString() || '',
                mileage: event.mileage?.toString() || ''
            });
        }
    }, [event]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;

        const updatedEvent: Event = {
            ...event,
            date: formData.date.toISOString(),
            title: formData.title,
            description: formData.description || undefined,
            type: formData.type,
            cost: formData.cost ? parseFloat(formData.cost) : undefined,
            mileage: formData.mileage ? parseInt(formData.mileage) : undefined
        };

        await onSave(updatedEvent);
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const eventTypes = [
        { value: 'maintenance', label: 'Wartung' },
        { value: 'repair', label: 'Reparatur' },
        { value: 'accident', label: 'Unfall' },
        { value: 'other', label: 'Sonstiges' }
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Ereignis bearbeiten</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Datum"
                                value={formData.date}
                                onChange={(newValue) => setFormData(prev => ({ ...prev, date: (newValue as Dayjs) || dayjs() }))}
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
                            name="title"
                            label="Titel"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            fullWidth
                        />

                        <FormControl fullWidth>
                            <InputLabel>Typ</InputLabel>
                            <Select
                                name="type"
                                value={formData.type}
                                label="Typ"
                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Event['type'] }))}
                            >
                                {eventTypes.map(type => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            name="description"
                            label="Beschreibung"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                        />

                        <TextField
                            name="cost"
                            label="Kosten (optional)"
                            type="number"
                            value={formData.cost}
                            onChange={handleChange}
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                        />

                        <TextField
                            name="mileage"
                            label="Kilometerstand (optional)"
                            type="number"
                            value={formData.mileage}
                            onChange={handleChange}
                            fullWidth
                            inputProps={{ min: 0 }}
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

export default function EventsManagement() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Sortierung und Filterung
    const [orderBy, setOrderBy] = useState<keyof Event>('date');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        title: '',
        type: 'all' // all, accident, repair, other etc.
    });
    
    const { token } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const fetchEvents = async () => {
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

            const response = await fetch(`${API_BASE_URL}/cars/${decoded.selectedCarId}/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setEvents([]);
                    setLoading(false);
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            // Nach Datum sortieren (neueste zuerst)
            const sortedData = data.sort((a: Event, b: Event) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setEvents(sortedData);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Laden der Ereignisse');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (event: Event) => {
        setSelectedEvent(event);
        setEditDialogOpen(true);
    };

    const handleSave = async (updatedEvent: Event) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/events/${updatedEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedEvent),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await fetchEvents(); // Daten neu laden
        } catch (err) {
            console.error('Error updating event:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
        }
    };

    const handleDelete = async (eventId: number) => {
        if (!token || !confirm('Möchten Sie dieses Ereignis wirklich löschen?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await fetchEvents(); // Daten neu laden
        } catch (err) {
            console.error('Error deleting event:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
        }
    };

    const getEventTypeLabel = (type: Event['type']) => {
        const types = {
            maintenance: 'Wartung',
            repair: 'Reparatur',
            accident: 'Unfall',
            other: 'Sonstiges'
        };
        return types[type];
    };

    const getEventTypeColor = (type: Event['type']) => {
        const colors = {
            maintenance: 'primary',
            repair: 'warning',
            accident: 'error',
            other: 'default'
        } as const;
        return colors[type];
    };

    useEffect(() => {
        fetchEvents();
    }, [token]);

    // Sortier- und Filterfunktionen
    const handleRequestSort = (property: keyof Event) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(0); // Reset zur ersten Seite
    };

    const sortEvents = (events: Event[]) => {
        return events.sort((a, b) => {
            let aVal: any = a[orderBy];
            let bVal: any = b[orderBy];

            // Spezielle Behandlung für Datumsfelder
            if (orderBy === 'date') {
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

    const filterEvents = (events: Event[]) => {
        return events.filter(event => {
            // Datumsfilter
            if (filters.dateFrom && dayjs(event.date).isBefore(dayjs(filters.dateFrom))) {
                return false;
            }
            if (filters.dateTo && dayjs(event.date).isAfter(dayjs(filters.dateTo))) {
                return false;
            }

            // Titelfilter
            if (filters.title && !event.title.toLowerCase().includes(filters.title.toLowerCase())) {
                return false;
            }

            // Typfilter
            if (filters.type !== 'all' && event.type !== filters.type) {
                return false;
            }

            return true;
        });
    };

    const processedEvents = sortEvents(filterEvents(events));

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

    const paginatedEvents = processedEvents.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Ereignisse ({processedEvents.length} von {events.length})
                </Typography>
            </Box>

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
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: '1fr 1fr',
                                        md: '1fr 1fr',
                                        lg: '1fr 1fr'
                                    },
                                    gap: 2
                                }}>
                                    <TextField
                                        label="Titel suchen"
                                        value={filters.title}
                                        onChange={(e) => handleFilterChange('title', e.target.value)}
                                        size="small"
                                        fullWidth
                                    />
                                    <FormControl size="small" fullWidth>
                                        <InputLabel>Typ</InputLabel>
                                        <Select
                                            value={filters.type}
                                            label="Typ"
                                            onChange={(e) => handleFilterChange('type', e.target.value)}
                                        >
                                            <MenuItem value="all">Alle</MenuItem>
                                            <MenuItem value="maintenance">Wartung</MenuItem>
                                            <MenuItem value="repair">Reparatur</MenuItem>
                                            <MenuItem value="accident">Unfall</MenuItem>
                                            <MenuItem value="other">Sonstiges</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Stack>
                        </Box>
                    </Collapse>
                </Box>
            </Paper>
            */}

            {events.length === 0 ? (
                <Alert severity="info">
                    Noch keine Ereignisse vorhanden.
                </Alert>
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table size={isMobile ? "small" : "medium"}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'date'}
                                            direction={orderBy === 'date' ? order : 'asc'}
                                            onClick={() => handleRequestSort('date')}
                                        >
                                            Datum
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'title'}
                                            direction={orderBy === 'title' ? order : 'asc'}
                                            onClick={() => handleRequestSort('title')}
                                        >
                                            Titel
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'type'}
                                            direction={orderBy === 'type' ? order : 'asc'}
                                            onClick={() => handleRequestSort('type')}
                                        >
                                            Typ
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
                                            active={orderBy === 'mileage'}
                                            direction={orderBy === 'mileage' ? order : 'asc'}
                                            onClick={() => handleRequestSort('mileage')}
                                        >
                                            KM-Stand
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="center">Aktionen</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedEvents.map((event) => (
                                    <TableRow 
                                        key={event.id} 
                                        hover
                                        onClick={() => handleEdit(event)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell>
                                            {dayjs(event.date).format('DD.MM.YYYY')}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                {event.title}
                                            </Typography>
                                            {event.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {event.description.length > 50 
                                                        ? event.description.substring(0, 50) + '...'
                                                        : event.description
                                                    }
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getEventTypeLabel(event.type)}
                                                color={getEventTypeColor(event.type)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {event.cost ? `${event.cost.toFixed(2)} €` : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {event.mileage ? `${event.mileage.toLocaleString()} km` : '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(event);
                                                }}
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(event.id);
                                                }}
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
                        count={processedEvents.length}
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

            <EditEventDialog
                open={editDialogOpen}
                event={selectedEvent}
                onClose={() => {
                    setEditDialogOpen(false);
                    setSelectedEvent(null);
                }}
                onSave={handleSave}
            />
        </Box>
    );
}