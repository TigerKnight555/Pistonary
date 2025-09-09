import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import type { JWTPayload } from '../types/Auth';
import { API_BASE_URL } from '../config/api';
import dayjs from 'dayjs';

interface AddEventDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: () => void;
}

const eventTypes = [
    { value: 'maintenance', label: '🔧 Wartung', color: '#2196f3' },
    { value: 'repair', label: '⚙️ Reparatur', color: '#f44336' },
    { value: 'modification', label: '🔨 Modifikation', color: '#9c27b0' },
    { value: 'inspection', label: '🔍 Inspektion', color: '#ff9800' },
    { value: 'tire_change', label: '🛞 Reifenwechsel', color: '#607d8b' },
    { value: 'oil_change', label: '🛢️ Ölwechsel', color: '#795548' },
    { value: 'spark_plugs', label: '⚡ Zündkerzen', color: '#ffeb3b' },
    { value: 'filter_change', label: '🔽 Filter wechseln', color: '#4caf50' },
    { value: 'brake_service', label: '🛑 Bremsenservice', color: '#e91e63' },
    { value: 'other', label: '📝 Sonstiges', color: '#9e9e9e' }
];

export default function AddEventDialog({ open, onClose, onAdd }: AddEventDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [mileage, setMileage] = useState('');
    const [type, setType] = useState('other');
    const [cost, setCost] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { token } = useAuth();

    const handleAdd = async () => {
        console.log('🔥 handleAdd called!');
        
        if (!token) {
            console.log('❌ No token found');
            setError('Fehler: Nicht angemeldet');
            return;
        }

        if (!title.trim()) {
            console.log('❌ No title provided');
            setError('Bitte einen Titel eingeben');
            return;
        }

        if (!date) {
            console.log('❌ No date provided');
            setError('Bitte ein Datum eingeben');
            return;
        }

        console.log('✅ All validations passed, proceeding...');
        setLoading(true);
        setError(null);

        try {
            console.log('🔍 Starting token decoding...');
            console.log('🎫 Token exists:', !!token);
            
            // Auto-ID aus Token holen
            const decoded = jwtDecode<JWTPayload>(token);
            console.log('🔑 Decoded token:', decoded);
            
            if (!decoded.selectedCarId) {
                console.log('❌ No selectedCarId in token');
                setError('Kein Auto ausgewählt');
                setLoading(false);
                return;
            }

            console.log('🚗 Selected car ID:', decoded.selectedCarId);

            console.log('Sending event data:', {
                title: title.trim(),
                description: description.trim() || null,
                date,
                mileage: mileage ? parseInt(mileage) : null,
                type,
                cost: cost ? parseFloat(cost) : null,
                notes: notes.trim() || null,
                carId: decoded.selectedCarId
            });

            console.log('🌐 About to make fetch request to:', `${API_BASE_URL}/events`);
            console.log('🔗 API_BASE_URL:', API_BASE_URL);
            
            const response = await fetch(`${API_BASE_URL}/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || null,
                    date,
                    mileage: mileage ? parseInt(mileage) : null,
                    type,
                    cost: cost ? parseFloat(cost) : null,
                    notes: notes.trim() || null,
                    carId: decoded.selectedCarId
                }),
            });

            console.log('Response status:', response.status);
            console.log('Response OK:', response.ok);

            if (!response.ok) {
                console.log('Response error. Status:', response.status);
                const responseText = await response.text();
                console.log('Response text:', responseText);
                
                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(errorData.message || 'Fehler beim Hinzufügen');
                } catch (parseError) {
                    throw new Error(`Server Error ${response.status}: ${responseText.substring(0, 100)}`);
                }
            }

            const result = await response.json();
            console.log('Event added successfully:', result);
            
            // Formular zurücksetzen
            setTitle('');
            setDescription('');
            setDate(dayjs().format('YYYY-MM-DD'));
            setMileage('');
            setType('other');
            setCost('');
            setNotes('');
            
            onAdd();
            onClose();
        } catch (err) {
            console.error('Error adding event:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen des Ereignisses');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const selectedEventType = eventTypes.find(et => et.value === type);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon />
                Neues Ereignis hinzufügen
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Titel"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                        required
                        placeholder="z.B. Zündkerzen gewechselt"
                    />

                    <FormControl fullWidth>
                        <InputLabel>Ereignistyp</InputLabel>
                        <Select
                            value={type}
                            label="Ereignistyp"
                            onChange={(e) => setType(e.target.value)}
                        >
                            {eventTypes.map((eventType) => (
                                <MenuItem key={eventType.value} value={eventType.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box 
                                            sx={{ 
                                                width: 12, 
                                                height: 12, 
                                                borderRadius: '50%', 
                                                backgroundColor: eventType.color 
                                            }} 
                                        />
                                        {eventType.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

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
                        label="Kilometerstand (optional)"
                        type="number"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        fullWidth
                        inputProps={{ min: 0, step: 1 }}
                        placeholder="z.B. 15000"
                    />

                    <TextField
                        label="Kosten (optional)"
                        type="number"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                        placeholder="z.B. 150.50"
                        InputProps={{
                            endAdornment: <Typography variant="body2" color="text.secondary">€</Typography>
                        }}
                    />

                    <TextField
                        label="Beschreibung (optional)"
                        multiline
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        placeholder="Kurze Beschreibung des Ereignisses..."
                    />

                    <TextField
                        label="Zusätzliche Notizen (optional)"
                        multiline
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        fullWidth
                        placeholder="Weitere Details, Werkstatt, Teile-Nummer..."
                    />
                </Box>

                {selectedEventType && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Vorschau:</strong> {selectedEventType.label} - {title || 'Titel eingeben'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Datum: {dayjs(date).format('DD.MM.YYYY')}
                            {mileage && ` • ${parseInt(mileage).toLocaleString('de-DE')} km`}
                            {cost && ` • ${parseFloat(cost).toFixed(2)} €`}
                        </Typography>
                    </Box>
                )}
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
                    onClick={() => {
                        console.log('🖱️ Add Event Button clicked!');
                        handleAdd();
                    }} 
                    variant="contained" 
                    disabled={loading}
                    startIcon={<SaveIcon />}
                >
                    {loading ? 'Hinzufügen...' : 'Hinzufügen'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
