import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material';
import { useState } from 'react';
import { Car } from '../database/entities/Car';
import type { PowerUnitType } from '../utils/powerConversion';
import { convertPowerValue } from '../utils/powerConversion';
import type { DistanceUnitType } from '../utils/distanceConversion';
import { convertDistanceValue } from '../utils/distanceConversion';
import MileageInput from './MileageInput';
import PowerInput from './PowerInput';

interface EditCarDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (car: Partial<Car>) => void;
    car: Car;
}

const transmissionOptions = ['Automatik', 'Manuell'];
const fuelOptions = ['Benzin', 'Diesel', 'Elektro', 'Hybrid'];

export default function EditCarDialog({ open, onClose, onSave, car }: EditCarDialogProps) {
    const [formData, setFormData] = useState({
        manufacturer: car.manufacturer,
        model: car.model,
        year: car.year,
        licensePlate: car.licensePlate,
        transmission: car.transmission || 'Manuell',
        fuel: car.fuel || 'Benzin',
        power: car.power || '',
        powerUnit: (car.powerUnit as PowerUnitType) || 'PS',
        engineSize: car.engineSize || '',
        mileage: car.mileage || '',
        mileageUnit: (car.mileageUnit as DistanceUnitType) || 'km',
        notes: car.notes || ''
    });

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
            
        onSave({
            ...formData,
            power: formData.power ? powerInPs : undefined,
            powerUnit: formData.powerUnit,
            engineSize: formData.engineSize ? Number(formData.engineSize) : undefined,
            mileage: formData.mileage ? mileageInKm : undefined,
            mileageUnit: formData.mileageUnit
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
