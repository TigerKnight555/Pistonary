import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { MaintenanceProvider } from './contexts/MaintenanceContext';
import { pistonaryTheme } from './theme/theme';
import './index.css';

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <MaintenanceProvider>
          <ThemeProvider theme={pistonaryTheme}>
            <CssBaseline />
            <AppRouter />
          </ThemeProvider>
        </MaintenanceProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
