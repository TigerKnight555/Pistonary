import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Button, Alert, useTheme, useMediaQuery, Card, CardContent, CardMedia, IconButton, ThemeProvider } from '@mui/material';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EventIcon from '@mui/icons-material/Event';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AddRefuelingDialog from './AddRefuelingDialog';
import RecentRefuelings from './RecentRefuelings';
import RefuelingChart from './RefuelingChart';
import AddEventDialog from './AddEventDialog';
import { useAuth } from '../contexts/AuthContext';
import { useSimpleDynamicTheme } from '../hooks/useSimpleDynamicTheme';
import type { Car } from '../database/entities/Car';
import type { Refueling } from '../database/entities/Refueling';
import { API_BASE_URL } from '../config/api';

export default function Dashboard() {
    const [cars, setCars] = useState<Car[]>([]);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [currentCarIndex, setCurrentCarIndex] = useState(0);
    const [isAddRefuelingDialogOpen, setIsAddRefuelingDialogOpen] = useState(false);
    const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refuelingUpdateTrigger, setRefuelingUpdateTrigger] = useState(0);
    
    const { setSelectedCar: setSelectedCarInAuth } = useAuth();
    const fallbackTheme = useTheme();
    const isMobile = useMediaQuery(fallbackTheme.breakpoints.down('md'));
    
    // Dynamisches Theme basierend auf Auto-Bild (nur Akzentfarben)
    const { theme: dynamicTheme, extractedColors } = useSimpleDynamicTheme({
        imageUrl: selectedCar?.image,
        baseTheme: fallbackTheme
    });

    // Funktionen zum Auto-Wechseln mit JWT Token Update
    const goToPreviousCar = async () => {
        if (cars.length > 0) {
            const newIndex = currentCarIndex > 0 ? currentCarIndex - 1 : cars.length - 1;
            const newCar = cars[newIndex];
            
            setCurrentCarIndex(newIndex);
            setSelectedCar(newCar);
            
            // JWT Token mit neuer Auto-ID aktualisieren
            try {
                await setSelectedCarInAuth(newCar.id);
            } catch (error) {
                console.error('Fehler beim Aktualisieren der Auto-Auswahl:', error);
            }
        }
    };

    const goToNextCar = async () => {
        if (cars.length > 0) {
            const newIndex = currentCarIndex < cars.length - 1 ? currentCarIndex + 1 : 0;
            const newCar = cars[newIndex];
            
            setCurrentCarIndex(newIndex);
            setSelectedCar(newCar);
            
            // JWT Token mit neuer Auto-ID aktualisieren
            try {
                await setSelectedCarInAuth(newCar.id);
            } catch (error) {
                console.error('Fehler beim Aktualisieren der Auto-Auswahl:', error);
            }
        }
    };

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
            
            // Erstes Auto als ausgewählt setzen und im JWT Token speichern
            if (data.length > 0) {
                setSelectedCar(data[0]);
                setCurrentCarIndex(0);
                
                // JWT Token mit der Auto-ID aktualisieren
                try {
                    await setSelectedCarInAuth(data[0].id);
                } catch (error) {
                    console.error('Fehler beim Initialisieren der Auto-Auswahl:', error);
                }
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
            setRefuelingUpdateTrigger(prev => prev + 1); // Triggert Update der RecentRefuelings
            // Optional: Refresh data or show success message
        } catch (error) {
            console.error('Error adding refueling:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Speichern der Tankung');
        }
    };

    const handleAddEvent = () => {
        setRefuelingUpdateTrigger(prev => prev + 1); // Triggert Update der Charts (Events werden in Charts angezeigt)
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
        <ThemeProvider theme={dynamicTheme || fallbackTheme}>
            <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
                {/* Begrüßung mit Auto-Name und Navigation */}
                <Paper sx={{ 
                    p: 3, 
                    mb: 4, 
                    textAlign: 'center'
                }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Willkommen zurück!
                </Typography>
                {selectedCar && cars.length > 0 && (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 2,
                        mt: 2 
                    }}>
                        {/* Zurück Button - nur anzeigen wenn mehr als 1 Auto */}
                        {cars.length > 1 && (
                            <IconButton 
                                onClick={goToPreviousCar}
                                sx={{ 
                                    color: 'primary.main',
                                    '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                                }}
                                size="large"
                            >
                                <ArrowBackIosIcon />
                            </IconButton>
                        )}
                        
                        {/* Auto-Name */}
                        <Box sx={{ textAlign: 'center', minWidth: 200 }}>
                            <Typography variant="h5" color="primary" sx={{ fontWeight: 'medium' }}>
                                {selectedCar.manufacturer} {selectedCar.model}
                            </Typography>
                            {cars.length > 1 && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {currentCarIndex + 1} von {cars.length}
                                </Typography>
                            )}
                        </Box>
                        
                        {/* Vor Button - nur anzeigen wenn mehr als 1 Auto */}
                        {cars.length > 1 && (
                            <IconButton 
                                onClick={goToNextCar}
                                sx={{ 
                                    color: 'primary.main',
                                    '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                                }}
                                size="large"
                            >
                                <ArrowForwardIosIcon />
                            </IconButton>
                        )}
                    </Box>
                )}
            </Paper>

            {/* Große Auto-Karte */}
            {selectedCar && (
                <Card sx={{ 
                    mb: 4,
                    boxShadow: 3
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

            {/* Action Buttons */}
            <Paper sx={{ 
                p: 3, 
                mb: 4,
                textAlign: 'center'
            }}>
                <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'center'
                }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<LocalGasStationIcon />}
                        onClick={() => setIsAddRefuelingDialogOpen(true)}
                        sx={{ 
                            py: 2,
                            fontSize: '1.1rem',
                            flex: isMobile ? 1 : 'none'
                        }}
                    >
                        Neue Tankung
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        startIcon={<EventIcon />}
                        onClick={() => setIsAddEventDialogOpen(true)}
                        sx={{ 
                            py: 2,
                            fontSize: '1.1rem',
                            flex: isMobile ? 1 : 'none'
                        }}
                    >
                        Ereignis hinzufügen
                    </Button>
                </Box>
            </Paper>

            {/* Tankstatistiken Chart */}
            <RefuelingChart refreshTrigger={refuelingUpdateTrigger} />

            {/* Letzte Tankungen */}
            <RecentRefuelings refreshTrigger={refuelingUpdateTrigger} />

            {/* Dialogs */}
            <AddRefuelingDialog 
                open={isAddRefuelingDialogOpen}
                onClose={() => setIsAddRefuelingDialogOpen(false)}
                onAdd={handleAddRefueling}
                currentCar={selectedCar}
            />
            
            <AddEventDialog 
                open={isAddEventDialogOpen}
                onClose={() => setIsAddEventDialogOpen(false)}
                onAdd={handleAddEvent}
            />
            </Container>
            
            {/* Debug-Info für extrahierte Farben in Development */}
            {extractedColors && process.env.NODE_ENV === 'development' && (
                <Box sx={{ 
                    position: 'fixed', 
                    bottom: 16, 
                    right: 16, 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    borderRadius: 1, 
                    boxShadow: 2,
                    fontSize: '0.75rem',
                    maxWidth: 200,
                    zIndex: 1000
                }}>
                    <Typography variant="caption" display="block">
                        Auto-Farben:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Box sx={{ 
                            width: 20, 
                            height: 20, 
                            bgcolor: extractedColors.primary, 
                            borderRadius: 0.5,
                            border: '1px solid #ccc'
                        }} />
                        <Box sx={{ 
                            width: 20, 
                            height: 20, 
                            bgcolor: extractedColors.secondary, 
                            borderRadius: 0.5,
                            border: '1px solid #ccc'
                        }} />
                        <Box sx={{ 
                            width: 20, 
                            height: 20, 
                            bgcolor: extractedColors.accent, 
                            borderRadius: 0.5,
                            border: '1px solid #ccc'
                        }} />
                    </Box>
                </Box>
            )}
        </ThemeProvider>
    );
}
