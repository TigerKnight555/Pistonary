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
    ReferenceLine,
    ReferenceArea
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import EventIcon from '@mui/icons-material/Event';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import type { Refueling } from '../database/entities/Refueling';
import type { JWTPayload } from '../types/Auth';
import { API_BASE_URL } from '../config/api';
import dayjs from 'dayjs';

interface CarEvent {
    id: number;
    title: string;
    description?: string;
    date: string;
    mileage?: number;
    type: string;
    cost?: number;
    notes?: string;
    carId: number;
}

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
    const [events, setEvents] = useState<CarEvent[]>([]);
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

    const fetchEvents = async () => {
        if (!token) {
            console.log('🔑 No token for events fetch');
            return;
        }

        try {
            // Auto-ID aus Token holen
            const decoded = jwtDecode<JWTPayload>(token);
            console.log('🚗 Fetching events for car ID:', decoded.selectedCarId);
            
            if (!decoded.selectedCarId) {
                console.log('❌ No selectedCarId for events fetch');
                return;
            }

            const url = `${API_BASE_URL}/cars/${decoded.selectedCarId}/events`;
            console.log('🌐 Events fetch URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('📡 Events response status:', response.status);
            console.log('📡 Events response OK:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Chart events loaded:', data.length, data);
                setEvents(data);
            } else {
                console.log('❌ Events fetch failed:', response.status, response.statusText);
            }
        } catch (err) {
            console.error('💥 Error fetching events for chart:', err);
        }
    };

    useEffect(() => {
        fetchRefuelings();
        fetchEvents();
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

    // Alle Events anzeigen
    const relevantEvents = events;

    console.log('📊 Original chartData length:', chartData.length);
    console.log('🎯 Events to display:', relevantEvents.length);
    console.log('🎯 Event dates:', relevantEvents.map(e => `${e.title}: ${e.date} (${dayjs(e.date).format('DD.MM.YY')})`));
    console.log('� Chart data dates:', chartData.map(d => `${d.dateFormatted} (${d.date})`));

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
                return {
                    label: 'Liter',
                    color: '#2196f3',
                    unit: 'L'
                };
            case 'price':
                return {
                    label: 'Preis',
                    color: '#4caf50',
                    unit: '€'
                };
            case 'mileage':
                return {
                    label: 'Kilometerstand',
                    color: '#ff9800',
                    unit: 'km'
                };
            case 'pricePerLiter':
                return {
                    label: 'Preis pro Liter',
                    color: '#e91e63',
                    unit: '€/L'
                };
            case 'consumption':
                return {
                    label: 'Verbrauch',
                    color: '#9c27b0',
                    unit: 'L/100km'
                };
            default:
                return {
                    label: 'Wert',
                    color: '#2196f3',
                    unit: ''
                };
        }
    };

    const config = getDataViewConfig(dataView);

    const customTooltip = (props: any) => {
        if (props.active && props.payload && props.payload.length) {
            const data = props.payload[0].payload;
            const value = data[dataView];
            
            // Events für dieses Datum finden
            const eventsForDate = relevantEvents.filter(event => 
                dayjs(event.date).format('DD.MM.YY') === data.dateFormatted
            );
            
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
                    {/* Events für dieses Datum anzeigen */}
                    {eventsForDate.length > 0 && (
                        <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                            <Typography variant="caption" color="#9c27b0" fontWeight="bold">
                                🎯 Ereignisse:
                            </Typography>
                            {eventsForDate.map(event => (
                                <Typography key={event.id} variant="caption" display="block" color="#9c27b0">
                                    • {event.title}
                                    {event.type && ` (${event.type})`}
                                </Typography>
                            ))}
                        </Box>
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
            <Alert severity="error">
                <Typography variant="body2">
                    Fehler beim Laden der Tankstatistiken: {error}
                </Typography>
            </Alert>
        );
    }

    if (refuelings.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="h6" color="text.secondary">
                    Keine Tankungen vorhanden
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Füge deine erste Tankung hinzu, um Statistiken zu sehen.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon />
                    Tankstatistiken ({refuelings.length} Tankungen)
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {/* Chart Type Toggle */}
                    <ToggleButtonGroup
                        value={chartType}
                        exclusive
                        onChange={handleChartTypeChange}
                        size="small"
                    >
                        <ToggleButton value="line">
                            <TrendingUpIcon sx={{ mr: 0.5 }} />
                            {!isMobile && 'Linie'}
                        </ToggleButton>
                        <ToggleButton value="bar">
                            <BarChartIcon sx={{ mr: 0.5 }} />
                            {!isMobile && 'Balken'}
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* Data View Toggle */}
                    <ToggleButtonGroup
                        value={dataView}
                        exclusive
                        onChange={handleDataViewChange}
                        size="small"
                    >
                        <ToggleButton value="amount">
                            {isMobile ? 'L' : 'Liter'}
                        </ToggleButton>
                        <ToggleButton value="price">
                            {isMobile ? '€' : 'Preis'}
                        </ToggleButton>
                        <ToggleButton value="mileage">
                            {isMobile ? 'km' : 'Kilometerstand'}
                        </ToggleButton>
                        <ToggleButton value="pricePerLiter">
                            {isMobile ? '€/L' : 'Preis/L'}
                        </ToggleButton>
                        <ToggleButton value="consumption">
                            {isMobile ? 'L/100km' : 'Verbrauch'}
                        </ToggleButton>
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
                            {/* Event-Linien anzeigen */}
                            {relevantEvents.map((event) => {
                                const dateStr = dayjs(event.date).format('DD.MM.YY');
                                console.log('🎯 Event ReferenceLine for:', event.title, 'dateStr:', dateStr);
                                return (
                                    <ReferenceLine 
                                        key={event.id}
                                        x={dateStr}
                                        stroke="#9c27b0"
                                        strokeDasharray="4 4"
                                        strokeWidth={2}
                                        label={{
                                            value: event.title,
                                            position: "insideTopRight",
                                            offset: 10,
                                            style: { 
                                                fontSize: isMobile ? 10 : 12, 
                                                fill: "#9c27b0", 
                                                fontWeight: "bold",
                                                backgroundColor: "rgba(255,255,255,0.8)",
                                                padding: "2px 4px",
                                                borderRadius: "3px"
                                            }
                                        }}
                                    />
                                );
                            })}
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
                            {/* Event-Linien anzeigen */}
                            {relevantEvents.map((event) => {
                                const dateStr = dayjs(event.date).format('DD.MM.YY');
                                console.log('🎯 Event BarChart ReferenceLine for:', event.title, 'dateStr:', dateStr);
                                return (
                                    <ReferenceLine 
                                        key={event.id}
                                        x={dateStr}
                                        stroke="#9c27b0"
                                        strokeDasharray="4 4"
                                        strokeWidth={2}
                                        label={{
                                            value: event.title,
                                            position: "insideTopRight",
                                            offset: 10,
                                            style: { 
                                                fontSize: isMobile ? 10 : 12, 
                                                fill: "#9c27b0", 
                                                fontWeight: "bold",
                                                backgroundColor: "rgba(255,255,255,0.8)",
                                                padding: "2px 4px",
                                                borderRadius: "3px"
                                            }
                                        }}
                                    />
                                );
                            })}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    📊 {refuelings.length} Tankungen • 
                    🎯 {relevantEvents.length} Ereignisse •
                    {chartData.length > 0 && (
                        <>
                            {' '}Zeitraum: {dayjs(chartData[0].date).format('DD.MM.YYYY')} - {dayjs(chartData[chartData.length - 1].date).format('DD.MM.YYYY')}
                        </>
                    )}
                    {averageValue !== null && (
                        <>
                            {' '}• ⌀ {averageValue.toFixed(2)} {config.unit}
                        </>
                    )}
                </Typography>
                {dataView === 'consumption' && (
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
                        ⚠️ Verbrauch wird nur zwischen Volltankungen berechnet (erste Tankung wird ausgeschlossen)
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}
