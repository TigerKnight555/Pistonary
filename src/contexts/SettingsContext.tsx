import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';

interface SettingsContextType {
  isDarkMode: boolean;
  isAutoColorEnabled: boolean;
  manualColors: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
  setDarkMode: (enabled: boolean) => void;
  setAutoColorEnabled: (enabled: boolean) => void;
  toggleDarkMode: () => void;
  toggleAutoColor: () => void;
  setManualColors: (colors: { primary: string; secondary: string; accent: string } | null) => void;
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

  useEffect(() => {
    localStorage.setItem('pistonary_darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('pistonary_autoColor', JSON.stringify(isAutoColorEnabled));
  }, [isAutoColorEnabled]);

  useEffect(() => {
    localStorage.setItem('pistonary_manualColors', JSON.stringify(manualColors));
  }, [manualColors]);

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

  const value: SettingsContextType = {
    isDarkMode,
    isAutoColorEnabled,
    manualColors,
    setDarkMode,
    setAutoColorEnabled,
    toggleDarkMode,
    toggleAutoColor,
    setManualColors,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
