import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Alert,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import SwipeableInvestmentCard from './SwipeableInvestmentCard';

interface Investment {
  id: number;
  carId: number;
  date: string;
  description: string;
  amount: number;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OtherCostsProps {
  carId: string;
}

export default function OtherCosts({ carId }: OtherCostsProps) {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date(),
    description: '',
    amount: '',
    category: '',
    notes: ''
  });

  useEffect(() => {
    if (carId) {
      loadInvestments();
    }
  }, [carId]);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/investments/car/${carId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvestments(data);
      } else {
        setError('Fehler beim Laden der Investitionen');
      }
    } catch (err) {
      console.error('Error loading investments:', err);
      setError('Fehler beim Laden der Investitionen');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setFormData({
      date: new Date(),
      description: '',
      amount: '',
      category: '',
      notes: ''
    });
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (investment: Investment) => {
    setSelectedInvestment(investment);
    setFormData({
      date: new Date(investment.date),
      description: investment.description,
      amount: investment.amount.toString(),
      category: investment.category || '',
      notes: investment.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedInvestment(null);
    setFormData({
      date: new Date(),
      description: '',
      amount: '',
      category: '',
      notes: ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleSaveInvestment = async () => {
    if (!formData.description || !formData.amount) {
      setError('Bitte Beschreibung und Betrag eingeben');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const investmentData = {
        carId: parseInt(carId),
        date: formData.date.toISOString(),
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category || undefined,
        notes: formData.notes || undefined
      };

      const url = selectedInvestment
        ? `${API_BASE_URL}/investments/${selectedInvestment.id}`
        : `${API_BASE_URL}/investments`;
      
      const method = selectedInvestment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(investmentData)
      });

      if (response.ok) {
        setSuccess(selectedInvestment ? 'Investition aktualisiert' : 'Investition hinzugefügt');
        await loadInvestments();
        handleCloseDialogs();
      } else {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        setError('Fehler beim Speichern der Investition');
      }
    } catch (err) {
      console.error('Error saving investment:', err);
      setError('Fehler beim Speichern der Investition: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvestment = async (investment: Investment) => {
    if (!confirm('Möchten Sie diese Investition wirklich löschen?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/investments/${investment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Investition gelöscht');
        await loadInvestments();
      } else {
        setError('Fehler beim Löschen der Investition');
      }
    } catch (err) {
      console.error('Error deleting investment:', err);
      setError('Fehler beim Löschen der Investition');
    } finally {
      setLoading(false);
    }
  };

  const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <Card>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center', 
          mb: 3,
          gap: isMobile ? 2 : 0
        }}>
          <Typography variant="h6">
            Sonstige Kosten & Investitionen
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            fullWidth={isMobile}
          >
            Hinzufügen
          </Button>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {investments.length > 0 ? (
          <>
            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Gesamtinvestitionen
              </Typography>
              <Typography variant="h5" color="primary">
                {totalInvestments.toFixed(2)} €
              </Typography>
            </Box>

            {isMobile ? (
              // Mobile: SwipeableCards
              <Box>
                {investments.map((investment) => (
                  <SwipeableInvestmentCard
                    key={investment.id}
                    investment={investment}
                    onEdit={handleOpenEditDialog}
                    onDelete={handleDeleteInvestment}
                  />
                ))}
              </Box>
            ) : (
              // Desktop: Tabellenansicht
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Datum</TableCell>
                      <TableCell>Beschreibung</TableCell>
                      <TableCell>Kategorie</TableCell>
                      <TableCell align="right">Betrag</TableCell>
                      <TableCell>Notizen</TableCell>
                      <TableCell align="center">Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {investments.map((investment) => (
                      <TableRow 
                        key={investment.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleOpenEditDialog(investment)}
                      >
                        <TableCell>
                          {new Date(investment.date).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>{investment.description}</TableCell>
                        <TableCell>
                          {investment.category ? (
                            <Chip label={investment.category} size="small" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            € {investment.amount.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {investment.notes || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(investment);
                            }}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInvestment(investment);
                            }}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        ) : (
          <Alert severity="info">
            Noch keine Investitionen erfasst. Klicken Sie auf "Hinzufügen", um eine neue Investition zu erfassen.
          </Alert>
        )}

        {/* Add Investment Dialog */}
        <Dialog open={isAddDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
          <DialogTitle>Neue Investition hinzufügen</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
                <DatePicker
                  label="Datum"
                  value={formData.date}
                  onChange={(newValue) => {
                    if (newValue instanceof Date) {
                      setFormData({ ...formData, date: newValue });
                    } else if (newValue) {
                      setFormData({ ...formData, date: new Date(newValue.toString()) });
                    }
                  }}
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              </LocalizationProvider>

              <TextField
                label="Beschreibung *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                placeholder="z.B. Neue Felgen"
              />

              <TextField
                label="Kategorie"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                fullWidth
                placeholder="z.B. Tuning, Zubehör, Reparatur"
              />

              <TextField
                label="Betrag *"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />

              <TextField
                label="Notizen"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Zusätzliche Informationen..."
              />

              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Abbrechen</Button>
            <Button onClick={handleSaveInvestment} variant="contained" disabled={loading}>
              Speichern
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Investment Dialog */}
        <Dialog open={isEditDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
          <DialogTitle>Investition bearbeiten</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
                <DatePicker
                  label="Datum"
                  value={formData.date}
                  onChange={(newValue) => {
                    if (newValue instanceof Date) {
                      setFormData({ ...formData, date: newValue });
                    } else if (newValue) {
                      setFormData({ ...formData, date: new Date(newValue.toString()) });
                    }
                  }}
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              </LocalizationProvider>

              <TextField
                label="Beschreibung *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                placeholder="z.B. Neue Felgen"
              />

              <TextField
                label="Kategorie"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                fullWidth
                placeholder="z.B. Tuning, Zubehör, Reparatur"
              />

              <TextField
                label="Betrag *"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />

              <TextField
                label="Notizen"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Zusätzliche Informationen..."
              />

              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Abbrechen</Button>
            <Button onClick={handleSaveInvestment} variant="contained" disabled={loading}>
              Speichern
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
