// Theme Configuration - Zentrale Konfiguration für das Pistonary Theme
// Hier können Sie einfach Farben und Styles anpassen

export const themeConfig = {
  // Primäre Brand Colors
  colors: {
    primary: '#2196f3',      // Hauptblau - primäre Aktionen, Links
    secondary: '#ff9800',    // Orange - Akzente, sekundäre Aktionen  
    success: '#4caf50',      // Grün - Erfolg, positive Werte
    warning: '#ff6b35',      // Rot-Orange - Warnungen, Durchschnittswerte
    error: '#f44336',        // Rot - Fehler, Löschaktionen
    info: '#2196f3',         // Info-Blau - Informationen
    
    // Chart-spezifische Farben
    chart: {
      consumption: '#9c27b0',    // Lila - Verbrauch
      amount: '#2196f3',         // Blau - Menge
      price: '#4caf50',          // Grün - Preis
      mileage: '#ff9800',        // Orange - Kilometerstand
      pricePerLiter: '#e91e63',  // Pink - Preis pro Liter
      average: '#ff6b35',        // Orange - Durchschnittslinien
    }
  },

  // Typografie
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    buttonTextTransform: 'none', // 'none' | 'capitalize' | 'uppercase' | 'lowercase'
    
    // Font Weights
    fontWeights: {
      light: 300,
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700,
    }
  },

  // Layout & Spacing
  layout: {
    borderRadius: 8,           // Standard Border Radius
    cardBorderRadius: 12,      // Cards/Papers Border Radius
    dialogBorderRadius: 16,    // Dialog Border Radius
    spacing: 8,                // Base spacing unit (8px)
  },

  // Animations & Transitions
  animations: {
    hoverTransition: 'all 0.2s ease-in-out',
    buttonHoverTransform: 'translateY(-1px)',
    buttonHoverShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },

  // Dark Mode Konfiguration
  darkMode: {
    background: {
      default: '#121212',      // App Hintergrund
      paper: '#1e1e1e',        // Card/Paper Hintergrund
      elevated: '#2d2d2d',     // Erhöhte Elemente
    },
    text: {
      primary: '#ffffff',      // Haupttext
      secondary: '#b0b0b0',    // Sekundärtext
      disabled: '#666666',     // Deaktivierter Text
    },
    borders: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.2)',
      strong: 'rgba(255, 255, 255, 0.3)',
    }
  },

  // Responsive Breakpoints (Material-UI Standard)
  breakpoints: {
    xs: 0,      // Extra small devices
    sm: 600,    // Small devices  
    md: 900,    // Medium devices
    lg: 1200,   // Large devices
    xl: 1536,   // Extra large devices
  }
};

export default themeConfig;
