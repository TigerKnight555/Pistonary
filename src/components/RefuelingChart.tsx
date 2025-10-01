import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Alert,
    CircularProgress,
    ToggleButton,
    ToggleButtonGroup,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
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
import { useSettings } from '../contexts/SettingsContext';
import { jwtDecode } from 'jwt-decode';
import type { Refueling } from '../database/entities/Refueling';
import type { JWTPayload } from '../types/Auth';
import { API_BASE_URL } from '../config/api';
import { chartColors } from '../theme/theme';
import dayjs from 'dayjs';

export type TimeRange = 'all' | 'ytd' | 'lastYear' | 'lastMonth';

interface RefuelingChartProps {
    refreshTrigger?: number;
}

type ChartType = 'line' | 'bar';
type DataView = 'amount' | 'price' | 'mileage' | 'pricePerLiter' | 'consumption' | 'costPerKm';

interface ChartDataPoint {
    date: string;
    dateFormatted: string;
    amount: number;
    price: number;
    mileage: number;
    pricePerLiter: number;
    consumption?: number; // L/100km
    costPerKm?: number; // €/100km
    distanceDriven?: number; // km seit letzter Tankung
}

export default function RefuelingChart({ refreshTrigger }: RefuelingChartProps) {
    const [refuelings, setRefuelings] = useState<Refueling[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // TimeRange aus LocalStorage laden oder Fallback verwenden
    const [timeRange, setTimeRange] = useState<TimeRange>(() => {
        try {
            const savedTimeRange = localStorage.getItem('refuelingChart.timeRange');
            if (savedTimeRange && ['all', 'ytd', 'lastYear', 'lastMonth'].includes(savedTimeRange)) {
                return savedTimeRange as TimeRange;
            }
        } catch (error) {
            console.warn('Failed to load timeRange from localStorage:', error);
        }
        return 'lastMonth'; // Fallback
    });
    
    const { token } = useAuth();
    const { chartSettings } = useSettings();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Funktion zum Ändern des TimeRange und Speichern im LocalStorage
    const handleTimeRangeChange = (newTimeRange: TimeRange) => {
        setTimeRange(newTimeRange);
        try {
            localStorage.setItem('refuelingChart.timeRange', newTimeRange);
        } catch (error) {
            console.warn('Failed to save timeRange to localStorage:', error);
        }
    };
    
    // Standard-Werte basierend auf aktivierten Einstellungen setzen
    const [chartType, setChartType] = useState<ChartType>(() => {
        return chartSettings.enabledChartTypes.includes('line') ? 'line' : chartSettings.enabledChartTypes[0];
    });
    const [dataView, setDataView] = useState<DataView>(() => {
        return chartSettings.enabledDataViews.includes('consumption') ? 'consumption' : chartSettings.enabledDataViews[0];
    });

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

    // Stelle sicher, dass ausgewählte Werte bei Setting-Änderungen gültig bleiben
    useEffect(() => {
        if (!chartSettings.enabledChartTypes.includes(chartType)) {
            setChartType(chartSettings.enabledChartTypes[0]);
        }
        if (!chartSettings.enabledDataViews.includes(dataView)) {
            setDataView(chartSettings.enabledDataViews[0]);
        }
    }, [chartSettings, chartType, dataView]);

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
            let costPerKm: number | undefined = undefined;
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
                    
                    // €/100km = (Preis der nächsten Tankung / gefahrene km zwischen den Tankungen) * 100
                    costPerKm = (nextRefueling.price / distanceDriven) * 100;
                    
                    // Debug: Log der Verbrauchsberechnung
                    console.log(`Consumption calculated for ${dayjs(refueling.date).format('DD.MM.YY')}: ${consumption.toFixed(2)} L/100km (${nextRefueling.amount}L / ${distanceDriven}km)`);
                    console.log(`Cost per 100km calculated for ${dayjs(refueling.date).format('DD.MM.YY')}: ${costPerKm.toFixed(3)} €/100km (${nextRefueling.price}€ / ${distanceDriven}km * 100)`);
                    
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
                costPerKm,
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
        if (dataView === 'costPerKm') {
            // Bei €/km Ansicht nur Datenpunkte mit gültigem costPerKm Wert anzeigen
            const filtered = chartData.filter(d => d.costPerKm !== undefined && d.costPerKm !== null);
            console.log('Filtered cost per km data points:', filtered.length);
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
        } else if (view === 'costPerKm') {
            // Für €/km: nur gefilterte Daten mit gültigem costPerKm Wert verwenden
            if (filteredChartData.length === 0) return null;
            
            const sum = filteredChartData.reduce((acc, d) => acc + (d.costPerKm || 0), 0);
            return sum / filteredChartData.length;
        } else if (view === 'mileage') {
            // Für KM-Stand: Durchschnittliche Kilometerleistung berechnen
            if (chartData.length < 2) return null;
            
            // Sortiere Daten nach Datum
            const sortedData = [...chartData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const firstMileage = sortedData[0].mileage;
            const lastMileage = sortedData[sortedData.length - 1].mileage;
            const totalDistance = lastMileage - firstMileage;
            
            // Berechne Zeitspanne in Tagen
            const firstDate = new Date(sortedData[0].date);
            const lastDate = new Date(sortedData[sortedData.length - 1].date);
            const daysDifference = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysDifference <= 0) return null;
            
            // Durchschnittliche KM pro Tag
            const avgKmPerDay = totalDistance / daysDifference;
            
            // Verwende die Mitte des Datensatzes als Referenzpunkt für die Durchschnittslinie
            const midIndex = Math.floor(sortedData.length / 2);
            const midDate = new Date(sortedData[midIndex].date);
            const daysFromStart = (midDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
            const theoreticalMileage = firstMileage + (avgKmPerDay * daysFromStart);
            
            // Speichere die KM/Tag Information für die Beschriftung
            (getAverageValue as any).kmPerDay = avgKmPerDay;
            (getAverageValue as any).totalDays = daysDifference;
            
            return theoreticalMileage;
        } else {
            // Für andere Ansichten alle Datenpunkte verwenden
            const values = chartData.map(d => d[view]).filter(v => v !== undefined && v !== null) as number[];
            if (values.length === 0) return null;
            
            const sum = values.reduce((acc, val) => acc + val, 0);
            return sum / values.length;
        }
    };

    const averageValue = getAverageValue(dataView);

    // Hilfsfunktion für KM-Stand Beschriftung
    const getMileageAverageLabel = (): string => {
        if (dataView !== 'mileage' || !averageValue) return '';
        
        const kmPerDay = (getAverageValue as any).kmPerDay || 0;
        
        // Bestimme Zeiteinheit basierend auf dem gewählten Zeitraum
        let timeUnit: string;
        let kmValue: number;
        
        switch (timeRange) {
            case 'lastMonth':
                timeUnit = 'Monat';
                kmValue = Math.round(kmPerDay * 30.44); // Durchschnittliche Tage pro Monat
                break;
            case 'lastYear':
            case 'ytd':
                timeUnit = 'Jahr';
                kmValue = Math.round(kmPerDay * 365.25); // Berücksichtige Schaltjahre
                break;
            case 'all':
            default:
                // Für "Alle" bestimme automatisch die beste Einheit
                const totalDays = (getAverageValue as any).totalDays || 0;
                if (totalDays <= 60) {
                    timeUnit = 'Monat';
                    kmValue = Math.round(kmPerDay * 30.44);
                } else {
                    timeUnit = 'Jahr';
                    kmValue = Math.round(kmPerDay * 365.25);
                }
                break;
        }
        
        return `Ø ${kmValue} km/${timeUnit}`;
    };

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
            case 'costPerKm':
                return { label: 'Kosten', unit: '€/100km', color: chartColors.price };
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
                <Paper sx={{ 
                    p: isMobile ? 1.5 : 1, 
                    border: '1px solid #ccc',
                    maxWidth: isMobile ? 200 : 'auto',
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}>
                    <Typography 
                        variant={isMobile ? "caption" : "body2"}
                        sx={{ 
                            fontWeight: 'bold',
                            fontSize: isMobile ? '0.8rem' : '0.875rem'
                        }}
                    >
                        {data.dateFormatted}
                    </Typography>
                    {value !== undefined && value !== null ? (
                        <>
                            <Typography 
                                variant={isMobile ? "caption" : "body2"} 
                                color={config.color}
                                sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                            >
                                {config.label}: {value.toFixed(dataView === 'costPerKm' ? 2 : 2)} {config.unit}
                            </Typography>
                            {(dataView === 'consumption' || dataView === 'costPerKm') && data.distanceDriven && (
                                <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ 
                                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                                        display: 'block',
                                        mt: 0.5
                                    }}
                                >
                                    {data.distanceDriven.toFixed(0)} km bis zur nächsten Tankung
                                </Typography>
                            )}
                        </>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            {(dataView === 'consumption' || dataView === 'costPerKm') ? 
                                (dataView === 'consumption' ? 'Verbrauch nicht berechenbar' : 'Kosten pro 100km nicht berechenbar') : 
                                'Keine Daten'
                            }
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
            <Paper sx={{ p: 3, textAlign: 'center', width: '100%' }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                    Lade Tankstatistiken...
                </Typography>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 3, mb: 4, width: '100%' }}>
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
            <Paper sx={{ p: 3, textAlign: 'center', width: '100%' }}>
                <Alert severity="info">
                    Keine Tankungen im {timeRangeLabels[timeRange]} gefunden.
                </Alert>
            </Paper>
        );
    }

    if (filteredChartData.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center', width: '100%' }}>
                <Alert severity="info">
                    {dataView === 'consumption' 
                        ? 'Nicht genügend Daten für Verbrauchsberechnung verfügbar. Mindestens 2 Tankungen erforderlich.'
                        : dataView === 'costPerKm'
                        ? 'Nicht genügend Daten für Kostenberechnung pro 100km verfügbar. Mindestens 2 Tankungen erforderlich.'
                        : 'Nicht genügend Daten für Statistiken verfügbar.'
                    }
                </Alert>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: isMobile ? 1.5 : 2, mb: 4, width: '100%' }}>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: isMobile ? 1.5 : 2,
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 1 : 2
            }}>
                <Typography variant="h6">
                    Tankstatistiken
                </Typography>
                <FormControl 
                    size="small" 
                    sx={{ 
                        minWidth: isMobile ? 150 : 200,
                        width: isMobile ? '100%' : 'auto'
                    }}
                >
                    <InputLabel id="chart-time-range-label">Zeitraum</InputLabel>
                    <Select
                        labelId="chart-time-range-label"
                        value={timeRange}
                        label="Zeitraum"
                        onChange={(e) => handleTimeRangeChange(e.target.value as TimeRange)}
                        sx={{
                            minHeight: isMobile ? 44 : 'auto', // Touch-friendly
                        }}
                    >
                        <MenuItem value="lastMonth">Letzter Monat</MenuItem>
                        <MenuItem value="ytd">Year-to-Date</MenuItem>
                        <MenuItem value="lastYear">Letztes Jahr</MenuItem>
                        <MenuItem value="all">Gesamt</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ 
                mb: isMobile ? 1.5 : 2, 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2, 
                alignItems: 'flex-start',
                justifyContent: 'space-between'
            }}>
                {chartSettings.enabledChartTypes.length > 1 && (
                    <Box>
                        <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                                mb: 1,
                                fontSize: isMobile ? '0.75rem' : '0.875rem'
                            }}
                        >
                            Diagrammtyp:
                        </Typography>
                        <ToggleButtonGroup
                            value={chartType}
                            exclusive
                            onChange={handleChartTypeChange}
                            size={isMobile ? "small" : "small"}
                            sx={{
                                '& .MuiToggleButton-root': {
                                    minHeight: isMobile ? 44 : 'auto', // Touch-friendly
                                    px: isMobile ? 2 : 1.5,
                                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                                }
                            }}
                        >
                            {chartSettings.enabledChartTypes.includes('line') && (
                                <ToggleButton value="line">
                                    <TrendingUpIcon sx={{ 
                                        mr: isMobile ? 0.5 : 0.5,
                                        fontSize: isMobile ? '1rem' : '1.2rem'
                                    }} />
                                    {!isMobile && 'Linie'}
                                </ToggleButton>
                            )}
                            {chartSettings.enabledChartTypes.includes('bar') && (
                                <ToggleButton value="bar">
                                    <BarChartIcon sx={{ 
                                        mr: isMobile ? 0.5 : 0.5,
                                        fontSize: isMobile ? '1rem' : '1.2rem'
                                    }} />
                                    {!isMobile && 'Balken'}
                                </ToggleButton>
                            )}
                        </ToggleButtonGroup>
                    </Box>
                )}

                {chartSettings.enabledDataViews.length > 1 && (
                    <Box>
                        <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                                mb: 1,
                                fontSize: isMobile ? '0.75rem' : '0.875rem'
                            }}
                        >
                            Datenansicht:
                        </Typography>
                        <ToggleButtonGroup
                            value={dataView}
                            exclusive
                            onChange={handleDataViewChange}
                            size={isMobile ? "small" : "small"}
                            orientation={isMobile ? "vertical" : "horizontal"}
                            sx={{
                                flexDirection: isMobile ? 'column' : 'row',
                                width: isMobile ? '100%' : 'auto',
                                '& .MuiToggleButton-root': {
                                    minHeight: isMobile ? 44 : 'auto', // Touch-friendly
                                    px: isMobile ? 2 : 1.5,
                                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                                    width: isMobile ? '100%' : 'auto',
                                    justifyContent: isMobile ? 'center' : 'center'
                                }
                            }}
                        >
                            {chartSettings.enabledDataViews.includes('consumption') && (
                                <ToggleButton value="consumption">Verbrauch</ToggleButton>
                            )}
                            {chartSettings.enabledDataViews.includes('costPerKm') && (
                                <ToggleButton value="costPerKm">Kosten</ToggleButton>
                            )}
                            {chartSettings.enabledDataViews.includes('pricePerLiter') && (
                                <ToggleButton value="pricePerLiter">€/L</ToggleButton>
                            )}
                            {chartSettings.enabledDataViews.includes('mileage') && (
                                <ToggleButton value="mileage">KM-Stand</ToggleButton>
                            )}
                            {chartSettings.enabledDataViews.includes('price') && (
                                <ToggleButton value="price">Preis</ToggleButton>
                            )}
                            {chartSettings.enabledDataViews.includes('amount') && (
                                <ToggleButton value="amount">Menge</ToggleButton>
                            )}
                        </ToggleButtonGroup>
                    </Box>
                )}
            </Box>

            <Box sx={{ 
                width: '100%', 
                height: isMobile ? 360 : 500,
                mt: isMobile ? 1 : 0.5
            }}>
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart 
                            data={filteredChartData} 
                            margin={{ 
                                top: 5, 
                                right: isMobile ? 15 : 30, 
                                left: isMobile ? 15 : 20, 
                                bottom: isMobile ? 20 : 5 
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="dateFormatted" 
                                tick={{ fontSize: isMobile ? 9 : 12 }}
                                interval={isMobile ? 'preserveStartEnd' : 0}
                                angle={isMobile ? -45 : 0}
                                textAnchor={isMobile ? 'end' : 'middle'}
                                height={isMobile ? 60 : 40}
                            />
                            <YAxis 
                                tick={{ fontSize: isMobile ? 9 : 12 }}
                                label={{ 
                                    value: `${config.label} (${config.unit})`, 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    style: { fontSize: isMobile ? 9 : 12 }
                                }}
                                width={isMobile ? 40 : 60}
                            />
                            <Tooltip 
                                content={customTooltip}
                                cursor={{ strokeDasharray: '3 3' }}
                                wrapperStyle={{ 
                                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                                    zIndex: 1000
                                }}
                            />
                            <Legend 
                                wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey={dataView} 
                                stroke={config.color} 
                                strokeWidth={isMobile ? 2.5 : 2}
                                dot={{ 
                                    fill: config.color, 
                                    strokeWidth: 2, 
                                    r: isMobile ? 5 : 4  // Larger touch targets on mobile
                                }}
                                activeDot={{ 
                                    r: isMobile ? 8 : 6,  // Larger active touch targets
                                    strokeWidth: 2,
                                    stroke: config.color
                                }}
                                connectNulls={false}
                                name={config.label}
                            />
                            {averageValue !== null && (
                                <ReferenceLine 
                                    y={averageValue} 
                                    stroke={chartColors.average}
                                    strokeDasharray="8 8"
                                    strokeWidth={2}
                                    label={{
                                        value: dataView === 'mileage' 
                                            ? getMileageAverageLabel()
                                            : `Ø ${averageValue.toFixed(2)} ${config.unit}`,
                                        position: "top",
                                        style: { fontSize: isMobile ? 9 : 12, fill: chartColors.average, fontWeight: "bold" }
                                    }}
                                />
                            )}
                        </LineChart>
                    ) : (
                        <BarChart 
                            data={filteredChartData} 
                            margin={{ 
                                top: 5, 
                                right: isMobile ? 15 : 30, 
                                left: isMobile ? 15 : 20, 
                                bottom: isMobile ? 20 : 5 
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="dateFormatted" 
                                tick={{ fontSize: isMobile ? 9 : 12 }}
                                interval={isMobile ? 'preserveStartEnd' : 0}
                                angle={isMobile ? -45 : 0}
                                textAnchor={isMobile ? 'end' : 'middle'}
                                height={isMobile ? 60 : 40}
                            />
                            <YAxis 
                                tick={{ fontSize: isMobile ? 9 : 12 }}
                                label={{ 
                                    value: `${config.label} (${config.unit})`, 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    style: { fontSize: isMobile ? 9 : 12 }
                                }}
                                width={isMobile ? 40 : 60}
                            />
                            <Tooltip 
                                content={customTooltip}
                                cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                wrapperStyle={{ 
                                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                                    zIndex: 1000
                                }}
                            />
                            <Legend 
                                wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                            />
                            <Bar 
                                dataKey={dataView} 
                                fill={config.color}
                                name={config.label}
                                radius={isMobile ? [2, 2, 0, 0] : [0, 0, 0, 0]} // Rounded corners on mobile
                            />
                            {averageValue !== null && (
                                <ReferenceLine 
                                    y={averageValue} 
                                    stroke={chartColors.average}
                                    strokeDasharray="8 8"
                                    strokeWidth={2}
                                    label={{
                                        value: dataView === 'mileage' 
                                            ? getMileageAverageLabel()
                                            : `Ø ${averageValue.toFixed(2)} ${config.unit}`,
                                        position: "top",
                                        style: { fontSize: isMobile ? 9 : 12, fill: chartColors.average, fontWeight: "bold" }
                                    }}
                                />
                            )}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </Box>

            <Box sx={{ 
                mt: 2, 
                display: 'flex', 
                justifyContent: 'center', 
                flexWrap: 'wrap', 
                gap: isMobile ? 1 : 2,
                px: isMobile ? 1 : 0
            }}>
                <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        textAlign: 'center',
                        lineHeight: 1.4
                    }}
                >
                    📊 {filteredRefuelings.length} Tankungen im gewählten Zeitraum
                    {filteredChartData.length > 0 && (
                        <>
                            {isMobile ? <br /> : ' • '}Zeitraum: {dayjs(filteredChartData[0].date).format('DD.MM.YYYY')} - {dayjs(filteredChartData[filteredChartData.length - 1].date).format('DD.MM.YYYY')}
                        </>
                    )}
                    {averageValue !== null && (
                        <>
                            {isMobile ? <br /> : ' • '}Ø {config.label}: {averageValue.toFixed(2)} {config.unit}
                        </>
                    )}
                </Typography>
            </Box>
        </Paper>
    );
}
