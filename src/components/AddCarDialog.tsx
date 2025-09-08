import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material';
import { useState } from 'react';
import type { Car } from '../database/entities/Car';

interface AddCarDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (car: Omit<Car, 'id' | 'created_at' | 'updated_at' | 'refuelings'>) => void;
}

const transmissionOptions = ['Automatik', 'Manuell'];
const fuelOptions = ['Benzin', 'Diesel', 'Elektro', 'Hybrid'];

export default function AddCarDialog({ open, onClose, onAdd }: AddCarDialogProps) {
    const [formData, setFormData] = useState({
        manufacturer: '',
        model: '',
        year: new Date().getFullYear(),
        power: '',
        licensePlate: '',
        transmission: 'Manuell',
        fuel: 'Benzin',
        engineSize: '',
        mileage: '',
        notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            ...formData,
            power: Number(formData.power),
            year: Number(formData.year),
            engineSize: formData.engineSize ? Number(formData.engineSize) : undefined,
            mileage: formData.mileage ? Number(formData.mileage) : undefined,
            notes: formData.notes || undefined,
        });
        setFormData({
            manufacturer: '',
            model: '',
            year: new Date().getFullYear(),
            power: '',
            licensePlate: '',
            transmission: 'Manuell',
            fuel: 'Benzin',
            engineSize: '',
            mileage: '',
            notes: ''
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Neues Fahrzeug hinzufügen</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Hersteller"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Modell"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        type="number"
                        label="Baujahr"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        type="number"
                        label="Leistung (PS)"
                        name="power"
                        value={formData.power}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        select
                        label="Getriebe"
                        name="transmission"
                        value={formData.transmission}
                        onChange={handleChange}
                    >
                        {transmissionOptions.map(option => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        select
                        label="Kraftstoff"
                        name="fuel"
                        value={formData.fuel}
                        onChange={handleChange}
                    >
                        {fuelOptions.map(option => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        margin="normal"
                        fullWidth
                        type="number"
                        label="Hubraum (ccm)"
                        name="engineSize"
                        value={formData.engineSize}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        type="number"
                        label="Kilometerstand"
                        name="mileage"
                        value={formData.mileage}
                        onChange={handleChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Abbrechen</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Hinzufügen
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
