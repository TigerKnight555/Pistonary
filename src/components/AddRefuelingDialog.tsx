import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    InputAdornment,
    Typography,
    Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import type { Car } from '../database/entities/Car';
import type { Refueling } from '../database/entities/Refueling';
import type { JWTPayload } from '../types/Auth';
import dayjs from 'dayjs';
import MileageInput from './MileageInput';

interface AddRefuelingDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (refueling: Omit<Refueling, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    currentCar: Car | null;
}

export default function AddRefuelingDialog({ open, onClose, onAdd, currentCar }: AddRefuelingDialogProps) {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        liters: '',
        mileage: '',
        totalPrice: ''
    });
    const [mileageUnit, setMileageUnit] = useState<'km' | 'mi'>('km');

    // Kilometerstand in km umrechnen (falls nötig)
    const getMileageInKm = (): number => {
        const mileageValue = Number(formData.mileage);
        return mileageUnit === 'mi' ? mileageValue * 1.60934 : mileageValue;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Auto-ID aus dem JWT Token holen
        if (!token) {
            alert('Nicht angemeldet');
            return;
        }
        
        let selectedCarId: number;
        try {
            const decoded = jwtDecode<JWTPayload>(token);
            
            if (!decoded.selectedCarId) {
                alert('Kein Auto ausgewählt');
                return;
            }
            
            selectedCarId = decoded.selectedCarId;
        } catch (error) {
            console.error('Fehler beim Dekodieren des Tokens:', error);
            alert('Token-Fehler');
            return;
        }
        
        if (!currentCar) {
            alert('Auto-Daten nicht verfügbar');
            return;
        }
        
        await onAdd({
            date: dayjs().toISOString(), // Aktuelles Datum
            carId: selectedCarId, // Auto-ID aus JWT Token
            car: currentCar, // Auto-Objekt für die Anzeige
            amount: Number(formData.liters),
            price: Number(formData.totalPrice),
            mileage: getMileageInKm(), // Kilometerstand in km (automatisch umgerechnet)
            isPartialRefueling: false, // Standard: Volltankung
            notes: undefined
        });

        // Formular zurücksetzen
        setFormData({
            liters: '',
            mileage: '',
            totalPrice: ''
        });
        setMileageUnit('km'); // Einheit zurücksetzen
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Preis pro Liter berechnen
    const pricePerLiter = formData.liters && formData.totalPrice ? 
        (Number(formData.totalPrice) / Number(formData.liters)).toFixed(3) : '';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                    Schnelle Tankung
                </DialogTitle>
                
                {currentCar && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', px: 3, pb: 2 }}>
                        {currentCar.manufacturer} {currentCar.model}
                    </Typography>
                )}

                <DialogContent>
                    <Stack spacing={3}>
                        <TextField
                            name="liters"
                            label="Getankte Liter"
                            type="number"
                            value={formData.liters}
                            onChange={handleChange}
                            required
                            fullWidth
                            autoFocus
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">L</InputAdornment>
                            }}
                        />

                        <TextField
                            name="totalPrice"
                            label="Gesamtpreis"
                            type="number"
                            value={formData.totalPrice}
                            onChange={handleChange}
                            required
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">€</InputAdornment>
                            }}
                        />

                        {pricePerLiter && (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                Preis pro Liter: {pricePerLiter} €
                            </Typography>
                        )}

                        <Divider />

                        <MileageInput
                            value={formData.mileage}
                            unit={mileageUnit}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, mileage: value }))}
                            onUnitChange={setMileageUnit}
                            label="Kilometerstand eingeben:"
                            required
                            clearOnUnitChange={true}
                            showConversion={true}
                        />
                    </Stack>
                </DialogContent>
                
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={onClose} sx={{ flex: 1 }}>
                        Abbrechen
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        sx={{ flex: 2 }}
                        disabled={!formData.liters || !formData.totalPrice || !formData.mileage}
                    >
                        Speichern
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
