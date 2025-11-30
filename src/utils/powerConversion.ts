// Umrechnungen zwischen PS und kW
export const PS_TO_KW_FACTOR = 0.73549875;
export const KW_TO_PS_FACTOR = 1.35962;

export const PowerUnit = {
  PS: 'PS',
  KW: 'kW'
} as const;

export type PowerUnitType = 'PS' | 'kW';

export const convertPsToKw = (ps: number): number => {
  return Math.round(ps * PS_TO_KW_FACTOR); // auf ganze Zahlen runden
};

export const convertKwToPs = (kw: number): number => {
  return Math.round(kw * KW_TO_PS_FACTOR);
};

export const formatPowerValue = (value: number, unit: PowerUnitType): string => {
  if (unit === 'kW') {
    return `${Math.round(value)} kW / ${convertKwToPs(value)} PS`;
  } else {
    return `${Math.round(value)} PS / ${convertPsToKw(value)} kW`;
  }
};

export const convertPowerValue = (value: number, fromUnit: PowerUnitType, toUnit: PowerUnitType): number => {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'PS' && toUnit === 'kW') {
    return convertPsToKw(value);
  } else if (fromUnit === 'kW' && toUnit === 'PS') {
    return convertKwToPs(value);
  }
  
  return value;
};