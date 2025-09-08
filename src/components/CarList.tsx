import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import type { Car } from '../database/entities/Car';
import { API_BASE_URL } from '../config/api';

interface CarListProps {
    cars: Car[];
    onCarUpdate: () => void;
}

export default function CarList({ cars, onCarUpdate }: CarListProps) {
    const handleDelete = async (id: number) => {
        try {
            await fetch(`${API_BASE_URL}/cars/${id}`, {
                method: 'DELETE',
            });
            onCarUpdate();
        } catch (error) {
            console.error('Error deleting car:', error);
        }
    };

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Hersteller</TableCell>
                        <TableCell>Modell</TableCell>
                        <TableCell>Baujahr</TableCell>
                        <TableCell>Leistung (PS)</TableCell>
                        <TableCell>Getriebe</TableCell>
                        <TableCell>Kraftstoff</TableCell>
                        <TableCell>Aktionen</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {cars.map((car) => (
                        <TableRow key={car.id}>
                            <TableCell>{car.manufacturer}</TableCell>
                            <TableCell>{car.model}</TableCell>
                            <TableCell>{car.year}</TableCell>
                            <TableCell>{car.power}</TableCell>
                            <TableCell>{car.transmission}</TableCell>
                            <TableCell>{car.fuel}</TableCell>
                            <TableCell>
                                <IconButton size="small" color="primary" onClick={() => console.log('Edit', car.id)}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDelete(car.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
