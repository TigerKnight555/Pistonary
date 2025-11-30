import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMemo } from 'react';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { MaintenanceProvider } from './contexts/MaintenanceContext';
import { createPistonaryTheme } from './theme/theme';
import './index.css';

// Innere Komponente, die Zugriff auf SettingsContext hat
function AppContent() {
  const { manualColors, isDarkMode } = useSettings();

  // Theme dynamisch erstellen basierend auf manuellen Farben und Dark Mode
  const theme = useMemo(() => {
    return createPistonaryTheme(manualColors || undefined, isDarkMode);
  }, [manualColors, isDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <MaintenanceProvider>
          <AppContent />
        </MaintenanceProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
