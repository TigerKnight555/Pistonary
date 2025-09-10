import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { pistonaryTheme } from './theme/theme';
import './index.css';

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ThemeProvider theme={pistonaryTheme}>
          <CssBaseline />
          <AppRouter />
        </ThemeProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
