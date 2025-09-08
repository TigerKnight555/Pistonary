import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Car } from '../database/entities/Car';
import type { Refueling } from '../database/entities/Refueling';
import dayjs from 'dayjs';

interface AddRefuelingDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (refueling: Omit<Refueling, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    cars: Car[];
}

export default function AddRefuelingDialog({ open, onClose, onAdd, cars }: AddRefuelingDialogProps) {
    const [formData, setFormData] = useState({
        date: dayjs(),
        carId: '',
        liters: '',
        pricePerLiter: '',
        mileage: '',
        isPartialRefueling: false,
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const totalPrice = Number(formData.liters) * Number(formData.pricePerLiter);
        
        await onAdd({
            date: formData.date.toISOString(),
            carId: parseInt(formData.carId as string),
            amount: Number(formData.liters),
            price: totalPrice,
            mileage: Number(formData.mileage),
            isPartialRefueling: formData.isPartialRefueling,
            notes: formData.notes || undefined
        });

        setFormData({
            date: dayjs(),
            carId: '',
            liters: '',
            pricePerLiter: '',
            mileage: '',
            isPartialRefueling: false,
            notes: ''
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Neue Tankung eintragen</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel id="car-select-label">Fahrzeug</InputLabel>
                            <Select
                                labelId="car-select-label"
                                name="carId"
                                value={formData.carId}
                                label="Fahrzeug"
                                onChange={handleChange}
                                required
                            >
                                {cars.map((car) => (
                                    <MenuItem key={car.id} value={car.id}>
                                        {car.make} {car.model} ({car.plate})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

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
                            name="liters"
                            label="Getankte Liter"
                            type="number"
                            value={formData.liters}
                            onChange={handleChange}
                            required
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                        />

                        <TextField
                            name="pricePerLiter"
                            label="Preis pro Liter (€)"
                            type="number"
                            value={formData.pricePerLiter}
                            onChange={handleChange}
                            required
                            fullWidth
                            inputProps={{ min: 0, step: 0.001 }}
                        />

                        {formData.liters && formData.pricePerLiter && (
                            <TextField
                                label="Gesamtpreis (€)"
                                type="number"
                                value={(Number(formData.liters) * Number(formData.pricePerLiter)).toFixed(2)}
                                InputProps={{
                                    readOnly: true,
                                }}
                                fullWidth
                            />
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
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.isPartialRefueling}
                                    onChange={handleChange}
                                    name="isPartialRefueling"
                                />
                            }
                            label="Nur teilweise getankt"
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
                    <Button type="submit" variant="contained">
                        Tankung speichern
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
