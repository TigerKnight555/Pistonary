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
    FormControlLabel,
    Checkbox,
    Stack,
    InputAdornment,
    TablePagination,
    useTheme,
    useMediaQuery,
    TableSortLabel,
    Grid,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Collapse
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    LocalGasStation as GasIcon,
    FilterList as FilterIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import type { Refueling } from '../database/entities/Refueling';
import type { JWTPayload } from '../types/Auth';
import { API_BASE_URL } from '../config/api';
import dayjs from 'dayjs';

interface EditRefuelingDialogProps {
    open: boolean;
    refueling: Refueling | null;
    onClose: () => void;
    onSave: (refueling: Refueling) => Promise<void>;
}

function EditRefuelingDialog({ open, refueling, onClose, onSave }: EditRefuelingDialogProps) {
    const [formData, setFormData] = useState({
        date: dayjs(),
        amount: '',
        price: '',
        mileage: '',
        isPartialRefueling: false,
        notes: ''
    });

    useEffect(() => {
        if (refueling) {
            setFormData({
                date: dayjs(refueling.date),
                amount: refueling.amount.toString(),
                price: refueling.price.toString(),
                mileage: refueling.mileage.toString(),
                isPartialRefueling: refueling.isPartialRefueling || false,
                notes: refueling.notes || ''
            });
        }
    }, [refueling]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!refueling) return;

        const updatedRefueling: Refueling = {
            ...refueling,
            date: formData.date.toISOString(),
            amount: parseFloat(formData.amount),
            price: parseFloat(formData.price),
            mileage: parseInt(formData.mileage),
            isPartialRefueling: formData.isPartialRefueling,
            notes: formData.notes || undefined
        };

        await onSave(updatedRefueling);
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const pricePerLiter = formData.amount && formData.price ? 
        (parseFloat(formData.price) / parseFloat(formData.amount)).toFixed(3) : '';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Tankung bearbeiten</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Datum"
                                value={formData.date}
                                onChange={(newValue) => setFormData(prev => ({ ...prev, date: newValue || dayjs() }))}
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
                            name="amount"
                            label="Liter"
                            type="number"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">L</InputAdornment>
                            }}
                        />

                        <TextField
                            name="price"
                            label="Gesamtpreis"
                            type="number"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">€</InputAdornment>
                            }}
                        />

                        {pricePerLiter && (
                            <Typography variant="body2" color="text.secondary">
                                Preis pro Liter: {pricePerLiter} €/L
                            </Typography>
                        )}

                        <TextField
                            name="mileage"
                            label="Kilometerstand"
                            type="number"
                            value={formData.mileage}
                            onChange={handleChange}
                            required
                            fullWidth
                            inputProps={{ min: 0 }}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">km</InputAdornment>
                            }}
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="isPartialRefueling"
                                    checked={formData.isPartialRefueling}
                                    onChange={handleChange}
                                />
                            }
                            label="Teiltankung"
                        />

                        <TextField
                            name="notes"
                            label="Notizen"
                            value={formData.notes}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={2}
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

export default function RefuelingsManagement() {
    const [refuelings, setRefuelings] = useState<Refueling[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedRefueling, setSelectedRefueling] = useState<Refueling | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Sortierung und Filterung
    const [orderBy, setOrderBy] = useState<keyof Refueling>('date');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        amountMin: '',
        amountMax: '',
        priceMin: '',
        priceMax: '',
        mileageMin: '',
        mileageMax: '',
        type: 'all', // all, full, partial
        notes: ''
    });
    
    const { token } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const fetchRefuelings = async () => {
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

            const response = await fetch(`${API_BASE_URL}/cars/${decoded.selectedCarId}/refuelings`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            // Nach Datum sortieren (neueste zuerst)
            const sortedData = data.sort((a: Refueling, b: Refueling) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setRefuelings(sortedData);
        } catch (err) {
            console.error('Error fetching refuelings:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Laden der Tankungen');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (refueling: Refueling) => {
        setSelectedRefueling(refueling);
        setEditDialogOpen(true);
    };

    const handleSave = async (updatedRefueling: Refueling) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/refuelings/${updatedRefueling.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedRefueling),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await fetchRefuelings(); // Daten neu laden
        } catch (err) {
            console.error('Error updating refueling:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
        }
    };

    const handleDelete = async (refuelingId: number) => {
        if (!token || !confirm('Möchten Sie diese Tankung wirklich löschen?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/refuelings/${refuelingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await fetchRefuelings(); // Daten neu laden
        } catch (err) {
            console.error('Error deleting refueling:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
        }
    };

    useEffect(() => {
        fetchRefuelings();
    }, [token]);

    // Sortier- und Filterfunktionen
    const handleRequestSort = (property: keyof Refueling) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(0); // Reset zur ersten Seite
    };

    const sortRefuelings = (refuelings: Refueling[]) => {
        return refuelings.sort((a, b) => {
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

    const filterRefuelings = (refuelings: Refueling[]) => {
        return refuelings.filter(refueling => {
            // Datumsfilter
            if (filters.dateFrom && dayjs(refueling.date).isBefore(dayjs(filters.dateFrom))) {
                return false;
            }
            if (filters.dateTo && dayjs(refueling.date).isAfter(dayjs(filters.dateTo))) {
                return false;
            }

            // Mengenfilter
            if (filters.amountMin && refueling.amount < parseFloat(filters.amountMin)) {
                return false;
            }
            if (filters.amountMax && refueling.amount > parseFloat(filters.amountMax)) {
                return false;
            }

            // Preisfilter
            if (filters.priceMin && refueling.price < parseFloat(filters.priceMin)) {
                return false;
            }
            if (filters.priceMax && refueling.price > parseFloat(filters.priceMax)) {
                return false;
            }

            // Kilometerstandfilter
            if (filters.mileageMin && refueling.mileage < parseInt(filters.mileageMin)) {
                return false;
            }
            if (filters.mileageMax && refueling.mileage > parseInt(filters.mileageMax)) {
                return false;
            }

            // Typfilter
            if (filters.type === 'full' && refueling.isPartialRefueling) {
                return false;
            }
            if (filters.type === 'partial' && !refueling.isPartialRefueling) {
                return false;
            }

            // Notizenfilter
            if (filters.notes && !refueling.notes?.toLowerCase().includes(filters.notes.toLowerCase())) {
                return false;
            }

            return true;
        });
    };

    const processedRefuelings = sortRefuelings(filterRefuelings(refuelings));

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

    const paginatedRefuelings = processedRefuelings.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    <GasIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Tankungen ({processedRefuelings.length} von {refuelings.length})
                </Typography>
            </Box>

            {/* Filter-Bereich */}
            <Paper sx={{ mb: 2 }}>
                <Box 
                    sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 2,
                        cursor: 'pointer'
                    }}
                    onClick={() => setFiltersOpen(!filtersOpen)}
                >
                    <Typography variant="subtitle1">
                        <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Filter
                    </Typography>
                    <IconButton size="small">
                        {filtersOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                <Collapse in={filtersOpen}>
                    <Box sx={{ p: 2, pt: 0 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Von Datum"
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Bis Datum"
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Min. Liter"
                                    type="number"
                                    value={filters.amountMin}
                                    onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: 0.1 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Max. Liter"
                                    type="number"
                                    value={filters.amountMax}
                                    onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: 0.1 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Min. Preis"
                                    type="number"
                                    value={filters.priceMin}
                                    onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: 0.01 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Max. Preis"
                                    type="number"
                                    value={filters.priceMax}
                                    onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: 0.01 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Typ</InputLabel>
                                    <Select
                                        value={filters.type}
                                        label="Typ"
                                        onChange={(e) => handleFilterChange('type', e.target.value)}
                                    >
                                        <MenuItem value="all">Alle</MenuItem>
                                        <MenuItem value="full">Volltankung</MenuItem>
                                        <MenuItem value="partial">Teiltankung</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Notizen suchen"
                                    value={filters.notes}
                                    onChange={(e) => handleFilterChange('notes', e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Collapse>
            </Paper>

            {refuelings.length === 0 ? (
                <Alert severity="info">
                    Noch keine Tankungen vorhanden.
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
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={orderBy === 'amount'}
                                            direction={orderBy === 'amount' ? order : 'asc'}
                                            onClick={() => handleRequestSort('amount')}
                                        >
                                            Liter
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={orderBy === 'price'}
                                            direction={orderBy === 'price' ? order : 'asc'}
                                            onClick={() => handleRequestSort('price')}
                                        >
                                            Preis
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">€/L</TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={orderBy === 'mileage'}
                                            direction={orderBy === 'mileage' ? order : 'asc'}
                                            onClick={() => handleRequestSort('mileage')}
                                        >
                                            KM-Stand
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'isPartialRefueling'}
                                            direction={orderBy === 'isPartialRefueling' ? order : 'asc'}
                                            onClick={() => handleRequestSort('isPartialRefueling')}
                                        >
                                            Typ
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="center">Aktionen</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedRefuelings.map((refueling) => (
                                    <TableRow key={refueling.id} hover>
                                        <TableCell>
                                            {dayjs(refueling.date).format('DD.MM.YYYY')}
                                        </TableCell>
                                        <TableCell align="right">
                                            {refueling.amount.toFixed(2)} L
                                        </TableCell>
                                        <TableCell align="right">
                                            {refueling.price.toFixed(2)} €
                                        </TableCell>
                                        <TableCell align="right">
                                            {(refueling.price / refueling.amount).toFixed(3)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {refueling.mileage.toLocaleString()} km
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={refueling.isPartialRefueling ? 'Teil' : 'Voll'}
                                                color={refueling.isPartialRefueling ? 'warning' : 'success'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(refueling)}
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(refueling.id)}
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
                        count={processedRefuelings.length}
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

            <EditRefuelingDialog
                open={editDialogOpen}
                refueling={selectedRefueling}
                onClose={() => {
                    setEditDialogOpen(false);
                    setSelectedRefueling(null);
                }}
                onSave={handleSave}
            />
        </Box>
    );
}