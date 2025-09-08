import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Button, Alert, Stack, Grid, Divider } from '@mui/material';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CarList from './CarList';
import AddCarDialog from './AddCarDialog';
import AddRefuelingDialog from './AddRefuelingDialog';
import type { Car } from '../database/entities/Car';
import type { Refueling } from '../database/entities/Refueling';
import { API_BASE_URL } from '../config/api';

export default function Dashboard() {
    const [cars, setCars] = useState<Car[]>([]);
    const [isAddCarDialogOpen, setIsAddCarDialogOpen] = useState(false);
    const [isAddRefuelingDialogOpen, setIsAddRefuelingDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalCars: 0,
        totalRefuelings: 0,
        totalCost: 0,
        averageCostPerLiter: 0
    });

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/stats`);
            if (!response.ok) {
                throw new Error(`Fehler beim Laden der Statistiken: ${response.status}`);
            }
            const data = await response.json();
            setStats(data);
            setError(null);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Laden der Statistiken');
        }
    };

    const fetchCars = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/cars`);
            if (!response.ok) {
                throw new Error(`Fehler beim Laden der Fahrzeuge: ${response.status}`);
            }
            const data = await response.json();
            setCars(data);
            setError(null);
        } catch (error) {
            console.error('Error fetching cars:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Laden der Fahrzeuge');
        }
    };

    useEffect(() => {
        fetchCars();
        fetchStats();
    }, []);

    const handleAddCar = async (newCar: Omit<Car, 'id' | 'created_at' | 'updated_at' | 'refuelings'>) => {
        try {
            const response = await fetch(`${API_BASE_URL}/cars`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newCar),
            });
            if (!response.ok) {
                throw new Error(`Fehler beim Speichern: ${response.status}`);
            }
            await response.json();
            await fetchCars();
            await fetchStats();
            setIsAddCarDialogOpen(false);
            setError(null);
        } catch (error) {
            console.error('Error adding car:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Hinzufügen des Fahrzeugs');
        }
    };

    const handleAddRefueling = async (newRefueling: Omit<Refueling, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const response = await fetch(`${API_BASE_URL}/refuelings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRefueling),
            });
            if (!response.ok) {
                throw new Error(`Fehler beim Speichern: ${response.status}`);
            }
            await response.json();
            await fetchCars();
            await fetchStats();
            setIsAddRefuelingDialogOpen(false);
            setError(null);
        } catch (error) {
            console.error('Error adding refueling:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Hinzufügen der Tankung');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Stack spacing={3}>
                {/* Stats Overview */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <DirectionsCarIcon color="primary" />
                                <Box>
                                    <Typography variant="h6">{stats.totalCars}</Typography>
                                    <Typography variant="body2" color="text.secondary">Fahrzeuge</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <LocalGasStationIcon color="primary" />
                                <Box>
                                    <Typography variant="h6">{stats.totalRefuelings}</Typography>
                                    <Typography variant="body2" color="text.secondary">Tankungen</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2 }}>
                            <Box>
                                <Typography variant="h6">{stats.totalCost.toFixed(2)} €</Typography>
                                <Typography variant="body2" color="text.secondary">Gesamtkosten</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2 }}>
                            <Box>
                                <Typography variant="h6">{stats.averageCostPerLiter.toFixed(3)} €/L</Typography>
                                <Typography variant="body2" color="text.secondary">Ø Preis/Liter</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                <Paper sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                        <Typography component="h2" variant="h6" color="primary">
                            Schnellzugriff
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<LocalGasStationIcon />}
                                onClick={() => setIsAddRefuelingDialogOpen(true)}
                            >
                                Neue Tankung
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<DirectionsCarIcon />}
                                onClick={() => setIsAddCarDialogOpen(true)}
                            >
                                Neues Fahrzeug
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>

                <Paper sx={{ p: 2 }}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom>
                        Meine Fahrzeuge
                    </Typography>
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <CarList cars={cars} onCarUpdate={fetchCars} />
                </Paper>
            </Stack>

            <AddCarDialog
                open={isAddCarDialogOpen}
                onClose={() => setIsAddCarDialogOpen(false)}
                onAdd={handleAddCar}
            />
            <AddRefuelingDialog 
                open={isAddRefuelingDialogOpen}
                onClose={() => setIsAddRefuelingDialogOpen(false)}
                onAdd={handleAddRefueling}
                cars={cars}
            />
        </Container>
    );
}
