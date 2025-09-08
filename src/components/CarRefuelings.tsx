import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { API_BASE_URL } from '../config/api';
import type { Refueling } from '../database/entities/Refueling';
import AddRefuelingDialog from './AddRefuelingDialog';

export default function CarRefuelings() {
  const { carId } = useParams<{ carId: string }>();
  const [refuelings, setRefuelings] = useState<Refueling[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalLiters: 0,
    totalCost: 0,
    averageConsumption: 0,
  });

  const fetchRefuelings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/${carId}/refuelings`);
      if (!response.ok) throw new Error('Fehler beim Laden der Betankungen');
      const data = await response.json();
      setRefuelings(data);
    } catch (error) {
      console.error('Error fetching refuelings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/${carId}/refuelings/stats`);
      if (!response.ok) throw new Error('Fehler beim Laden der Statistiken');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (carId) {
      fetchRefuelings();
      fetchStats();
    }
  }, [carId]);

  const handleAddRefueling = async (newRefueling: Omit<Refueling, 'id' | 'date' | 'car'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/${carId}/refuelings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRefueling),
      });
      if (!response.ok) throw new Error('Fehler beim Speichern der Betankung');
      await fetchRefuelings();
      await fetchStats();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding refueling:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 3 }}>
        <Paper sx={{ p: 2, flexGrow: 1 }}>
          <Typography variant="h6">Gesamtverbrauch</Typography>
          <Typography variant="h4">{stats.totalLiters.toFixed(2)} L</Typography>
        </Paper>
        <Paper sx={{ p: 2, flexGrow: 1 }}>
          <Typography variant="h6">Gesamtkosten</Typography>
          <Typography variant="h4">{stats.totalCost.toFixed(2)} €</Typography>
        </Paper>
        <Paper sx={{ p: 2, flexGrow: 1 }}>
          <Typography variant="h6">Durchschnittsverbrauch</Typography>
          <Typography variant="h4">{stats.averageConsumption.toFixed(1)} L/100km</Typography>
        </Paper>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Neue Betankung
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Datum</TableCell>
              <TableCell align="right">Kilometerstand</TableCell>
              <TableCell align="right">Liter</TableCell>
              <TableCell align="right">€/L</TableCell>
              <TableCell align="right">Gesamt €</TableCell>
              <TableCell>Teilbetankung</TableCell>
              <TableCell>Notizen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {refuelings.map((refueling) => (
              <TableRow key={refueling.id}>
                <TableCell>
                  {new Date(refueling.date).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">{refueling.mileage}</TableCell>
                <TableCell align="right">{refueling.liters.toFixed(2)}</TableCell>
                <TableCell align="right">{refueling.pricePerLiter.toFixed(3)}</TableCell>
                <TableCell align="right">
                  {(refueling.liters * refueling.pricePerLiter).toFixed(2)}
                </TableCell>
                <TableCell>{refueling.isPartialRefueling ? 'Ja' : 'Nein'}</TableCell>
                <TableCell>{refueling.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AddRefuelingDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddRefueling}
        carId={Number(carId)}
      />
    </Box>
  );
}
