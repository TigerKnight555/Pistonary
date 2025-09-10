import { useMemo } from 'react';
import { createTheme, type Theme } from '@mui/material/styles';
import { useColorExtraction } from './useColorExtraction';
import { generateContrastColors } from '../utils/colorContrast';
import { useSettings } from '../contexts/SettingsContext';

interface SimpleThemeOptions {
  imageUrl?: string | null;
  baseTheme: Theme;
}

export const useSimpleDynamicTheme = ({ imageUrl, baseTheme }: SimpleThemeOptions) => {
  const { isAutoColorEnabled, isDarkMode, manualColors } = useSettings();
  const { colors, isLoading } = useColorExtraction(isAutoColorEnabled ? imageUrl || null : null);

  const enhancedTheme = useMemo(() => {
    // Erstelle das Base-Theme basierend auf der Dark Mode Einstellung
    const currentBaseTheme = createTheme({
      ...baseTheme,
      palette: {
        ...baseTheme.palette,
        mode: isDarkMode ? 'dark' : 'light',
      },
    });

    // Bestimme welche Farben verwendet werden sollen
    let activeColors = null;
    
    // Priorisierung: Manuelle Farben > Auto-extrahierte Farben
    if (manualColors) {
      activeColors = manualColors;
    } else if (colors && isAutoColorEnabled) {
      activeColors = colors;
    }

    // Wenn keine Farben verfügbar sind, verwende das ursprüngliche Theme
    if (!activeColors) {
      return currentBaseTheme;
    }

    // Generiere kontrastoptimierte Farben
    const primaryContrast = generateContrastColors(activeColors.primary);
    const secondaryContrast = generateContrastColors(activeColors.secondary);
    const accentContrast = generateContrastColors(activeColors.accent);

    // Erweitere nur die Farben, behalte alles andere bei
    return createTheme({
      ...currentBaseTheme,
      palette: {
        ...currentBaseTheme.palette,
        primary: {
          main: primaryContrast.onWhite,              // Sehr hoher Kontrast (8:1)
          light: primaryContrast.lowContrast + '40',   // Weniger Transparenz für mehr Sichtbarkeit
          dark: primaryContrast.ultraHighContrast,     // Ultra-aggressive Kontrast
          contrastText: primaryContrast.onPrimary,
        },
        secondary: {
          main: secondaryContrast.onWhite,
          light: secondaryContrast.lowContrast + '40',
          dark: secondaryContrast.ultraHighContrast,
          contrastText: secondaryContrast.onPrimary,
        },
      },
      components: {
        ...currentBaseTheme.components,
        MuiButton: {
          ...currentBaseTheme.components?.MuiButton,
          styleOverrides: {
            ...currentBaseTheme.components?.MuiButton?.styleOverrides,
            contained: {
              background: `linear-gradient(135deg, ${primaryContrast.onWhite}, ${accentContrast.onWhite})`,
              color: primaryContrast.onPrimary,
              fontWeight: 700, // Noch fettere Schrift
              fontSize: '1.05rem', // Etwas größere Schrift
              '&:hover': {
                background: `linear-gradient(135deg, ${primaryContrast.ultraHighContrast}, ${accentContrast.ultraHighContrast})`,
                boxShadow: `0 4px 12px ${primaryContrast.onWhite}60`,
                transform: 'translateY(-1px)', // Leichter Hover-Effekt
              },
            },
            outlined: {
              borderColor: primaryContrast.onWhite,
              color: primaryContrast.onWhite,
              borderWidth: '2px', // Dickere Umrandung
              fontWeight: 700,    // Fettere Schrift
              fontSize: '1.05rem', // Größere Schrift
              '&:hover': {
                borderColor: primaryContrast.ultraHighContrast,
                backgroundColor: primaryContrast.onWhite + '20', // Stärkerer Hintergrund
                color: primaryContrast.ultraHighContrast,
                borderWidth: '2px',
                transform: 'translateY(-1px)',
              },
            },
          },
        },
        MuiChip: {
          ...baseTheme.components?.MuiChip,
          styleOverrides: {
            ...baseTheme.components?.MuiChip?.styleOverrides,
            root: {
              backgroundColor: primaryContrast.onWhite + '25', // Noch stärkerer Hintergrund
              color: primaryContrast.ultraHighContrast,        // Ultra-Hochkontrast Text
              fontWeight: 700,                                 // Sehr fette Schrift
              fontSize: '0.9rem',                              // Leicht größere Schrift
              border: `2px solid ${primaryContrast.onWhite}40`, // Dickere, sichtbarere Umrandung
            },
            outlined: {
              borderColor: primaryContrast.onWhite,
              color: primaryContrast.onWhite,
              borderWidth: '2px',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: primaryContrast.onWhite + '20',
                borderColor: primaryContrast.ultraHighContrast,
                color: primaryContrast.ultraHighContrast,
                borderWidth: '2px',
              },
            },
          },
        },
        MuiIconButton: {
          ...baseTheme.components?.MuiIconButton,
          styleOverrides: {
            ...baseTheme.components?.MuiIconButton?.styleOverrides,
            root: {
              '&:hover': {
                backgroundColor: primaryContrast.onWhite + '10',
              },
            },
          },
        },
        MuiToggleButton: {
          ...baseTheme.components?.MuiToggleButton,
          styleOverrides: {
            ...baseTheme.components?.MuiToggleButton?.styleOverrides,
            root: {
              border: `2px solid ${primaryContrast.onWhite}`, // Dickere Umrandung
              color: primaryContrast.onWhite,
              fontWeight: 700,    // Sehr fette Schrift
              fontSize: '0.95rem', // Größere Schrift
              '&.Mui-selected': {
                backgroundColor: primaryContrast.onWhite,
                color: primaryContrast.onPrimary,
                fontWeight: 800,    // Extrem fette Schrift für Auswahl
                border: `3px solid ${primaryContrast.onWhite}`, // Noch dickere Umrandung
                '&:hover': {
                  backgroundColor: primaryContrast.ultraHighContrast,
                },
              },
              '&:hover': {
                backgroundColor: primaryContrast.onWhite + '20', // Stärkerer Hover
                borderColor: primaryContrast.ultraHighContrast,
                color: primaryContrast.ultraHighContrast,
                borderWidth: '2px',
              },
            },
          },
        },
      },
    });
  }, [colors, baseTheme, isAutoColorEnabled, isDarkMode, manualColors]);

  return {
    theme: enhancedTheme,
    extractedColors: colors,
    manualColors: manualColors,
    activeColors: manualColors || colors,
    isLoadingColors: isLoading,
  };
};
