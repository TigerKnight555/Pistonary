import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';
import { Car } from '../database/entities/Car';
import { Refueling } from '../database/entities/Refueling';
import EditCarDialog from './EditCarDialog';
import DeleteCarDialog from './DeleteCarDialog';
import AddRefuelingDialog from './AddRefuelingDialog';
import RefuelingHistory from './RefuelingHistory';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function CarDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [car, setCar] = useState<Car | null>(null);
    const [refuelings, setRefuelings] = useState<Refueling[]>([]);
    const [stats, setStats] = useState({
        totalLiters: 0,
        totalCost: 0,
        averageConsumption: 0
    });
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [addRefuelingDialogOpen, setAddRefuelingDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCar = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/cars/${id}`);
            if (!response.ok) throw new Error('Auto konnte nicht geladen werden');
            const data = await response.json();
            setCar(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
        }
    };

    const fetchRefuelings = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/cars/${id}/refuelings`);
            if (!response.ok) throw new Error('Tankungen konnten nicht geladen werden');
            const data = await response.json();
            setRefuelings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/cars/${id}/refuelings/stats`);
            if (!response.ok) throw new Error('Statistiken konnten nicht geladen werden');
            const data = await response.json();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
        }
    };

    useEffect(() => {
        fetchCar();
        fetchRefuelings();
        fetchStats();
    }, [id]);

    const handleEditCar = async (updatedCar: Partial<Car>) => {
        try {
            const response = await fetch(`http://localhost:3000/api/cars/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCar)
            });
            if (!response.ok) throw new Error('Auto konnte nicht aktualisiert werden');
            fetchCar();
            setEditDialogOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
        }
    };

    const handleDeleteCar = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/cars/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Auto konnte nicht gelöscht werden');
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
        }
    };

    const handleAddRefueling = async (refueling: any) => {
        try {
            const response = await fetch(`http://localhost:3000/api/cars/${id}/refuelings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(refueling)
            });
            if (!response.ok) throw new Error('Tankung konnte nicht hinzugefügt werden');
            fetchRefuelings();
            fetchStats();
            setAddRefuelingDialogOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
        }
    };

    if (!car) return null;

    return (
        <Box sx={{ p: 3 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="h4">{car.manufacturer} {car.model}</Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            {car.licensePlate} • Baujahr {car.year}
                        </Typography>
                    </Box>
                    <Box>
                        <Button
                            startIcon={<LocalGasStationIcon />}
                            variant="contained"
                            color="primary"
                            onClick={() => setAddRefuelingDialogOpen(true)}
                            sx={{ mr: 1 }}
                        >
                            Neue Tankung
                        </Button>
                        <Button
                            startIcon={<EditIcon />}
                            variant="outlined"
                            onClick={() => setEditDialogOpen(true)}
                            sx={{ mr: 1 }}
                        >
                            Bearbeiten
                        </Button>
                        <Button
                            startIcon={<DeleteIcon />}
                            variant="outlined"
                            color="error"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            Löschen
                        </Button>
                    </Box>
                </Box>

                <Typography variant="body1">
                    {car.notes}
                </Typography>
            </Paper>

            <RefuelingHistory refuelings={refuelings} stats={stats} />

            {car && (
                <EditCarDialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                    onSave={handleEditCar}
                    car={car}
                />
            )}

            <DeleteCarDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteCar}
                car={car}
            />

            <AddRefuelingDialog
                open={addRefuelingDialogOpen}
                onClose={() => setAddRefuelingDialogOpen(false)}
                onAdd={handleAddRefueling}
                carId={Number(id)}
            />
        </Box>
    );
}
