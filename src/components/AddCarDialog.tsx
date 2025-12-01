import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import type { Car } from '../database/entities/Car';
import type { PowerUnitType } from '../utils/powerConversion';
import { convertPowerValue } from '../utils/powerConversion';
import type { DistanceUnitType } from '../utils/distanceConversion';
import { convertDistanceValue } from '../utils/distanceConversion';
import MileageInput from './MileageInput';
import PowerInput from './PowerInput';

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
        powerUnit: 'PS' as PowerUnitType,
        licensePlate: '',
        transmission: 'Manuell',
        fuel: 'Benzin',
        engineSize: '',
        mileage: '',
        mileageUnit: 'km' as DistanceUnitType,
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
        // Konvertiere Leistung immer zu PS für die Datenbank
        const powerInPs = formData.powerUnit === 'PS' 
            ? Number(formData.power)
            : convertPowerValue(Number(formData.power), 'kW', 'PS');
            
        // Konvertiere Kilometerstand immer zu km für die Datenbank
        const mileageInKm = formData.mileageUnit === 'km' 
            ? Number(formData.mileage)
            : convertDistanceValue(Number(formData.mileage), 'mi', 'km');
            
        onAdd({
            manufacturer: formData.manufacturer,
            model: formData.model,
            year: Number(formData.year),
            power: powerInPs,
            powerUnit: formData.powerUnit,
            licensePlate: formData.licensePlate,
            transmission: formData.transmission,
            fuel: formData.fuel,
            engineSize: formData.engineSize ? Number(formData.engineSize) : undefined,
            mileage: formData.mileage ? mileageInKm : undefined,
            mileageUnit: formData.mileageUnit,
            notes: formData.notes || undefined,
            image: formData.image || undefined
        } as any);
        setFormData({
            manufacturer: '',
            model: '',
            year: new Date().getFullYear(),
            power: '',
            powerUnit: 'PS' as PowerUnitType,
            licensePlate: '',
            transmission: 'Manuell',
            fuel: 'Benzin',
            engineSize: '',
            mileage: '',
            mileageUnit: 'km' as DistanceUnitType,
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
                    
                    {/* Hubraum */}
                    <TextField
                        margin="normal"
                        fullWidth
                        type="number"
                        label="Hubraum (ccm)"
                        name="engineSize"
                        value={formData.engineSize}
                        onChange={handleChange}
                    />
                    
                    {/* Leistung und Kilometerstand */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                            <PowerInput
                                value={formData.power}
                                unit={formData.powerUnit}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, power: value }))}
                                onUnitChange={(unit) => setFormData(prev => ({ ...prev, powerUnit: unit }))}
                                required
                                clearOnUnitChange={false}
                                showConversion={true}
                                textFieldProps={{
                                    margin: "normal"
                                }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <MileageInput
                                value={formData.mileage}
                                unit={formData.mileageUnit}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, mileage: value }))}
                                onUnitChange={(unit) => setFormData(prev => ({ ...prev, mileageUnit: unit }))}
                                clearOnUnitChange={false}
                                showConversion={true}
                                textFieldProps={{
                                    margin: "normal"
                                }}
                            />
                        </Box>
                    </Box>
                    
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            select
                            label="Kraftstoff"
                            name="fuel"
                            value={formData.fuel}
                            onChange={handleChange}
                            SelectProps={{
                                MenuProps: {
                                    PaperProps: {
                                        style: {
                                            textAlign: 'left'
                                        }
                                    }
                                }
                            }}
                            sx={{
                                '& .MuiSelect-select': {
                                    textAlign: 'left !important',
                                    paddingLeft: '14px !important'
                                },
                                '& .MuiInputBase-input': {
                                    textAlign: 'left !important'
                                }
                            }}
                        >
                            {fuelOptions.map(option => (
                                <MenuItem 
                                    key={option} 
                                    value={option}
                                    sx={{ textAlign: 'left', justifyContent: 'flex-start' }}
                                >
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            select
                            label="Getriebe"
                            name="transmission"
                            value={formData.transmission}
                            onChange={handleChange}
                            SelectProps={{
                                MenuProps: {
                                    PaperProps: {
                                        style: {
                                            textAlign: 'left'
                                        }
                                    }
                                }
                            }}
                            sx={{
                                '& .MuiSelect-select': {
                                    textAlign: 'left !important',
                                    paddingLeft: '14px !important'
                                },
                                '& .MuiInputBase-input': {
                                    textAlign: 'left !important'
                                }
                            }}
                        >
                            {transmissionOptions.map(option => (
                                <MenuItem 
                                    key={option} 
                                    value={option}
                                    sx={{ textAlign: 'left', justifyContent: 'flex-start' }}
                                >
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                    
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
                        label="Kennzeichen"
                        name="licensePlate"
                        value={formData.licensePlate}
                        onChange={handleChange}
                    />
                    
                    <TextField
                        margin="normal"
                        fullWidth
                        multiline
                        rows={3}
                        label="Notizen"
                        name="notes"
                        value={formData.notes}
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
