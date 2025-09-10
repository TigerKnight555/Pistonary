import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Alert,
    CircularProgress,
    ToggleButton,
    ToggleButtonGroup,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import type { Refueling } from '../database/entities/Refueling';
import type { JWTPayload } from '../types/Auth';
import { API_BASE_URL } from '../config/api';
import dayjs from 'dayjs';

interface RefuelingChartProps {
    refreshTrigger?: number;
}

type ChartType = 'line' | 'bar';
type DataView = 'amount' | 'price' | 'mileage' | 'pricePerLiter' | 'consumption';

interface ChartDataPoint {
    date: string;
    dateFormatted: string;
    amount: number;
    price: number;
    mileage: number;
    pricePerLiter: number;
    consumption?: number; // L/100km
    distanceDriven?: number; // km seit letzter Tankung
}

export default function RefuelingChart({ refreshTrigger }: RefuelingChartProps) {
    const [refuelings, setRefuelings] = useState<Refueling[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartType, setChartType] = useState<ChartType>('line');
    const [dataView, setDataView] = useState<DataView>('consumption'); // Default: Verbrauch anzeigen
    const { token } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const fetchRefuelings = async () => {
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
            
            if (!decoded.selectedCarId) {
                setError('Kein Auto ausgewählt');
                setLoading(false);
                return;
            }

            console.log('Fetching refuelings for chart, car ID:', decoded.selectedCarId);

            const response = await fetch(`${API_BASE_URL}/cars/${decoded.selectedCarId}/refuelings`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setRefuelings([]);
                    setLoading(false);
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Chart refuelings loaded:', data.length);
            setRefuelings(data);
        } catch (err) {
            console.error('Error fetching refuelings for chart:', err);
            setError(err instanceof Error ? err.message : 'Fehler beim Laden der Tankungen');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefuelings();
    }, [token, refreshTrigger]);

    // Daten für Chart aufbereiten
    const sortedRefuelings = refuelings
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const chartData: ChartDataPoint[] = sortedRefuelings
        .map((refueling, index) => {
            let consumption: number | undefined = undefined;
            let distanceDriven: number | undefined = undefined;

            // Verbrauch berechnen (nur wenn es eine vorherige Tankung gibt)
            if (index > 0) {
                const previousRefueling = sortedRefuelings[index - 1];
                distanceDriven = refueling.mileage - previousRefueling.mileage;
                
                // Nur berechnen wenn die Strecke positiv ist und die vorherige Tankung eine Volltankung war
                if (distanceDriven > 0 && !previousRefueling.isPartialRefueling) {
                    // L/100km = (Liter / gefahrene km) * 100
                    consumption = (refueling.amount / distanceDriven) * 100;
                }
            }

            return {
                date: refueling.date,
                dateFormatted: dayjs(refueling.date).format('DD.MM.YY'),
                amount: refueling.amount,
                price: refueling.price,
                mileage: refueling.mileage,
                pricePerLiter: refueling.amount > 0 ? refueling.price / refueling.amount : 0,
                consumption,
                distanceDriven
            };
        });

    // Durchschnittswerte berechnen
    const getAverageValue = (view: DataView): number | null => {
        if (view === 'consumption') {
            // Nur Tankungen mit gültigem Verbrauchswert verwenden
            const validConsumptionData = chartData.filter(d => d.consumption !== undefined && d.consumption !== null);
            if (validConsumptionData.length === 0) return null;
            
            const sum = validConsumptionData.reduce((acc, d) => acc + (d.consumption || 0), 0);
            return sum / validConsumptionData.length;
        } else {
            // Für andere Ansichten alle Datenpunkte verwenden
            const values = chartData.map(d => d[view]).filter(v => v !== undefined && v !== null) as number[];
            if (values.length === 0) return null;
            
            const sum = values.reduce((acc, val) => acc + val, 0);
            return sum / values.length;
        }
    };

    const averageValue = getAverageValue(dataView);

    const handleChartTypeChange = (_: React.MouseEvent<HTMLElement>, newType: ChartType | null) => {
        if (newType !== null) {
            setChartType(newType);
        }
    };

    const handleDataViewChange = (_: React.MouseEvent<HTMLElement>, newView: DataView | null) => {
        if (newView !== null) {
            setDataView(newView);
        }
    };

    const getDataViewConfig = (view: DataView) => {
        switch (view) {
            case 'amount':
                return { label: 'Menge', unit: 'L', color: '#2196f3' };
            case 'price':
                return { label: 'Preis', unit: '€', color: '#4caf50' };
            case 'mileage':
                return { label: 'Kilometerstand', unit: 'km', color: '#ff9800' };
            case 'pricePerLiter':
                return { label: 'Preis pro Liter', unit: '€/L', color: '#e91e63' };
            case 'consumption':
                return { label: 'Verbrauch', unit: 'L/100km', color: '#9c27b0' };
            default:
                return { label: 'Unbekannt', unit: '', color: '#666' };
        }
    };

    const config = getDataViewConfig(dataView);

    const customTooltip = (props: any) => {
        if (props.active && props.payload && props.payload.length) {
            const data = props.payload[0].payload;
            const value = data[dataView];
            
            return (
                <Paper sx={{ p: 1, border: '1px solid #ccc' }}>
                    <Typography variant="body2">
                        <strong>{data.dateFormatted}</strong>
                    </Typography>
                    {value !== undefined && value !== null ? (
                        <>
                            <Typography variant="body2" color={config.color}>
                                {config.label}: {value.toFixed(2)} {config.unit}
                            </Typography>
                            {dataView === 'consumption' && data.distanceDriven && (
                                <Typography variant="caption" color="text.secondary">
                                    {data.distanceDriven.toFixed(0)} km seit letzter Tankung
                                </Typography>
                            )}
                        </>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            {dataView === 'consumption' ? 'Verbrauch nicht berechenbar' : 'Keine Daten'}
                            <br />
                            <Typography variant="caption">
                                Betankung: {data.amount} L • {data.price.toFixed(2)} €
                            </Typography>
                        </Typography>
                    )}
                </Paper>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                    Lade Tankstatistiken...
                </Typography>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Paper>
        );
    }

    if (refuelings.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                    Keine Tankungen vorhanden
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Füge erste Tankungen hinzu, um Statistiken zu sehen.
                </Typography>
            </Paper>
        );
    }

    if (chartData.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="info">
                    Nicht genügend Daten für Statistiken verfügbar.
                </Alert>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Tankstatistiken
            </Typography>

            <Box sx={{ mb: 3, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, alignItems: 'center' }}>
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Diagrammtyp:
                    </Typography>
                    <ToggleButtonGroup
                        value={chartType}
                        exclusive
                        onChange={handleChartTypeChange}
                        size="small"
                    >
                        <ToggleButton value="line">
                            <TrendingUpIcon sx={{ mr: 0.5 }} />
                            Linie
                        </ToggleButton>
                        <ToggleButton value="bar">
                            <BarChartIcon sx={{ mr: 0.5 }} />
                            Balken
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Datenansicht:
                    </Typography>
                    <ToggleButtonGroup
                        value={dataView}
                        exclusive
                        onChange={handleDataViewChange}
                        size="small"
                        orientation={isMobile ? 'vertical' : 'horizontal'}
                    >
                        <ToggleButton value="consumption">Verbrauch</ToggleButton>
                        <ToggleButton value="amount">Menge</ToggleButton>
                        <ToggleButton value="price">Preis</ToggleButton>
                        <ToggleButton value="pricePerLiter">€/L</ToggleButton>
                        <ToggleButton value="mileage">KM-Stand</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            <Box sx={{ width: '100%', height: isMobile ? 250 : 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart 
                            data={chartData} 
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="dateFormatted" 
                                tick={{ fontSize: isMobile ? 10 : 12 }}
                                interval={isMobile ? 'preserveStartEnd' : 0}
                                angle={isMobile ? -45 : 0}
                                textAnchor={isMobile ? 'end' : 'middle'}
                            />
                            <YAxis 
                                tick={{ fontSize: isMobile ? 10 : 12 }}
                                label={{ 
                                    value: `${config.label} (${config.unit})`, 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    style: { fontSize: isMobile ? 10 : 12 }
                                }}
                            />
                            <Tooltip content={customTooltip} />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey={dataView} 
                                stroke={config.color} 
                                strokeWidth={2}
                                dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6 }}
                                connectNulls={false}
                                name={config.label}
                            />
                            {averageValue !== null && (
                                <ReferenceLine 
                                    y={averageValue} 
                                    stroke="#ff6b35"
                                    strokeDasharray="8 8"
                                    strokeWidth={2}
                                    label={{
                                        value: `Ø ${averageValue.toFixed(2)} ${config.unit}`,
                                        position: "top",
                                        style: { fontSize: isMobile ? 10 : 12, fill: "#ff6b35", fontWeight: "bold" }
                                    }}
                                />
                            )}
                        </LineChart>
                    ) : (
                        <BarChart 
                            data={chartData} 
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="dateFormatted" 
                                tick={{ fontSize: isMobile ? 10 : 12 }}
                                interval={isMobile ? 'preserveStartEnd' : 0}
                                angle={isMobile ? -45 : 0}
                                textAnchor={isMobile ? 'end' : 'middle'}
                            />
                            <YAxis 
                                tick={{ fontSize: isMobile ? 10 : 12 }}
                                label={{ 
                                    value: `${config.label} (${config.unit})`, 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    style: { fontSize: isMobile ? 10 : 12 }
                                }}
                            />
                            <Tooltip content={customTooltip} />
                            <Legend />
                            <Bar 
                                dataKey={dataView} 
                                fill={config.color}
                                name={config.label}
                            />
                            {averageValue !== null && (
                                <ReferenceLine 
                                    y={averageValue} 
                                    stroke="#ff6b35"
                                    strokeDasharray="8 8"
                                    strokeWidth={2}
                                    label={{
                                        value: `Ø ${averageValue.toFixed(2)} ${config.unit}`,
                                        position: "top",
                                        style: { fontSize: isMobile ? 10 : 12, fill: "#ff6b35", fontWeight: "bold" }
                                    }}
                                />
                            )}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    📊 {refuelings.length} Tankungen • 
                    {chartData.length > 0 && (
                        <>
                            {' '}Zeitraum: {dayjs(chartData[0].date).format('DD.MM.YYYY')} - {dayjs(chartData[chartData.length - 1].date).format('DD.MM.YYYY')}
                        </>
                    )}
                    {averageValue !== null && (
                        <>
                            {' '}• Ø {config.label}: {averageValue.toFixed(2)} {config.unit}
                        </>
                    )}
                </Typography>
            </Box>
        </Paper>
    );
}
