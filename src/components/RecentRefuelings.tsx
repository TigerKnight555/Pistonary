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
    useTheme,
    useMediaQuery
} from '@mui/material';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
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
    const { token } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
            <Paper sx={{ p: isMobile ? 2 : 3, textAlign: 'center', width: '100%' }}>
                <CircularProgress size={isMobile ? 32 : 40} />
                <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                        mt: 2,
                        fontSize: isMobile ? '0.875rem' : '1rem'
                    }}
                >
                    Lade Tankungen...
                </Typography>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: isMobile ? 2 : 3, width: '100%' }}>
                <Alert severity="error">{error}</Alert>
            </Paper>
        );
    }

    if (refuelings.length === 0) {
        return (
            <Paper sx={{ p: isMobile ? 2 : 3, textAlign: 'center', width: '100%' }}>
                <LocalGasStationIcon sx={{ 
                    fontSize: isMobile ? 40 : 48, 
                    color: 'text.secondary', 
                    mb: 2 
                }} />
                <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                >
                    Noch keine Tankungen erfasst
                </Typography>
                <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                >
                    Für dieses Fahrzeug wurden bisher keine Tankungen erfasst.
                    Füge deine erste Tankung hinzu, um den Tankverlauf zu sehen.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 0, width: '100%' }}>
            <Box sx={{ p: isMobile ? 1.5 : 2, pb: 0.5 }}>
                <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: isMobile ? 0.5 : 1, 
                        mb: isMobile ? 1 : 1.5,
                        fontSize: isMobile ? '0.9rem' : '1.1rem'
                    }}
                >
                    <LocalGasStationIcon 
                        color="primary" 
                        sx={{ fontSize: isMobile ? '1.1rem' : '1.3rem' }}
                    />
                    Letzte Tankungen
                </Typography>
                <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                        mb: 0.5,
                        fontSize: isMobile ? '0.7rem' : '0.8rem'
                    }}
                >
                    Die letzten {Math.min(4, refuelings.length)} Tankungen
                </Typography>
            </Box>

            <List sx={{ pt: 0, pb: 1 }}>
                {refuelings.slice(0, 4).map((refueling, index) => {
                    // Berechne Opacity für Fade-Out-Effekt (Apple-Style)
                    const getOpacity = (idx: number) => {
                        if (idx === 0) return 1;        // Erste: volle Opacity
                        if (idx === 1) return 0.85;     // Zweite: leicht reduziert
                        if (idx === 2) return 0.65;     // Dritte: mittlere Opacity
                        return 0.4;                     // Vierte: stark reduziert (Fade-Out)
                    };

                    return (
                        <Box 
                            key={refueling.id}
                            sx={{
                                opacity: getOpacity(index),
                                transition: 'opacity 0.3s ease-in-out'
                            }}
                        >
                        <ListItem sx={{ 
                            px: 0, 
                            py: isMobile ? 0.5 : 0.75,
                            m: 0,
                            minHeight: isMobile ? 48 : 'auto', // Touch-friendly
                            '& .MuiListItem-root': {
                                paddingLeft: 0,
                                paddingRight: 0,
                                margin: 0,
                            }
                        }}>
                            <ListItemText
                                sx={{ mx: isMobile ? 1.5 : 2 }}
                                primary={
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        mb: 0,
                                        flexDirection: 'row',
                                        gap: 0
                                    }}>
                                        <Typography 
                                            variant={isMobile ? "body2" : "body1"} 
                                            sx={{ 
                                                fontWeight: 'medium',
                                                fontSize: isMobile ? '0.8rem' : '0.9rem'
                                            }}
                                        >
                                            {formatDate(refueling.date)}
                                        </Typography>
                                        <Chip 
                                            label={formatPrice(refueling.price)} 
                                            color="primary" 
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                fontSize: isMobile ? '0.7rem' : '0.75rem',
                                                height: isMobile ? 20 : 24
                                            }}
                                        />
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        flexWrap: 'wrap', 
                                        gap: 0.5,
                                        mt: 0
                                    }}>
                                        <Box>
                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary"
                                                sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}
                                            >
                                                <strong>{refueling.amount} L</strong> • {formatPrice(getPricePerLiter(refueling.price, refueling.amount))}/L
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary"
                                                sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}
                                            >
                                                {refueling.mileage.toLocaleString('de-DE')} km
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                            />
                        </ListItem>
                        {index < refuelings.slice(0, 4).length - 1 && <Divider />}
                    </Box>
                    );
                })}
            </List>
        </Paper>
    );
}
