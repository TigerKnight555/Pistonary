import { 
    Box, 
    Typography, 
    ToggleButtonGroup, 
    ToggleButton, 
    TextField, 
    InputAdornment 
} from '@mui/material';
import { useState, useEffect } from 'react';
import type { PowerUnitType } from '../utils/powerConversion';
import { convertPowerValue } from '../utils/powerConversion';

interface PowerInputProps {
    /** Aktueller Leistungswert */
    value: string | number;
    /** Aktuelle Einheit */
    unit: PowerUnitType;
    /** Callback wenn sich der Wert ändert */
    onValueChange: (value: string) => void;
    /** Callback wenn sich die Einheit ändert */
    onUnitChange: (unit: PowerUnitType) => void;
    /** Optionales Label für das Eingabefeld */
    label?: string;
    /** Ob das Feld erforderlich ist */
    required?: boolean;
    /** Ob das Eingabefeld beim Einheitenwechsel geleert werden soll */
    clearOnUnitChange?: boolean;
    /** Ob die Konvertierung angezeigt werden soll */
    showConversion?: boolean;
    /** Zusätzliche Props für das TextField */
    textFieldProps?: any;
}

export default function PowerInput({
    value,
    unit,
    onValueChange,
    onUnitChange,
    label,
    required = false,
    clearOnUnitChange = false,
    showConversion = true,
    textFieldProps = {}
}: PowerInputProps) {
    const [internalUnit, setInternalUnit] = useState<PowerUnitType>(unit);

    // Synchronisiere interne Einheit mit prop
    useEffect(() => {
        setInternalUnit(unit);
    }, [unit]);

    const handleUnitChange = (newUnit: PowerUnitType | null) => {
        if (newUnit === null) return;

        const currentValue = Number(value);
        
        if (clearOnUnitChange) {
            // Leere das Eingabefeld bei Einheitenwechsel
            onValueChange('');
            onUnitChange(newUnit);
        } else if (currentValue && internalUnit !== newUnit) {
            // Konvertiere den aktuellen Wert zur neuen Einheit
            const convertedValue = convertPowerValue(currentValue, internalUnit, newUnit);
            onValueChange(convertedValue.toString());
            onUnitChange(newUnit);
        } else {
            // Nur Einheit ändern, Wert beibehalten
            onUnitChange(newUnit);
        }
        
        setInternalUnit(newUnit);
    };

    const defaultLabel = label || `Leistung (${internalUnit})`;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    {label ? label : 'Leistung:'}
                </Typography>
                <ToggleButtonGroup
                    value={internalUnit}
                    exclusive
                    onChange={(_, newUnit) => handleUnitChange(newUnit)}
                    size="small"
                >
                    <ToggleButton value="PS">PS</ToggleButton>
                    <ToggleButton value="kW">kW</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            
            <TextField
                label={defaultLabel}
                type="number"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                required={required}
                fullWidth
                inputProps={{ min: 0, step: internalUnit === 'kW' ? 0.1 : 1 }}
                InputProps={{
                    endAdornment: <InputAdornment position="end">{internalUnit}</InputAdornment>
                }}
                {...textFieldProps}
            />
            
            {showConversion && value && Number(value) > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {internalUnit === 'PS' 
                        ? `≈ ${convertPowerValue(Number(value), 'PS', 'kW')} kW`
                        : `≈ ${convertPowerValue(Number(value), 'kW', 'PS')} PS`
                    }
                </Typography>
            )}
        </Box>
    );
}