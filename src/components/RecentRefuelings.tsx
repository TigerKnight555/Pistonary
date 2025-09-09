import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    Box,
    Chip,
    Divider,
    Alert,
    CircularProgress,
    IconButton
} from '@mui/material';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import EditIcon from '@mui/icons-material/Edit';
import EditRefuelingDialog from './EditRefuelingDialog';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import type { Refueling } from '../database/entities/Refueling';
import type { JWTPayload } from '../types/Auth';
import { API_BASE_URL } from '../config/api';
import dayjs from 'dayjs';
import 'dayjs/locale/de';

dayjs.locale('de');

interface RecentRefuelingsProps {
    onRefuelingAdded?: () => void; // Callback für Aktualisierung nach neuer Tankung
    refreshTrigger?: number; // Trigger für externe Updates
}

export default function RecentRefuelings({ onRefuelingAdded, refreshTrigger }: RecentRefuelingsProps) {
    const [refuelings, setRefuelings] = useState<Refueling[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedRefueling, setSelectedRefueling] = useState<Refueling | null>(null);
    const { token } = useAuth();

    const fetchRecentRefuelings = async () => {
        if (!token) {
            setError('Nicht angemeldet');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // Auto-ID aus Token holen
            const decoded = jwtDecode<JWTPayload>(token);
            console.log('JWT Token decoded:', decoded);
            
            if (!decoded.selectedCarId) {
                setError('Kein Auto ausgewählt');
                setLoading(false);
                return;
            }

            console.log('Fetching refuelings for car ID:', decoded.selectedCarId);

            const response = await fetch(`${API_BASE_URL}/cars/${decoded.selectedCarId}/refuelings?limit=5`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('No refuelings found, setting empty array');
                    setRefuelings([]);
                    setError(null);
                } else {
                    throw new Error(`Fehler beim Laden der Tankungen: ${response.status}`);
                }
            } else {
                const data = await response.json();
                console.log('Received refuelings data:', data);
                setRefuelings(Array.isArray(data) ? data : []);
                setError(null);
            }
        } catch (error) {
            console.error('Error fetching refuelings:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Laden der Tankungen');
            setRefuelings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecentRefuelings();
    }, [token, refreshTrigger]); // Reagiert auf Token- und Trigger-Änderungen

    // Edit Dialog Funktionen
    const handleEditRefueling = (refueling: Refueling) => {
        setSelectedRefueling(refueling);
        setEditDialogOpen(true);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setSelectedRefueling(null);
    };

    const handleRefuelingUpdated = () => {
        fetchRecentRefuelings(); // Liste neu laden
        if (onRefuelingAdded) {
            onRefuelingAdded(); // Dashboard Chart aktualisieren
        }
    };

    // Aktualisierung bei neuer Tankung
    useEffect(() => {
        if (onRefuelingAdded) {
            fetchRecentRefuelings();
        }
    }, [onRefuelingAdded]);

    const formatDate = (dateString: string) => {
        return dayjs(dateString).format('DD.MM.YYYY');
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const getPricePerLiter = (totalPrice: number, liters: number) => {
        if (liters === 0) return 0;
        return totalPrice / liters;
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Lade Tankungen...
                </Typography>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Paper>
        );
    }

    if (refuelings.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <LocalGasStationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    Noch keine Tankungen erfasst
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Für dieses Fahrzeug wurden bisher keine Tankungen erfasst.
                    Füge deine erste Tankung hinzu, um den Tankverlauf zu sehen.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 1 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalGasStationIcon color="primary" />
                    Letzte Tankungen
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Die letzten {Math.min(5, refuelings.length)} Tankungen
                </Typography>
            </Box>

            <List sx={{ pt: 0 }}>
                {refuelings.map((refueling, index) => (
                    <Box key={refueling.id}>
                        <ListItem sx={{ px: 3, py: 2 }}>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                            {formatDate(refueling.date)}
                                        </Typography>
                                        <Chip 
                                            label={formatPrice(refueling.price)} 
                                            color="primary" 
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>{refueling.amount} L</strong> • {formatPrice(getPricePerLiter(refueling.price, refueling.amount))}/L
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {refueling.mileage.toLocaleString('de-DE')} km
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                            />
                            <IconButton 
                                onClick={() => handleEditRefueling(refueling)}
                                size="small"
                                sx={{ ml: 1 }}
                                title="Tankung bearbeiten"
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </ListItem>
                        {index < refuelings.length - 1 && <Divider />}
                    </Box>
                ))}
            </List>

            {/* Edit Refueling Dialog */}
            <EditRefuelingDialog
                open={editDialogOpen}
                onClose={handleEditDialogClose}
                onUpdate={handleRefuelingUpdated}
                refueling={selectedRefueling}
            />
        </Paper>
    );
}
