export const calculateContrast = (color1: string, color2: string): number => {
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  
  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

export const adjustColorForContrast = (color: string, background: string = '#ffffff', targetContrast: number = 6.0): string => {
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const [r, g, b] = hexToRgb(color);
  const [bgR, bgG, bgB] = hexToRgb(background);
  
  const bgLuminance = getLuminance(bgR, bgG, bgB);
  const currentContrast = calculateContrast(color, background);
  
  // Wenn Kontrast bereits ausreichend ist, gib original zurück
  if (currentContrast >= targetContrast) {
    return color;
  }

  // Berechne welche Luminanz wir brauchen für den Zielkontrast
  let targetLuminance: number;
  
  if (bgLuminance > 0.5) {
    // Heller Hintergrund - Farbe muss dunkler werden
    targetLuminance = (bgLuminance + 0.05) / targetContrast - 0.05;
  } else {
    // Dunkler Hintergrund - Farbe muss heller werden
    targetLuminance = (bgLuminance + 0.05) * targetContrast - 0.05;
  }

  // Begrenze Luminanz auf gültige Werte
  targetLuminance = Math.max(0, Math.min(1, targetLuminance));

  // HSL-basierte Anpassung für bessere Farbtreue
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  if (delta === 0) {
    // Graue Farbe - einfache Helligkeitsanpassung
    const gray = Math.round(targetLuminance * 255);
    return rgbToHex(gray, gray, gray);
  }

  // Berechne Sättigung und Farbton
  const lightness = (max + min) / 2;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  
  // Neue Helligkeit basierend auf Ziel-Luminanz
  const newLightness = Math.sqrt(targetLuminance); // Quadratwurzel für bessere Verteilung
  
  // Konvertiere zurück zu RGB
  const c = (1 - Math.abs(2 * newLightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((max === r ? (g - b) / delta : max === g ? 2 + (r - b) / delta : 4 + (g - r) / delta) % 6) - 1));
  const m = newLightness - c / 2;

  let newR: number, newG: number, newB: number;
  
  if (max === r) {
    [newR, newG, newB] = [c + m, x + m, m];
  } else if (max === g) {
    [newR, newG, newB] = [x + m, c + m, m];
  } else {
    [newR, newG, newB] = [m, x + m, c + m];
  }

  // Konvertiere zu 0-255 Bereich
  newR = Math.round(Math.max(0, Math.min(255, newR * 255)));
  newG = Math.round(Math.max(0, Math.min(255, newG * 255)));
  newB = Math.round(Math.max(0, Math.min(255, newB * 255)));

  return rgbToHex(newR, newG, newB);
};

export const ensureContrast = (color: string, background: string = '#ffffff', minContrast: number = 6.0): string => {
  // Verwende die neue, präzisere Methode
  return adjustColorForContrast(color, background, minContrast);
};

export const createExtremeContrast = (color: string, background: string = '#ffffff'): string => {
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const [r, g, b] = hexToRgb(color);
  const [bgR, bgG, bgB] = hexToRgb(background);
  const bgLuminance = (0.299 * bgR + 0.587 * bgG + 0.114 * bgB) / 255;

  // Für helle Hintergründe: sehr dunkle, gesättigte Farbe
  if (bgLuminance > 0.5) {
    // Bestimme die dominante Farbe
    const max = Math.max(r, g, b);
    const isRed = r === max;
    const isGreen = g === max;
    const isBlue = b === max;
    
    // Erstelle eine sehr dunkle, aber erkennbare Version der Farbe
    if (isRed) {
      return '#8B0000'; // Dunkelrot
    } else if (isGreen) {
      return '#006400'; // Dunkelgrün
    } else if (isBlue) {
      return '#000080'; // Dunkelblau
    } else {
      // Für Mischfarben oder Grau
      const darkR = Math.min(60, Math.floor(r * 0.2));
      const darkG = Math.min(60, Math.floor(g * 0.2));
      const darkB = Math.min(60, Math.floor(b * 0.2));
      return rgbToHex(darkR, darkG, darkB);
    }
  } else {
    // Für dunkle Hintergründe: sehr helle Farbe
    return '#ffffff';
  }
};

export const createUltraHighContrast = (color: string, background: string = '#ffffff'): string => {
  const [r, g, b] = color.match(/\w\w/g)?.map(hex => parseInt(hex, 16)) || [0, 0, 0];
  const [bgR, bgG, bgB] = background.match(/\w\w/g)?.map(hex => parseInt(hex, 16)) || [255, 255, 255];
  
  const bgLuminance = (0.299 * bgR + 0.587 * bgG + 0.114 * bgB) / 255;
  
  if (bgLuminance > 0.5) {
    // Heller Hintergrund - extrem dunkle Farbe
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    if (max - min < 30) {
      // Geringe Sättigung - verwende reines Schwarz
      return '#000000';
    }
    
    // Behalte Farbton, aber mache extrem dunkel
    const ratio = 0.15; // Sehr dunkel
    const newR = Math.floor(r * ratio);
    const newG = Math.floor(g * ratio);
    const newB = Math.floor(b * ratio);
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  } else {
    return '#ffffff';
  }
};

export const generateContrastColors = (baseColor: string) => {
  const variations = {
    // Für weiße Hintergründe optimiert - SEHR hohe Kontraste
    onWhite: adjustColorForContrast(baseColor, '#ffffff', 8.0),      // Erhöht von 6.0
    onLight: adjustColorForContrast(baseColor, '#f5f5f5', 7.5),     // Erhöht von 5.5
    
    // Für farbige Hintergründe
    onPrimary: ensureContrast('#ffffff', baseColor, 8.0),            // Erhöht von 6.0
    onSecondary: ensureContrast('#000000', baseColor, 8.0),          // Erhöht von 6.0
    
    // Verschiedene Kontraststufen mit sehr hohen Werten
    ultraHighContrast: createUltraHighContrast(baseColor, '#ffffff'),       // Neue ultra-aggressive Funktion
    extremeContrast: createExtremeContrast(baseColor, '#ffffff'),
    veryHighContrast: adjustColorForContrast(baseColor, '#ffffff', 10.0),   // Erhöht von 7.5
    highContrast: adjustColorForContrast(baseColor, '#ffffff', 9.0),        // Erhöht von 8.0
    mediumContrast: adjustColorForContrast(baseColor, '#ffffff', 8.0),      // Erhöht von 6.5
    standardContrast: adjustColorForContrast(baseColor, '#ffffff', 7.0),    // Erhöht von 5.0
    lowContrast: adjustColorForContrast(baseColor, '#ffffff', 6.0),         // Erhöht von 4.5
    subtleContrast: adjustColorForContrast(baseColor, '#ffffff', 5.0),      // Erhöht von 3.5
  };

  return variations;
};

export const increaseBrightnessForContrast = (color: string, background: string = '#ffffff', minIncrease: number = 0.2): string => {
  const currentContrast = calculateContrast(color, background);
  
  // Wenn der Kontrast bereits hoch ist, gib die Originalfarbe zurück
  if (currentContrast >= 7.0) {
    return color;
  }
  
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const [r, g, b] = hexToRgb(color);
  const [bgR, bgG, bgB] = hexToRgb(background);
  const bgLuminance = (0.299 * bgR + 0.587 * bgG + 0.114 * bgB) / 255;
  
  // Bestimme Anpassungsrichtung
  const shouldDarken = bgLuminance > 0.5;
  const adjustmentFactor = shouldDarken ? (1 - minIncrease) : (1 + minIncrease);
  
  // Wende Anpassung an, aber behalte Sättigung bei
  const newR = Math.round(Math.max(0, Math.min(255, r * adjustmentFactor)));
  const newG = Math.round(Math.max(0, Math.min(255, g * adjustmentFactor)));
  const newB = Math.round(Math.max(0, Math.min(255, b * adjustmentFactor)));
  
  const adjustedColor = rgbToHex(newR, newG, newB);
  const newContrast = calculateContrast(adjustedColor, background);
  
  // Wenn die Anpassung den Kontrast verbessert hat, verwende sie
  return newContrast > currentContrast ? adjustedColor : color;
};
