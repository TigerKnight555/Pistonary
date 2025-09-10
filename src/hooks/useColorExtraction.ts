import { useState, useEffect } from 'react';
import ColorThief from 'colorthief';

interface ExtractedColors {
  primary: string;
  secondary: string;
  accent: string;
}

export const useColorExtraction = (imageUrl: string | null) => {
  const [colors, setColors] = useState<ExtractedColors | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const adjustBrightness = (color: [number, number, number], factor: number): [number, number, number] => {
    return [
      Math.min(255, Math.max(0, Math.round(color[0] * factor))),
      Math.min(255, Math.max(0, Math.round(color[1] * factor))),
      Math.min(255, Math.max(0, Math.round(color[2] * factor)))
    ];
  };

  const ensureContrast = (color: [number, number, number]): [number, number, number] => {
    // Berechne Helligkeit (Luminanz)
    const luminance = (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255;
    
    // Wenn zu hell, dunkler machen
    if (luminance > 0.8) {
      return adjustBrightness(color, 0.6);
    }
    
    // Wenn zu dunkel, heller machen  
    if (luminance < 0.2) {
      return adjustBrightness(color, 1.8);
    }
    
    return color;
  };

  const isGrayish = (color: [number, number, number]): boolean => {
    const [r, g, b] = color;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    
    // Niedrige Sättigung = grau/neutral
    return saturation < 0.2;
  };

  const filterCarColors = (palette: [number, number, number][]): [number, number, number][] => {
    // Filtere sehr helle, sehr dunkle und graue Farben heraus
    return palette.filter(color => {
      const [r, g, b] = color;
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Entferne sehr helle Farben (Himmel, Reflexionen) - weniger strikt
      if (luminance > 0.85) return false;
      
      // Entferne sehr dunkle Farben (Schatten, Reifen) - weniger strikt
      if (luminance < 0.15) return false;
      
      // Entferne graue/neutrale Farben (Straße, Hintergrund)
      if (isGrayish(color)) return false;
      
      // Entferne Farben mit sehr geringer Sättigung
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      if (saturation < 0.15) return false;
      
      return true;
    });
  };

  const findBestCarColor = (palette: [number, number, number][]): [number, number, number] => {
    // Priorisiere Farben, die typisch für Autos sind
    const colorScores = palette.map(color => {
      const [r, g, b] = color;
      let score = 0;
      
      // Bonus für gesättigte Farben (wichtigster Faktor)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      score += saturation * 150; // Höhere Gewichtung für Sättigung
      
      // Bonus für lebendige Farben
      const vibrance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
      score += vibrance * 0.3;
      
      // Bonus für typische Auto-Farben - erweitert
      const isRed = r > Math.max(g, b) && r > 80;
      const isBlue = b > Math.max(r, g) && b > 80;
      const isGreen = g > Math.max(r, b) && g > 80;
      const isYellow = r > 120 && g > 120 && b < 80;
      const isOrange = r > 120 && g > 60 && g < 150 && b < 80;
      const isPurple = r > 80 && b > 80 && g < Math.min(r, b);
      const isSilver = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && r > 100 && saturation > 0.1;
      
      if (isRed || isBlue || isGreen || isYellow || isOrange || isPurple) {
        score += 80;
      }
      if (isSilver) {
        score += 40; // Silber ist häufig bei Autos, aber weniger gewichtet
      }
      
      // Idealer Helligkeitsbereich für Auto-Farben
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (luminance > 0.25 && luminance < 0.75) {
        score += 60; // Mittlere Helligkeit bevorzugt
      } else if (luminance > 0.2 && luminance < 0.8) {
        score += 30; // Erweiterer akzeptabler Bereich
      }
      
      // Weniger Punkte für zu extreme Werte
      if (luminance < 0.2 || luminance > 0.8) {
        score -= 20;
      }
      
      return { color, score };
    });
    
    // Sortiere nach Score und gib die beste Farbe zurück
    colorScores.sort((a, b) => b.score - a.score);
    return colorScores[0]?.color || palette[0];
  };

  useEffect(() => {
    if (!imageUrl) {
      setColors(null);
      return;
    }

    const extractColors = async () => {
      setIsLoading(true);
      try {
        const colorThief = new ColorThief();
        const img = new Image();
        
        img.crossOrigin = 'Anonymous';
        
        img.onload = () => {
          try {
            // Erstelle ein Canvas zur Bildanalyse
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context not available');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Analysiere einen optimierten Bereich des Bildes (wo meist das Auto ist)
            // Fokussiere auf die obere Hälfte der Bildmitte (Karosserie, nicht Räder/Unterseite)
            const centerX = Math.floor(img.width * 0.25);
            const centerY = Math.floor(img.height * 0.2);  // Etwas höher beginnen
            const centerWidth = Math.floor(img.width * 0.5);  // Breiterer Bereich
            const centerHeight = Math.floor(img.height * 0.4); // Weniger Höhe (vermeidet Räder)
            
            // Erstelle ein neues Canvas nur mit dem zentralen Bereich
            const cropCanvas = document.createElement('canvas');
            const cropCtx = cropCanvas.getContext('2d');
            if (!cropCtx) throw new Error('Crop canvas context not available');
            
            cropCanvas.width = centerWidth;
            cropCanvas.height = centerHeight;
            cropCtx.drawImage(img, centerX, centerY, centerWidth, centerHeight, 0, 0, centerWidth, centerHeight);
            
            // Verwende das zugeschnittene Bild für die Farbanalyse
            const tempImg = new Image();
            tempImg.onload = () => {
              try {
                // Extrahiere mehr Farben für eine präzisere Analyse
                const palette = colorThief.getPalette(tempImg, 15);
                
                // Filtere irrelevante Farben heraus (Himmel, Straße, Schatten)
                const filteredPalette = filterCarColors(palette);
                
                // Finde die beste Auto-Farbe mit intelligentem Scoring
                const bestCarColor = filteredPalette.length > 0 ? 
                  findBestCarColor(filteredPalette) : 
                  findBestCarColor(palette);
                
                // Verwende die beste verfügbare Farbe als primäre Farbe
                const usablePalette = filteredPalette.length > 0 ? filteredPalette : palette;
                
                // Verarbeite Farben für bessere UI-Verwendung
                const primaryColor = ensureContrast(bestCarColor);
                const secondaryColor = usablePalette.length > 1 ? ensureContrast(usablePalette[1]) : adjustBrightness(primaryColor, 1.2);
                const accentColor = usablePalette.length > 2 ? ensureContrast(usablePalette[2]) : adjustBrightness(primaryColor, 0.8);

                setColors({
                  primary: rgbToHex(primaryColor[0], primaryColor[1], primaryColor[2]),
                  secondary: rgbToHex(secondaryColor[0], secondaryColor[1], secondaryColor[2]),
                  accent: rgbToHex(accentColor[0], accentColor[1], accentColor[2])
                });
              } catch (error) {
                console.error('Fehler beim Extrahieren der Farben:', error);
                setColors(null);
              } finally {
                setIsLoading(false);
              }
            };
            
            tempImg.src = cropCanvas.toDataURL();
          } catch (error) {
            console.error('Fehler beim Extrahieren der Farben:', error);
            setColors(null);
          } finally {
            setIsLoading(false);
          }
        };

        img.onerror = () => {
          console.error('Fehler beim Laden des Bildes für Farbextraktion');
          setColors(null);
          setIsLoading(false);
        };

        img.src = imageUrl;
        
      } catch (error) {
        console.error('Fehler bei der Farbextraktion:', error);
        setColors(null);
        setIsLoading(false);
      }
    };

    extractColors();
  }, [imageUrl]);

  return { colors, isLoading };
};
