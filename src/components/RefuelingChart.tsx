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
import { chartColors } from '../theme/theme';
import dayjs from 'dayjs';

export type TimeRange = 'all' | 'ytd' | 'lastYear' | 'lastMonth';

interface RefuelingChartProps {
    refreshTrigger?: number;
    timeRange?: TimeRange;
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

export default function RefuelingChart({ refreshTrigger, timeRange = 'lastMonth' }: RefuelingChartProps) {
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
            
            // Debug: Zeige Details über die geladenen Tankungen
            if (data.length > 0) {
                console.log('Refuelings details:', data.map((r: any) => ({
                    date: r.date,
                    mileage: r.mileage,
                    amount: r.amount,
                    isPartial: r.isPartialRefueling
                })));
            }
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

    // Funktion zum Filtern der Daten basierend auf dem Zeitraum
    const filterByTimeRange = (refuelings: Refueling[], timeRange: TimeRange): Refueling[] => {
        const now = dayjs();
        let startDate: dayjs.Dayjs;

        switch (timeRange) {
            case 'lastMonth':
                startDate = now.subtract(1, 'month');
                break;
            case 'ytd':
                startDate = now.startOf('year');
                break;
            case 'lastYear':
                startDate = now.subtract(1, 'year');
                break;
            case 'all':
            default:
                return refuelings; // Keine Filterung
        }

        return refuelings.filter(refueling => 
            dayjs(refueling.date).isAfter(startDate)
        );
    };

    // Daten für Chart aufbereiten
    const filteredRefuelings = filterByTimeRange(refuelings, timeRange);
    const sortedRefuelings = filteredRefuelings
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const chartData: ChartDataPoint[] = sortedRefuelings
        .map((refueling, index, array) => {
            let consumption: number | undefined = undefined;
            let distanceDriven: number | undefined = undefined;

            // Verbrauch berechnen: Schaue zur NÄCHSTEN Tankung für die Verbrauchsberechnung
            // Das bedeutet: Der Verbrauch wird für die aktuelle Tankung basierend auf der nächsten Tankung berechnet
            if (index < array.length - 1) {
                const nextRefueling = array[index + 1];
                distanceDriven = nextRefueling.mileage - refueling.mileage;
                
                // Verbrauch berechnen wenn:
                // 1. Die Strecke positiv ist (mehr als 0 km gefahren)
                // 2. Die nächste Tankung mehr als 0 Liter hat
                if (distanceDriven > 0 && nextRefueling.amount > 0) {
                    // L/100km = (Liter der nächsten Tankung / gefahrene km zwischen den Tankungen) * 100
                    consumption = (nextRefueling.amount / distanceDriven) * 100;
                    
                    // Debug: Log der Verbrauchsberechnung
                    console.log(`Consumption calculated for ${dayjs(refueling.date).format('DD.MM.YY')}: ${consumption.toFixed(2)} L/100km (${nextRefueling.amount}L / ${distanceDriven}km)`);
                    
                    // Wenn die aktuelle Tankung eine Teiltankung war, markiere den Verbrauch als weniger zuverlässig
                    // aber berechne ihn trotzdem für die Statistik
                    if (refueling.isPartialRefueling) {
                        console.log(`Note: Previous refueling was partial, consumption may be less accurate`);
                    }
                } else {
                    console.log(`Consumption NOT calculated for ${dayjs(refueling.date).format('DD.MM.YY')}: distance=${distanceDriven}, nextAmount=${nextRefueling.amount}`);
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

    // Debug: Zeige Chart-Daten
    console.log('Chart data points:', chartData.length);
    console.log('Chart consumption points:', chartData.filter(d => d.consumption !== undefined).length);

    // Daten für die aktuelle Ansicht filtern
    const getFilteredChartData = (): ChartDataPoint[] => {
        if (dataView === 'consumption') {
            // Bei Verbrauchsansicht nur Datenpunkte mit gültigem Verbrauchswert anzeigen
            const filtered = chartData.filter(d => d.consumption !== undefined && d.consumption !== null);
            console.log('Filtered consumption data points:', filtered.length);
            return filtered;
        }
        // Für alle anderen Ansichten alle Datenpunkte anzeigen
        return chartData;
    };

    const filteredChartData = getFilteredChartData();

    // Durchschnittswerte berechnen
    const getAverageValue = (view: DataView): number | null => {
        if (view === 'consumption') {
            // Für Verbrauch: nur gefilterte Daten mit gültigem Verbrauchswert verwenden
            if (filteredChartData.length === 0) return null;
            
            const sum = filteredChartData.reduce((acc, d) => acc + (d.consumption || 0), 0);
            return sum / filteredChartData.length;
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
                return { label: 'Menge', unit: 'L', color: chartColors.amount };
            case 'price':
                return { label: 'Preis', unit: '€', color: chartColors.price };
            case 'mileage':
                return { label: 'Kilometerstand', unit: 'km', color: chartColors.mileage };
            case 'pricePerLiter':
                return { label: 'Preis pro Liter', unit: '€/L', color: chartColors.pricePerLiter };
            case 'consumption':
                return { label: 'Verbrauch', unit: 'L/100km', color: chartColors.consumption };
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
                                    {data.distanceDriven.toFixed(0)} km bis zur nächsten Tankung
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
            <Paper sx={{ p: 3, mb: 4 }}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Paper>
        );
    }

    if (refuelings.length === 0) {
        return (
            <Paper sx={{ p: 3, mb: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                    Keine Tankungen vorhanden
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Füge erste Tankungen hinzu, um Statistiken zu sehen.
                </Typography>
            </Paper>
        );
    }

    if (filteredRefuelings.length === 0) {
        const timeRangeLabels = {
            lastMonth: 'letzten Monat',
            ytd: 'Jahr bis heute',
            lastYear: 'letztes Jahr', 
            all: 'gesamten Zeitraum'
        };

        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="info">
                    Keine Tankungen im {timeRangeLabels[timeRange]} gefunden.
                </Alert>
            </Paper>
        );
    }

    if (filteredChartData.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="info">
                    {dataView === 'consumption' 
                        ? 'Nicht genügend Daten für Verbrauchsberechnung verfügbar. Mindestens 2 Tankungen erforderlich.'
                        : 'Nicht genügend Daten für Statistiken verfügbar.'
                    }
                </Alert>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
                Tankstatistiken
            </Typography>

            <Box sx={{ 
                mb: 3, 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2, 
                alignItems: 'flex-start',
                justifyContent: 'space-between'
            }}>
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
                        orientation="horizontal"
                    >
                        <ToggleButton value="consumption">Verbrauch</ToggleButton>
                        <ToggleButton value="pricePerLiter">€/L</ToggleButton>
                        <ToggleButton value="mileage">KM-Stand</ToggleButton>
                        <ToggleButton value="price">Preis</ToggleButton>
                        <ToggleButton value="amount">Menge</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            <Box sx={{ width: '100%', height: isMobile ? 250 : 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart 
                            data={filteredChartData} 
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
                            {averageValue !== null && dataView !== 'mileage' && (
                                <ReferenceLine 
                                    y={averageValue} 
                                    stroke={chartColors.average}
                                    strokeDasharray="8 8"
                                    strokeWidth={2}
                                    label={{
                                        value: `Ø ${averageValue.toFixed(2)} ${config.unit}`,
                                        position: "top",
                                        style: { fontSize: isMobile ? 10 : 12, fill: chartColors.average, fontWeight: "bold" }
                                    }}
                                />
                            )}
                        </LineChart>
                    ) : (
                        <BarChart 
                            data={filteredChartData} 
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
                            {averageValue !== null && dataView !== 'mileage' && (
                                <ReferenceLine 
                                    y={averageValue} 
                                    stroke={chartColors.average}
                                    strokeDasharray="8 8"
                                    strokeWidth={2}
                                    label={{
                                        value: `Ø ${averageValue.toFixed(2)} ${config.unit}`,
                                        position: "top",
                                        style: { fontSize: isMobile ? 10 : 12, fill: chartColors.average, fontWeight: "bold" }
                                    }}
                                />
                            )}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    📊 {filteredRefuelings.length} Tankungen im gewählten Zeitraum
                    {filteredChartData.length > 0 && (
                        <>
                            {' '}• Zeitraum: {dayjs(filteredChartData[0].date).format('DD.MM.YYYY')} - {dayjs(filteredChartData[filteredChartData.length - 1].date).format('DD.MM.YYYY')}
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
