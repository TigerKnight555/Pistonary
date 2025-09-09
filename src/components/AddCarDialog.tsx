import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
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
        notes: '',
        image: ''
    });

    const [imageLoading, setImageLoading] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Überprüfe die Dateigröße (maximal 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Bild ist zu groß. Bitte wählen Sie ein Bild unter 5MB.');
                return;
            }

            setImageLoading(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    // Erstelle Canvas für Bildkomprimierung
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Berechne neue Dimensionen (maximal 800px Breite)
                    const maxWidth = 800;
                    const maxHeight = 600;
                    let { width, height } = img;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Zeichne und komprimiere das Bild
                    ctx?.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    
                    setFormData(prev => ({
                        ...prev,
                        image: compressedDataUrl
                    }));
                    setImageLoading(false);
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            ...formData,
            power: Number(formData.power),
            year: Number(formData.year),
            engineSize: formData.engineSize ? Number(formData.engineSize) : undefined,
            mileage: formData.mileage ? Number(formData.mileage) : undefined,
            notes: formData.notes || undefined,
            image: formData.image || undefined,
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
            notes: '',
            image: ''
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
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            fullScreen={isMobile}
        >
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
                    <Box sx={{ mt: 2, mb: 1 }}>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="car-image-upload"
                            type="file"
                            onChange={handleImageChange}
                        />
                        <label htmlFor="car-image-upload">
                            <Button
                                variant="outlined"
                                component="span"
                                fullWidth
                                disabled={imageLoading}
                            >
                                {imageLoading ? 'Bild wird verarbeitet...' : 'Fahrzeugbild hochladen'}
                            </Button>
                        </label>
                        {formData.image && (
                            <Box sx={{ mt: 2, position: 'relative' }}>
                                <img
                                    src={formData.image}
                                    alt="Vorschau"
                                    style={{ 
                                        width: '100%', 
                                        maxHeight: '200px', 
                                        objectFit: 'cover',
                                        borderRadius: '4px'
                                    }}
                                />
                                <IconButton
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)'
                                        }
                                    }}
                                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                >
                                    <CloseIcon sx={{ color: 'white' }} />
                                </IconButton>
                            </Box>
                        )}
                    </Box>
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
