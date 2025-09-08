import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Paper, Typography, Tabs, Tab } from '@mui/material';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import type { Car } from '../database/entities/Car';
import { API_BASE_URL } from '../config/api';
import CarRefuelings from './CarRefuelings';
import CarSettings from './CarSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`car-tabpanel-${index}`}
      aria-labelledby={`car-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function CarProfile() {
  const { carId } = useParams<{ carId: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const fetchCar = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/${carId}`);
      if (!response.ok) throw new Error('Fahrzeug konnte nicht geladen werden');
      const data = await response.json();
      setCar(data);
    } catch (error) {
      console.error('Error fetching car:', error);
    }
  };

  useEffect(() => {
    if (carId) {
      fetchCar();
    }
  }, [carId]);

  if (!car) {
    return <Typography>Lädt...</Typography>;
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label="car profile tabs"
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Übersicht" 
              id="car-tab-0"
              aria-controls="car-tabpanel-0"
            />
            <Tab 
              icon={<LocalGasStationIcon />} 
              label="Betankungen" 
              id="car-tab-1"
              aria-controls="car-tabpanel-1"
            />
            <Tab 
              icon={<SettingsIcon />} 
              label="Einstellungen" 
              id="car-tab-2"
              aria-controls="car-tabpanel-2"
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>Fahrzeugdetails</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Hersteller</Typography>
              <Typography>{car.manufacturer}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Modell</Typography>
              <Typography>{car.model}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Baujahr</Typography>
              <Typography>{car.year}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Kennzeichen</Typography>
              <Typography>{car.licensePlate}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Leistung</Typography>
              <Typography>{car.power} PS</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Getriebe</Typography>
              <Typography>{car.transmission}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Kraftstoff</Typography>
              <Typography>{car.fuel}</Typography>
            </Box>
            {car.engineSize && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Hubraum</Typography>
                <Typography>{car.engineSize} ccm</Typography>
              </Box>
            )}
            {car.notes && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="subtitle2" color="text.secondary">Notizen</Typography>
                <Typography>{car.notes}</Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <CarRefuelings />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <CarSettings />
        </TabPanel>
      </Paper>
    </Container>
  );
}
