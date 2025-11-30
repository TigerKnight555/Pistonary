# Pistonary Theme System

## Übersicht

Das Pistonary Theme System bietet ein umfassendes, konsistentes Design für die gesamte Anwendung. Es basiert auf Material-UI und bietet zentrale Konfiguration für Farben, Typografie, Layouts und Animationen.

## Struktur

```
src/theme/
├── theme.ts          # Haupt-Theme-Definition (Material-UI)
├── themeConfig.ts    # Zentrale Konfiguration 
└── README.md         # Diese Dokumentation
```

## Verwendung

### 1. Theme ist automatisch aktiv
Das Theme wird automatisch auf alle Komponenten angewendet, die Material-UI verwenden.

### 2. Theme-Farben in Komponenten verwenden
```typescript
import { useTheme } from '@mui/material/styles';

const theme = useTheme();
// theme.palette.primary.main
// theme.palette.secondary.main
```

### 3. Chart-Farben verwenden
```typescript
import { chartColors } from '../theme/theme';

// chartColors.consumption
// chartColors.average
// chartColors.price
```

## Anpassungen

### Farben ändern
Bearbeiten Sie `src/theme/themeConfig.ts`:

```typescript
colors: {
  primary: '#2196f3',      // Neue Primärfarbe
  secondary: '#ff9800',    // Neue Sekundärfarbe
  // ...
}
```

### Typografie anpassen
```typescript
typography: {
  fontFamily: '"Roboto", sans-serif',
  buttonTextTransform: 'none', // oder 'uppercase'
  // ...
}
```

### Layout-Parameter
```typescript
layout: {
  borderRadius: 8,           // Standard Border Radius
  cardBorderRadius: 12,      // Cards Border Radius
  spacing: 8,                // Base spacing (8px)
}
```

## Verfügbare Farben

### Primäre Farben
- **Primary**: Blau (#2196f3) - Hauptaktionen, Links
- **Secondary**: Orange (#ff9800) - Akzente, sekundäre Aktionen
- **Success**: Grün (#4caf50) - Erfolg, positive Werte
- **Warning**: Rot-Orange (#ff6b35) - Warnungen, Durchschnitte
- **Error**: Rot (#f44336) - Fehler, Löschaktionen

### Chart-Farben
- **Consumption**: Lila (#9c27b0) - Verbrauchsdaten
- **Amount**: Blau (#2196f3) - Mengenangaben
- **Price**: Grün (#4caf50) - Preisdaten
- **Mileage**: Orange (#ff9800) - Kilometerstand
- **PricePerLiter**: Pink (#e91e63) - Preis pro Liter
- **Average**: Orange (#ff6b35) - Durchschnittslinien

## Dark Mode

Das Theme verwendet standardmäßig Dark Mode mit:
- **Hintergrund**: #121212 (App) / #1e1e1e (Cards)
- **Text**: #ffffff (primär) / #b0b0b0 (sekundär)
- **Borders**: Verschiedene Transparenzstufen von weiß

## Komponenten-Styles

### Buttons
- Abgerundete Ecken (8px)
- Hover-Effekte mit Transform und Shadow
- Gradient-Hintergründe für Primary/Secondary
- Keine Großbuchstaben (textTransform: 'none')

### Cards/Papers
- 12px Border Radius
- Subtile Borders mit Hover-Effekten
- Konsistente Schatten

### Form-Elemente
- 8px Border Radius
- Brand-Farben für Focus-States
- Konsistente Hover-Effekte

### Toggle Buttons
- Brand-Farben für Selected-State
- Abgerundete Ecken
- Smooth Transitions

## Best Practices

1. **Verwenden Sie Theme-Farben** statt harte Farbwerte
2. **Nutzen Sie `useTheme()`** für dynamische Styles
3. **Befolgen Sie die Spacing-Einheiten** (8px Grid)
4. **Testen Sie Responsive Breakpoints** (xs, sm, md, lg, xl)
5. **Anpassungen in themeConfig.ts** statt direkt im Theme

## Beispiele

### Custom Component mit Theme
```typescript
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';

function CustomComponent() {
  const theme = useTheme();
  
  return (
    <Box sx={{
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(2),
    }}>
      Content
    </Box>
  );
}
```

### Chart mit Theme-Farben
```typescript
import { chartColors } from '../theme/theme';

<LineChart data={data}>
  <Line stroke={chartColors.consumption} />
  <ReferenceLine stroke={chartColors.average} />
</LineChart>
```

## Updates

Bei Theme-Updates sollten Sie:
1. `themeConfig.ts` bearbeiten (nicht `theme.ts`)
2. Browser-Cache leeren/neu laden
3. Alle Komponenten visuell testen
4. Responsive Breakpoints prüfen

---

*Das Theme wird automatisch auf alle Material-UI Komponenten angewendet und sorgt für ein konsistentes, professionelles Erscheinungsbild der gesamten Pistonary-Anwendung.*
