import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';

// Chart-Konfiguration Types
export type DataView = 'amount' | 'price' | 'mileage' | 'pricePerLiter' | 'consumption' | 'costPerKm';
export type ChartType = 'line' | 'bar';

export interface ChartSettings {
  enabledDataViews: DataView[];
  enabledChartTypes: ChartType[];
}

interface SettingsContextType {
  isDarkMode: boolean;
  isAutoColorEnabled: boolean;
  manualColors: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
  chartSettings: ChartSettings;
  setDarkMode: (enabled: boolean) => void;
  setAutoColorEnabled: (enabled: boolean) => void;
  toggleDarkMode: () => void;
  toggleAutoColor: () => void;
  setManualColors: (colors: { primary: string; secondary: string; accent: string } | null) => void;
  setChartSettings: (settings: ChartSettings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pistonary_darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [isAutoColorEnabled, setIsAutoColorEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('pistonary_autoColor');
    return saved ? JSON.parse(saved) : true; // Standard: aktiviert
  });

  const [manualColors, setManualColorsState] = useState<{
    primary: string;
    secondary: string;
    accent: string;
  } | null>(() => {
    const saved = localStorage.getItem('pistonary_manualColors');
    return saved ? JSON.parse(saved) : null;
  });

  const [chartSettings, setChartSettingsState] = useState<ChartSettings>(() => {
    const saved = localStorage.getItem('pistonary_chartSettings');
    return saved ? JSON.parse(saved) : {
      enabledDataViews: ['consumption', 'costPerKm', 'pricePerLiter', 'mileage', 'price', 'amount'],
      enabledChartTypes: ['line', 'bar']
    };
  });

  useEffect(() => {
    localStorage.setItem('pistonary_darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('pistonary_autoColor', JSON.stringify(isAutoColorEnabled));
  }, [isAutoColorEnabled]);

  useEffect(() => {
    localStorage.setItem('pistonary_manualColors', JSON.stringify(manualColors));
  }, [manualColors]);

  useEffect(() => {
    localStorage.setItem('pistonary_chartSettings', JSON.stringify(chartSettings));
  }, [chartSettings]);

  const setDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
  };

  const setAutoColorEnabled = (enabled: boolean) => {
    setIsAutoColorEnabledState(enabled);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const toggleAutoColor = () => {
    setIsAutoColorEnabledState(prev => !prev);
  };

  const setManualColors = (colors: { primary: string; secondary: string; accent: string } | null) => {
    setManualColorsState(colors);
  };

  const setChartSettings = (settings: ChartSettings) => {
    setChartSettingsState(settings);
  };

  const value: SettingsContextType = {
    isDarkMode,
    isAutoColorEnabled,
    manualColors,
    chartSettings,
    setDarkMode,
    setAutoColorEnabled,
    toggleDarkMode,
    toggleAutoColor,
    setManualColors,
    setChartSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
