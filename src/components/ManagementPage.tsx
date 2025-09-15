import { useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    Tabs,
    Tab,
    Box,
    useTheme,
    useMediaQuery
} from '@mui/material';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import EventIcon from '@mui/icons-material/Event';
import BuildIcon from '@mui/icons-material/Build';
import RefuelingsManagement from './RefuelingsManagement';
import EventsManagement from './EventsManagement';
import MaintenanceManagement from './MaintenanceManagement';

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
            id={`management-tabpanel-${index}`}
            aria-labelledby={`management-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `management-tab-${index}`,
        'aria-controls': `management-tabpanel-${index}`,
    };
}

export default function ManagementPage() {
    const [activeTab, setActiveTab] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Daten verwalten
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Hier können Sie alle Ihre Tankungen, Ereignisse und Wartungen einsehen und bearbeiten.
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs 
                        value={activeTab} 
                        onChange={handleTabChange} 
                        aria-label="Management Tabs"
                        variant={isMobile ? "scrollable" : "standard"}
                        scrollButtons={isMobile ? "auto" : false}
                    >
                        <Tab 
                            icon={<LocalGasStationIcon />} 
                            label="Tankungen" 
                            {...a11yProps(0)}
                            iconPosition={isMobile ? "top" : "start"}
                        />
                        <Tab 
                            icon={<EventIcon />} 
                            label="Ereignisse" 
                            {...a11yProps(1)}
                            iconPosition={isMobile ? "top" : "start"}
                        />
                        <Tab 
                            icon={<BuildIcon />} 
                            label="Wartungen" 
                            {...a11yProps(2)}
                            iconPosition={isMobile ? "top" : "start"}
                        />
                    </Tabs>
                </Box>

                <TabPanel value={activeTab} index={0}>
                    <RefuelingsManagement />
                </TabPanel>
                <TabPanel value={activeTab} index={1}>
                    <EventsManagement />
                </TabPanel>
                <TabPanel value={activeTab} index={2}>
                    <MaintenanceManagement />
                </TabPanel>
            </Paper>
        </Container>
    );
}