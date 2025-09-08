import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Refueling } from '../database/entities/Refueling';

interface RefuelingHistoryProps {
    refuelings: Refueling[];
    stats: {
        totalLiters: number;
        totalCost: number;
        averageConsumption: number;
    };
}

export default function RefuelingHistory({ refuelings, stats }: RefuelingHistoryProps) {
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
        </Box>
    );
}
