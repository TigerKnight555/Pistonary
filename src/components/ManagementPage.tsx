import { useState, useEffect } from 'react';
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
import BuildIcon from '@mui/icons-material/Build';
import RefuelingsManagement from './RefuelingsManagement';
import MaintenanceManagement from './MaintenanceManagement';
import { useAuth } from '../contexts/AuthContext';
import type { MaintenanceType } from '../database/entities/Maintenance';

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
                <Box sx={{ py: 2 }}>
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
    const [selectedCategories, setSelectedCategories] = useState<MaintenanceType[]>([]);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { selectedCarId } = useAuth();

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    // Lade die ausgewählten Wartungskategorien aus localStorage
    useEffect(() => {
        if (selectedCarId) {
            const saved = localStorage.getItem(`maintenance-categories-${selectedCarId}`);
            if (saved) {
                setSelectedCategories(JSON.parse(saved));
            }
        }
    }, [selectedCarId]);

    return (
        <Container 
            maxWidth={false}
            sx={{ 
                mt: isMobile ? 0.5 : 2, 
                mb: isMobile ? 0.5 : 2,
                px: isMobile ? 0.5 : 2,
                width: isMobile ? '100%' : 'auto',
                maxWidth: isMobile ? '100vw' : '900px',
                margin: '0 auto'
            }}
        >
            <Paper sx={{ 
                p: isMobile ? 1 : 2,
                mx: 0,
                width: '100%',
                borderRadius: isMobile ? 0 : 1,
                boxShadow: isMobile ? 'none' : 1
            }}>
                <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    component="h1" 
                    gutterBottom
                    sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}
                >
                    Daten verwalten
                </Typography>
                <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                        mb: isMobile ? 1.5 : 2,
                        fontSize: isMobile ? '0.8rem' : '0.9rem'
                    }}
                >
                    Hier können Sie alle Ihre Tankungen und Wartungen einsehen und bearbeiten.
                </Typography>

                <Box sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    mx: isMobile ? 0 : 0 
                }}>
                    <Tabs 
                        value={activeTab} 
                        onChange={handleTabChange} 
                        aria-label="Management Tabs"
                        variant={isMobile ? "fullWidth" : "standard"}
                        scrollButtons={isMobile ? "auto" : false}
                        sx={{
                            '& .MuiTab-root': {
                                minHeight: isMobile ? 64 : 48,
                                fontSize: isMobile ? '0.8rem' : '0.875rem',
                                px: isMobile ? 1 : 2
                            }
                        }}
                    >
                        <Tab 
                            icon={<LocalGasStationIcon />} 
                            label="Tankungen" 
                            {...a11yProps(0)}
                            iconPosition={isMobile ? "top" : "start"}
                        />
                        <Tab 
                            icon={<BuildIcon />} 
                            label="Wartungen" 
                            {...a11yProps(1)}
                            iconPosition={isMobile ? "top" : "start"}
                        />
                    </Tabs>
                </Box>

                <TabPanel value={activeTab} index={0}>
                    <RefuelingsManagement />
                </TabPanel>
                <TabPanel value={activeTab} index={1}>
                    <MaintenanceManagement selectedCategories={selectedCategories} />
                </TabPanel>
            </Paper>
        </Container>
    );
}