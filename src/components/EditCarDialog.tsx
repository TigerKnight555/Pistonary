import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { useState } from 'react';
import { Car } from '../database/entities/Car';

interface EditCarDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (car: Partial<Car>) => void;
    car: Car;
}

export default function EditCarDialog({ open, onClose, onSave, car }: EditCarDialogProps) {
    const [formData, setFormData] = useState({
        manufacturer: car.manufacturer,
        model: car.model,
        year: car.year,
        licensePlate: car.licensePlate,
        notes: car.notes || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
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
                <DialogTitle>Auto bearbeiten</DialogTitle>
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
                        label="Kennzeichen"
                        name="licensePlate"
                        value={formData.licensePlate}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Notizen"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Abbrechen</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Speichern
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
