import React from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
    Chip,
    Stack,
    Divider,
    CardActionArea
} from '@mui/material';
import {
    LocalGasStation as GasIcon
} from '@mui/icons-material';

import type { Refueling } from '../database/entities/Refueling';
import dayjs from 'dayjs';

interface RefuelingCardProps {
    refueling: Refueling;
    onEdit: (refueling: Refueling) => void;
}

const RefuelingCard: React.FC<RefuelingCardProps> = ({ refueling, onEdit }) => {
    const pricePerLiter = (refueling.price / refueling.amount).toFixed(3);

    return (
        <Card 
            sx={{ 
                mb: 2, 
                mx: 0,
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden',
                '&:hover': { 
                    boxShadow: 3,
                    transform: 'translateY(-2px)'
                },
                '&:active': {
                    transform: 'translateY(0) scale(0.98)',
                    boxShadow: 1
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <CardActionArea 
                onClick={() => onEdit(refueling)}
                sx={{
                    '&:active': {
                        '& .MuiCardActionArea-focusHighlight': {
                            opacity: 0.3
                        }
                    }
                }}
            >
                <CardContent sx={{ p: 1.5, pb: 1 }}>
                {/* Header mit Datum und Typ */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <GasIcon color="primary" fontSize="small" />
                        <Typography variant="body1" component="h3" fontWeight="bold">
                            {dayjs(refueling.date).format('DD.MM.YYYY')}
                        </Typography>
                    </Box>
                    <Chip
                        label={refueling.isPartialRefueling ? 'Teil' : 'Voll'}
                        color={refueling.isPartialRefueling ? 'warning' : 'success'}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                </Box>

                {/* Hauptdaten in einem Grid */}
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: 1,
                    mb: 1
                }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                            {refueling.amount.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Liter
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="error" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                            {refueling.price.toFixed(2)} €
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Gesamtpreis
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 1 }} />

                {/* Zusätzliche Informationen */}
                <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                            Preis pro Liter:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                            {pricePerLiter} €/L
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                            Kilometerstand:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                            {refueling.mileage.toLocaleString()} km
                        </Typography>
                    </Box>
                    {refueling.notes && (
                        <Box sx={{ mt: 0.5, p: 0.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Notizen:
                            </Typography>
                            <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                {refueling.notes}
                            </Typography>
                        </Box>
                    )}
                </Stack>


            </CardContent>
        </CardActionArea>
        </Card>
    );
};

export default RefuelingCard;