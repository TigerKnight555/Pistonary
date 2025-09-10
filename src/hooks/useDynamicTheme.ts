import { useMemo } from 'react';
import { createTheme, type Theme } from '@mui/material/styles';
import { useColorExtraction } from './useColorExtraction';
import { themeConfig } from '../theme/themeConfig';

interface DynamicThemeOptions {
  imageUrl?: string | null;
  fallbackTheme?: Theme;
}

export const useDynamicTheme = ({ imageUrl, fallbackTheme }: DynamicThemeOptions) => {
  const { colors, isLoading } = useColorExtraction(imageUrl || null);

  const dynamicTheme = useMemo(() => {
    // Wenn keine Farben extrahiert wurden, verwende Fallback
    if (!colors) {
      return fallbackTheme;
    }

    return createTheme({
      palette: {
        mode: 'light',
        primary: {
          main: colors.primary,
          light: colors.primary + '20', // 20% Transparenz
          dark: colors.accent,
        },
        secondary: {
          main: colors.secondary,
          light: colors.secondary + '30',
          dark: colors.secondary,
        },
        // Behalte die ursprünglichen weißen Hintergründe bei
        background: {
          default: '#fafafa',
          paper: '#ffffff',
        },
        text: {
          primary: 'rgba(0, 0, 0, 0.87)',
          secondary: 'rgba(0, 0, 0, 0.6)',
        },
      },
      typography: themeConfig.typography,
      shape: {
        borderRadius: themeConfig.layout.borderRadius,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: themeConfig.layout.borderRadius,
              fontWeight: 600,
              padding: '8px 24px',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${colors.primary}40`,
                transform: 'translateY(-1px)',
              },
              transition: themeConfig.animations.hoverTransition,
            },
            contained: {
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
              },
            },
            outlined: {
              borderColor: colors.primary,
              color: colors.primary,
              '&:hover': {
                borderColor: colors.accent,
                backgroundColor: colors.primary + '10',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              // Behalte weiße Hintergründe bei, ändere nur Schatten und Hover-Effekte
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              borderRadius: themeConfig.layout.borderRadius,
              '&:hover': {
                boxShadow: `0 4px 16px ${colors.primary}20`,
              },
              transition: themeConfig.animations.hoverTransition,
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              backgroundColor: colors.primary + '15',
              color: colors.accent,
              fontWeight: 500,
            },
            outlined: {
              borderColor: colors.primary,
              color: colors.primary,
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              '&:hover': {
                backgroundColor: colors.primary + '10',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              // Behalte weiße Card-Hintergründe bei
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: themeConfig.layout.borderRadius,
              '&:hover': {
                boxShadow: `0 6px 20px ${colors.primary}25`,
                transform: 'translateY(-2px)',
              },
              transition: themeConfig.animations.hoverTransition,
            },
          },
        },
        MuiToggleButton: {
          styleOverrides: {
            root: {
              border: `1px solid ${colors.primary}40`,
              color: colors.primary,
              '&.Mui-selected': {
                backgroundColor: colors.primary,
                color: 'white',
                '&:hover': {
                  backgroundColor: colors.accent,
                },
              },
              '&:hover': {
                backgroundColor: colors.primary + '10',
              },
            },
          },
        },
      },
    });
  }, [colors, fallbackTheme]);

  return {
    theme: dynamicTheme,
    extractedColors: colors,
    isLoadingColors: isLoading,
  };
};
