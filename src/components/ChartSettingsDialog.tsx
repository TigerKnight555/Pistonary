import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Divider,
  Alert
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useSettings, type DataView, type ChartType, type ChartSettings } from '../contexts/SettingsContext';

interface ChartSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const dataViewLabels: Record<DataView, string> = {
  consumption: 'Verbrauch (L/100km)',
  costPerKm: 'Kosten (€/100km)',
  pricePerLiter: 'Preis pro Liter (€/L)',
  mileage: 'Kilometerstand (km)',
  price: 'Tankpreis (€)',
  amount: 'Tankmenge (L)',
};

const chartTypeLabels: Record<ChartType, string> = {
  line: 'Liniendiagramm',
  bar: 'Balkendiagramm',
};

export default function ChartSettingsDialog({ open, onClose }: ChartSettingsDialogProps) {
  const { chartSettings, setChartSettings } = useSettings();
  const [tempSettings, setTempSettings] = useState<ChartSettings>(chartSettings);

  const handleDataViewChange = (dataView: DataView, checked: boolean) => {
    const newEnabledDataViews = checked
      ? [...tempSettings.enabledDataViews, dataView]
      : tempSettings.enabledDataViews.filter(view => view !== dataView);
    
    setTempSettings({
      ...tempSettings,
      enabledDataViews: newEnabledDataViews
    });
  };

  const handleChartTypeChange = (chartType: ChartType, checked: boolean) => {
    const newEnabledChartTypes = checked
      ? [...tempSettings.enabledChartTypes, chartType]
      : tempSettings.enabledChartTypes.filter(type => type !== chartType);
    
    setTempSettings({
      ...tempSettings,
      enabledChartTypes: newEnabledChartTypes
    });
  };

  const handleSave = () => {
    setChartSettings(tempSettings);
    onClose();
  };

  const handleCancel = () => {
    setTempSettings(chartSettings); // Zurücksetzen auf aktuelle Einstellungen
    onClose();
  };

  const isDataViewDisabled = tempSettings.enabledDataViews.length <= 1;
  const isChartTypeDisabled = tempSettings.enabledChartTypes.length <= 1;

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChartIcon color="primary" />
          Statistik-Konfiguration
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Wählen Sie aus, welche Datenansichten und Diagrammtypen in den Tankstatistiken verfügbar sein sollen.
        </Typography>

        {/* Datenansichten */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Datenansichten
          </Typography>
          
          {isDataViewDisabled && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Mindestens eine Datenansicht muss aktiviert bleiben.
            </Alert>
          )}
          
          <FormGroup>
            {(Object.keys(dataViewLabels) as DataView[]).map(dataView => (
              <FormControlLabel
                key={dataView}
                control={
                  <Checkbox
                    checked={tempSettings.enabledDataViews.includes(dataView)}
                    onChange={(e) => handleDataViewChange(dataView, e.target.checked)}
                    disabled={isDataViewDisabled && tempSettings.enabledDataViews.includes(dataView)}
                  />
                }
                label={dataViewLabels[dataView]}
              />
            ))}
          </FormGroup>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Diagrammtypen */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Diagrammtypen
          </Typography>
          
          {isChartTypeDisabled && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Mindestens ein Diagrammtyp muss aktiviert bleiben.
            </Alert>
          )}
          
          <FormGroup>
            {(Object.keys(chartTypeLabels) as ChartType[]).map(chartType => (
              <FormControlLabel
                key={chartType}
                control={
                  <Checkbox
                    checked={tempSettings.enabledChartTypes.includes(chartType)}
                    onChange={(e) => handleChartTypeChange(chartType, e.target.checked)}
                    disabled={isChartTypeDisabled && tempSettings.enabledChartTypes.includes(chartType)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {chartType === 'line' ? <TrendingUpIcon /> : <BarChartIcon />}
                    {chartTypeLabels[chartType]}
                  </Box>
                }
              />
            ))}
          </FormGroup>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCancel}>
          Abbrechen
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={tempSettings.enabledDataViews.length === 0 || tempSettings.enabledChartTypes.length === 0}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}