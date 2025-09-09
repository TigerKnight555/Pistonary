import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Button, Alert, useTheme, useMediaQuery, Card, CardContent, CardMedia } from '@mui/material';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AddRefuelingDialog from './AddRefuelingDialog';
import type { Car } from '../database/entities/Car';
import type { Refueling } from '../database/entities/Refueling';
import { API_BASE_URL } from '../config/api';

export default function Dashboard() {
    const [cars, setCars] = useState<Car[]>([]);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [isAddRefuelingDialogOpen, setIsAddRefuelingDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const fetchCars = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${API_BASE_URL}/cars`, { headers });
            if (!response.ok) {
                throw new Error(`Fehler beim Laden der Fahrzeuge: ${response.status}`);
            }
            const data = await response.json();
            setCars(data);
            setError(null);
            
            // Erstes Auto als ausgewählt setzen
            if (data.length > 0) {
                setSelectedCar(data[0]);
            }
            
            console.log('Geladene Autos:', data);
        } catch (error) {
            console.error('Error fetching cars:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Laden der Fahrzeuge');
        }
    };

    const handleAddRefueling = async (newRefueling: Omit<Refueling, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${API_BASE_URL}/refuelings`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newRefueling),
            });
            if (!response.ok) throw new Error('Fehler beim Speichern');
            
            setIsAddRefuelingDialogOpen(false);
            // Optional: Refresh data or show success message
        } catch (error) {
            console.error('Error adding refueling:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Speichern der Tankung');
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Container>
        );
    }

    if (cars.length === 0) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <DirectionsCarIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Noch keine Fahrzeuge vorhanden
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Fügen Sie Ihr erstes Fahrzeug hinzu, um mit der Kraftstoffverfolgung zu beginnen.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<DirectionsCarIcon />}
                        onClick={() => {
                            // Navigate to add car functionality
                            console.log('Add car functionality needed');
                        }}
                    >
                        Erstes Fahrzeug hinzufügen
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            {/* Begrüßung mit Auto-Name */}
            <Paper sx={{ 
                p: 3, 
                mb: 3, 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(10px)',
                textAlign: 'center'
            }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Willkommen zurück!
                </Typography>
                {selectedCar && (
                    <Typography variant="h5" color="primary" sx={{ fontWeight: 'medium' }}>
                        {selectedCar.manufacturer} {selectedCar.model}
                    </Typography>
                )}
            </Paper>

            {/* Große Auto-Karte */}
            {selectedCar && (
                <Card sx={{ 
                    mb: 3, 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    backdropFilter: 'blur(10px)' 
                }}>
                    {selectedCar.image ? (
                        <CardMedia
                            component="img"
                            height={isMobile ? "200" : "300"}
                            image={selectedCar.image}
                            alt={`${selectedCar.manufacturer} ${selectedCar.model}`}
                            sx={{ objectFit: 'cover' }}
                        />
                    ) : (
                        <Box
                            sx={{
                                height: isMobile ? 200 : 300,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'grey.100'
                            }}
                        >
                            <DirectionsCarIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                        </Box>
                    )}
                    <CardContent>
                        <Typography variant="h6" component="h2" gutterBottom>
                            {selectedCar.manufacturer} {selectedCar.model}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Kennzeichen:</strong> {selectedCar.licensePlate}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Jahr:</strong> {selectedCar.year}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Leistung:</strong> {selectedCar.power} PS
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Kraftstoff:</strong> {selectedCar.fuel}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Tankung hinzufügen Button */}
            <Paper sx={{ 
                p: 3, 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(10px)',
                textAlign: 'center'
            }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<LocalGasStationIcon />}
                    onClick={() => setIsAddRefuelingDialogOpen(true)}
                    fullWidth={isMobile}
                    sx={{ 
                        py: 2,
                        fontSize: '1.1rem'
                    }}
                >
                    Neue Tankung hinzufügen
                </Button>
            </Paper>

            {/* Dialogs */}
            <AddRefuelingDialog 
                open={isAddRefuelingDialogOpen}
                onClose={() => setIsAddRefuelingDialogOpen(false)}
                onAdd={handleAddRefueling}
                cars={cars}
            />
        </Container>
    );
}
