// Umrechnungen zwischen Kilometern und Meilen
export const KM_TO_MILES_FACTOR = 0.621371;
export const MILES_TO_KM_FACTOR = 1.60934;

export const DistanceUnit = {
  KM: 'km',
  MILES: 'mi'
} as const;

export type DistanceUnitType = 'km' | 'mi';

export const convertKmToMiles = (km: number): number => {
  return Math.round(km * KM_TO_MILES_FACTOR);
};

export const convertMilesToKm = (miles: number): number => {
  return Math.round(miles * MILES_TO_KM_FACTOR);
};

export const formatDistanceValue = (value: number, unit: DistanceUnitType): string => {
  if (unit === 'mi') {
    return `${value} mi / ${convertMilesToKm(value)} km`;
  } else {
    return `${value} km / ${convertKmToMiles(value)} mi`;
  }
};

export const convertDistanceValue = (value: number, fromUnit: DistanceUnitType, toUnit: DistanceUnitType): number => {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'km' && toUnit === 'mi') {
    return convertKmToMiles(value);
  } else if (fromUnit === 'mi' && toUnit === 'km') {
    return convertMilesToKm(value);
  }
  
  return value;
};