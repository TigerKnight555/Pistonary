import { createTheme } from '@mui/material/styles';
import { themeConfig } from './themeConfig';

// Brand Colors aus Konfiguration
const brandColors = {
  primary: {
    main: themeConfig.colors.primary,
    light: '#64b5f6',
    dark: '#1976d2',
    contrastText: '#ffffff'
  },
  secondary: {
    main: themeConfig.colors.secondary,
    light: '#ffb74d',
    dark: '#f57c00',
    contrastText: '#ffffff'
  },
  accent: {
    main: themeConfig.colors.success,
    light: '#81c784',
    dark: '#388e3c',
  },
  warning: {
    main: themeConfig.colors.warning,
    light: '#ff8a65',
    dark: '#d84315',
  }
};

// Custom Theme
export const pistonaryTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: brandColors.primary,
    secondary: brandColors.secondary,
    success: brandColors.accent,
    warning: brandColors.warning,
    background: {
      default: themeConfig.darkMode.background.default,
      paper: themeConfig.darkMode.background.paper,
    },
    text: {
      primary: themeConfig.darkMode.text.primary,
      secondary: themeConfig.darkMode.text.secondary,
    },
    divider: themeConfig.darkMode.borders.light,
  },
  
  typography: {
    fontFamily: themeConfig.typography.fontFamily,
    h1: {
      fontSize: '2.5rem',
      fontWeight: themeConfig.typography.fontWeights.semiBold,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: themeConfig.typography.fontWeights.semiBold,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: themeConfig.typography.fontWeights.semiBold,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: themeConfig.typography.fontWeights.semiBold,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: themeConfig.typography.fontWeights.semiBold,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: themeConfig.typography.fontWeights.semiBold,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: themeConfig.typography.fontWeights.semiBold,
      textTransform: themeConfig.typography.buttonTextTransform as any,
    },
  },

  shape: {
    borderRadius: themeConfig.layout.borderRadius,
  },

  spacing: themeConfig.layout.spacing,

  components: {
    // Button Styles
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: themeConfig.layout.borderRadius,
          padding: '10px 20px',
          fontWeight: themeConfig.typography.fontWeights.semiBold,
          '&:hover': {
            transform: themeConfig.animations.buttonHoverTransform,
            boxShadow: themeConfig.animations.buttonHoverShadow,
          },
          transition: themeConfig.animations.hoverTransition,
        },
        containedPrimary: {
          background: `linear-gradient(45deg, ${brandColors.primary.main} 30%, ${brandColors.primary.light} 90%)`,
          '&:hover': {
            background: `linear-gradient(45deg, ${brandColors.primary.dark} 30%, ${brandColors.primary.main} 90%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(45deg, ${brandColors.secondary.main} 30%, ${brandColors.secondary.light} 90%)`,
          '&:hover': {
            background: `linear-gradient(45deg, ${brandColors.secondary.dark} 30%, ${brandColors.secondary.main} 90%)`,
          },
        },
      },
    },

    // Paper/Card Styles
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: themeConfig.layout.cardBorderRadius,
          border: `1px solid ${themeConfig.darkMode.borders.light}`,
          '&:hover': {
            border: `1px solid ${themeConfig.darkMode.borders.medium}`,
          },
          transition: themeConfig.animations.hoverTransition,
        },
      },
    },


    // TextField Styles
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: brandColors.primary.light,
            },
            '&.Mui-focused fieldset': {
              borderColor: brandColors.primary.main,
              borderWidth: 2,
            },
          },
        },
      },
    },

    // DatePicker Input Styles (damit kein schwarzer Rand)
    MuiInputBase: {
      styleOverrides: {
        root: {
          '&.MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: brandColors.primary.light,
            },
            '&.Mui-focused fieldset': {
              borderColor: brandColors.primary.main,
              borderWidth: 2,
            },
          },
        },
      },
    },

    // Select and OutlinedInput Styles
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        root: {
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline, & .MuiInputBase-root .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline, &:hover .MuiInputBase-root .MuiOutlinedInput-notchedOutline': {
            borderColor: brandColors.primary.light,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline, &.Mui-focused .MuiInputBase-root .MuiOutlinedInput-notchedOutline': {
            borderColor: brandColors.primary.main,
            borderWidth: 2,
          },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: brandColors.primary.light,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: brandColors.primary.main,
            borderWidth: 2,
          },
        },
      },
    },

    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: brandColors.primary.light,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: brandColors.primary.main,
              borderWidth: 2,
            },
          },
        },
      },
    },

    // Toggle Button Styles
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: '#b0b0b0',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: brandColors.primary.light,
          },
          '&.Mui-selected': {
            backgroundColor: brandColors.primary.main,
            color: '#ffffff',
            border: `1px solid ${brandColors.primary.main}`,
            '&:hover': {
              backgroundColor: brandColors.primary.dark,
            },
          },
        },
      },
    },

    // Dialog Styles
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },

    // Alert Styles
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          border: `1px solid ${brandColors.accent.main}`,
          color: brandColors.accent.light,
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
          border: `1px solid ${brandColors.warning.main}`,
          color: brandColors.warning.light,
        },
        standardError: {
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          border: '1px solid #f44336',
          color: '#ff8a80',
        },
        standardInfo: {
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          border: `1px solid ${brandColors.primary.main}`,
          color: brandColors.primary.light,
        },
      },
    },

    // Chip Styles
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        filled: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
        },
      },
    },

    // App Bar Styles
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },

    // Drawer Styles
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1e1e1e',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },

    // List Item Styles
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },

    // Tab Styles
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 48,
          '&.Mui-selected': {
            color: brandColors.primary.main,
          },
        },
      },
    },

    // Table Styles
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
      },
    },
    
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
  },
});

// Chart Colors für Recharts
export const chartColors = {
  primary: themeConfig.colors.primary,
  secondary: themeConfig.colors.secondary,
  success: themeConfig.colors.success,
  warning: themeConfig.colors.warning,
  mileage: themeConfig.colors.chart.mileage,
  price: themeConfig.colors.chart.price,
  amount: themeConfig.colors.chart.amount,
  pricePerLiter: themeConfig.colors.chart.pricePerLiter,
  consumption: themeConfig.colors.chart.consumption,
  average: themeConfig.colors.chart.average,
};

export default pistonaryTheme;
