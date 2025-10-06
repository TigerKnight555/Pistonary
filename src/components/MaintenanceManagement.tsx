import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
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
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Build as BuildIcon
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import { MaintenanceType, MaintenanceTypeLabels } from '../database/entities/Maintenance';
import SwipeableMaintenanceManagementCard from './SwipeableMaintenanceManagementCard';
import dayjs from 'dayjs';

// Maintenance-Interface angepasst an die echte Datenbank-Entität
interface Maintenance {
    id: number;
    type: string;
    name?: string;
    description?: string;
    lastPerformed?: string;
    lastMileage?: number;
    cost?: number;
    notes?: string;
    carId: number;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
}

interface EditMaintenanceDialogProps {
    open: boolean;
    maintenance: Maintenance | null;
    onClose: () => void;
    onSave: (maintenance: Maintenance) => Promise<void>;
    selectedCategories: MaintenanceType[];
}

function EditMaintenanceDialog({ open, maintenance, onClose, onSave, selectedCategories }: EditMaintenanceDialogProps) {
    const [formData, setFormData] = useState({
        lastPerformed: dayjs(),
        name: '',
        type: 'other',
        cost: '',
        lastMileage: '',
        notes: ''
    });

    // Nur die auf der Wartungsseite ausgewählten Kategorien anzeigen
    const maintenanceTypes = selectedCategories.length > 0 
        ? selectedCategories.map(type => ({
            value: type,
            label: MaintenanceTypeLabels[type]
        }))
        : Object.entries(MaintenanceTypeLabels).map(([value, label]) => ({
            value,
            label
        }));

    useEffect(() => {
        if (maintenance && open) {
            setFormData({
                lastPerformed: maintenance.lastPerformed ? dayjs(maintenance.lastPerformed) : dayjs(),
                name: maintenance.name || '',
                type: maintenance.type || 'other',
                cost: maintenance.cost?.toString() || '',
                lastMileage: maintenance.lastMileage?.toString() || '',
                notes: maintenance.notes || ''
            });
        } else if (open) {
            setFormData({
                lastPerformed: dayjs(),
                name: '',
                type: 'other',
                cost: '',
                lastMileage: '',
                notes: ''
            });
        }
    }, [maintenance, open]);

    const handleSave = async () => {
        if (!maintenance) return;

        const updatedMaintenance: Maintenance = {
            ...maintenance,
            lastPerformed: formData.lastPerformed.toISOString(),
            name: formData.name,
            type: formData.type,
            cost: formData.cost ? parseFloat(formData.cost) : undefined,
            lastMileage: formData.lastMileage ? parseInt(formData.lastMileage) : undefined,
            notes: formData.notes
        };

        await onSave(updatedMaintenance);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Wartung bearbeiten</DialogTitle>
            <DialogContent>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <DatePicker
                            label="Datum der Durchführung"
                            value={formData.lastPerformed}
                            onChange={(newValue) => setFormData(prev => ({ ...prev, lastPerformed: dayjs(newValue) }))}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                        
                        <TextField
                            label="Name/Beschreibung"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            fullWidth
                        />
                        
                        <FormControl fullWidth>
                            <InputLabel>Wartungstyp</InputLabel>
                            <Select
                                value={formData.type}
                                label="Wartungstyp"
                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            >
                                {maintenanceTypes.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <TextField
                            label="Kosten (€)"
                            type="number"
                            value={formData.cost}
                            onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                            fullWidth
                        />
                        
                        <TextField
                            label="Kilometerstand"
                            type="number"
                            value={formData.lastMileage}
                            onChange={(e) => setFormData(prev => ({ ...prev, lastMileage: e.target.value }))}
                            fullWidth
                        />
                        
                        <TextField
                            label="Notizen"
                            multiline
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            fullWidth
                        />
                    </Stack>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Abbrechen</Button>
                <Button onClick={handleSave} variant="contained">Speichern</Button>
            </DialogActions>
        </Dialog>
    );
}

interface MaintenanceManagementProps {
    selectedCategories: MaintenanceType[];
}

function MaintenanceManagement({ selectedCategories }: MaintenanceManagementProps) {
    const { token, selectedCarId } = useAuth();
    
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);

    const fetchMaintenances = async () => {
        if (!token || !selectedCarId) {
            console.log('MaintenanceManagement: No token or selectedCarId available', { token: !!token, selectedCarId });
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            console.log('MaintenanceManagement: Fetching maintenances for car', selectedCarId);
            const response = await fetch(`${API_BASE_URL}/maintenance/${selectedCarId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Fehler beim Laden der Wartungen');
            }

            const data = await response.json();
            console.log('MaintenanceManagement: Received data', data);
            setMaintenances(data);
        } catch (err) {
            console.error('Error fetching maintenances:', err);
            setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden der Wartungen');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaintenances();
    }, [token, selectedCarId]);

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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedMaintenance)
            });

            if (!response.ok) {
                throw new Error('Fehler beim Speichern der Wartung');
            }

            await fetchMaintenances();
            setEditDialogOpen(false);
            setSelectedMaintenance(null);
        } catch (err) {
            console.error('Error saving maintenance:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Speichern der Wartung');
        }
    };

    const handleDelete = async (maintenanceId: number) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/maintenance/${maintenanceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Fehler beim Löschen der Wartung');
            }

            await fetchMaintenances();
        } catch (err) {
            console.error('Error deleting maintenance:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Löschen der Wartung');
        }
    };

    // Pagination
    const paginatedMaintenances = maintenances.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {maintenances.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <BuildIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Keine Wartungen gefunden
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Fügen Sie Wartungen über die Wartungsseite hinzu.
                            </Typography>
                        </Paper>
                    ) : (
                        <>
                            {/* Kartenansicht für Mobile und Desktop */}
                            <Box sx={{ 
                                mb: 2, 
                                width: '100%',
                                maxWidth: '100%',
                                overflow: 'hidden'
                            }}>
                                {paginatedMaintenances.map((maintenance) => (
                                    <SwipeableMaintenanceManagementCard
                                        key={maintenance.id}
                                        maintenance={maintenance}
                                        onEdit={(maintenance) => handleEdit(maintenance as any)}
                                        onDelete={(maintenance) => handleDelete(maintenance.id)}
                                    />
                                ))}
                            </Box>

                            {/* Pagination für Karten */}
                            {maintenances.length > rowsPerPage && (
                                <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {maintenances.length} Wartungen insgesamt
                                    </Typography>
                                    <TablePagination
                                        rowsPerPageOptions={[5, 10, 25, 50]}
                                        component="div"
                                        count={maintenances.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={(_event, newPage) => setPage(newPage)}
                                        onRowsPerPageChange={(event) => {
                                            setRowsPerPage(parseInt(event.target.value, 10));
                                            setPage(0);
                                        }}
                                        labelRowsPerPage="Pro Seite:"
                                        showFirstButton
                                        showLastButton
                                    />
                                </Paper>
                            )}
                        </>
                    )}
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
                selectedCategories={selectedCategories}
            />
        </Box>
    );
}

export default MaintenanceManagement;