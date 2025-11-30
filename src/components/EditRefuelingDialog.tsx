import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert,
    FormControlLabel,
    Checkbox,
    ToggleButtonGroup,
    ToggleButton,
    Typography,
    IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../contexts/AuthContext';
import type { Refueling } from '../database/entities/Refueling';
import { API_BASE_URL } from '../config/api';
import dayjs from 'dayjs';

interface EditRefuelingDialogProps {
    open: boolean;
    onClose: () => void;
    onUpdate: () => void;
    refueling: Refueling | null;
}

export default function EditRefuelingDialog({ open, onClose, onUpdate, refueling }: EditRefuelingDialogProps) {
    const [date, setDate] = useState('');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');
    const [mileage, setMileage] = useState('');
    const [mileageUnit, setMileageUnit] = useState<'km' | 'miles'>('km');
    const [displayMileage, setDisplayMileage] = useState('');
    const [isPartialRefueling, setIsPartialRefueling] = useState(false);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const { token } = useAuth();

    // Formular mit Tankungsdaten füllen
    useEffect(() => {
        if (refueling) {
            setDate(dayjs(refueling.date).format('YYYY-MM-DD'));
            setAmount(refueling.amount.toString());
            setPrice(refueling.price.toString());
            setMileage(refueling.mileage.toString());
            setDisplayMileage(refueling.mileage.toString());
            setIsPartialRefueling(refueling.isPartialRefueling);
            setNotes(refueling.notes || '');
            setMileageUnit('km');
            setError(null);
        }
    }, [refueling]);

    // Meilen/Kilometer Konvertierung
    const handleMileageUnitChange = (_: React.MouseEvent<HTMLElement>, newUnit: 'km' | 'miles' | null) => {
        if (newUnit && newUnit !== mileageUnit) {
            const currentValue = parseFloat(displayMileage) || 0;
            
            if (newUnit === 'miles') {
                // km zu Meilen: km / 1.60934
                const milesValue = currentValue / 1.60934;
                setDisplayMileage(milesValue.toFixed(1));
            } else {
                // Meilen zu km: Meilen * 1.60934
                const kmValue = currentValue * 1.60934;
                setDisplayMileage(kmValue.toFixed(1));
                setMileage(kmValue.toFixed(1));
            }
            
            setMileageUnit(newUnit);
        }
    };

    const handleDisplayMileageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setDisplayMileage(value);
        
        if (mileageUnit === 'miles') {
            // Automatisch zu km konvertieren für Speicherung
            const milesValue = parseFloat(value) || 0;
            const kmValue = milesValue * 1.60934;
            setMileage(kmValue.toString());
        } else {
            setMileage(value);
        }
    };

    const handleUpdate = async () => {
        if (!refueling || !token) {
            setError('Fehler: Keine Berechtigung');
            return;
        }

        if (!date || !amount || !price || !mileage) {
            setError('Bitte alle Pflichtfelder ausfüllen');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/refuelings/${refueling.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date,
                    amount: parseFloat(amount),
                    price: parseFloat(price),
                    mileage: parseFloat(mileage),
                    isPartialRefueling,
                    notes: notes.trim() || null,
                    carId: refueling.carId // Auto ID beibehalten
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Fehler beim Aktualisieren');
            }

            console.log('Refueling updated successfully');
            onUpdate();
            onClose();
        } catch (err) {
            console.error('Error updating refueling:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Tankung');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!refueling || !token) {
            setError('Fehler: Keine Berechtigung');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/refuelings/${refueling.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Fehler beim Löschen');
            }

            console.log('Refueling deleted successfully');
            onUpdate();
            onClose();
        } catch (err) {
            console.error('Error deleting refueling:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Löschen der Tankung');
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleClose = () => {
        setShowDeleteConfirm(false);
        onClose();
    };

    if (!refueling) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon />
                Tankung bearbeiten
                <Box sx={{ flexGrow: 1 }} />
                <IconButton 
                    color="error" 
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Tankung löschen"
                >
                    <DeleteIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {showDeleteConfirm && (
                    <Alert 
                        severity="warning" 
                        sx={{ mb: 2 }}
                        action={
                            <Box>
                                <Button 
                                    color="error" 
                                    size="small" 
                                    onClick={handleDelete}
                                    disabled={loading}
                                >
                                    Löschen
                                </Button>
                                <Button 
                                    size="small" 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={loading}
                                >
                                    Abbrechen
                                </Button>
                            </Box>
                        }
                    >
                        Tankung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Datum"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        fullWidth
                        required
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        label="Menge (Liter)"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        fullWidth
                        required
                        inputProps={{ min: 0, step: 0.1 }}
                    />

                    <TextField
                        label="Preis (€)"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        fullWidth
                        required
                        inputProps={{ min: 0, step: 0.01 }}
                    />

                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="body2">Kilometerstand:</Typography>
                            <ToggleButtonGroup
                                value={mileageUnit}
                                exclusive
                                onChange={handleMileageUnitChange}
                                size="small"
                            >
                                <ToggleButton value="km">km</ToggleButton>
                                <ToggleButton value="miles">Meilen</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                        
                        <TextField
                            label={`Kilometerstand (${mileageUnit})`}
                            type="number"
                            value={displayMileage}
                            onChange={handleDisplayMileageChange}
                            fullWidth
                            required
                            inputProps={{ min: 0, step: mileageUnit === 'miles' ? 0.1 : 1 }}
                        />
                        
                        {mileageUnit === 'miles' && (
                            <Typography variant="caption" color="text.secondary">
                                = {mileage} km (wird automatisch konvertiert)
                            </Typography>
                        )}
                    </Box>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isPartialRefueling}
                                onChange={(e) => setIsPartialRefueling(e.target.checked)}
                            />
                        }
                        label="Teilbetankung (Tank nicht vollgemacht)"
                    />

                    <TextField
                        label="Notizen (optional)"
                        multiline
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        fullWidth
                        placeholder="z.B. Tankstelle, Besonderheiten..."
                    />
                </Box>
            </DialogContent>

            <DialogActions>
                <Button 
                    onClick={handleClose} 
                    disabled={loading}
                    startIcon={<CancelIcon />}
                >
                    Abbrechen
                </Button>
                <Button 
                    onClick={handleUpdate} 
                    variant="contained" 
                    disabled={loading}
                    startIcon={<SaveIcon />}
                >
                    {loading ? 'Speichern...' : 'Speichern'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
