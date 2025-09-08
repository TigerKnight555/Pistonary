import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { Car } from '../database/entities/Car';

interface DeleteCarDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    car: Car;
}

export default function DeleteCarDialog({ open, onClose, onConfirm, car }: DeleteCarDialogProps) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Auto löschen</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Möchtest du wirklich das Auto {car.manufacturer} {car.model} ({car.licensePlate}) löschen?
                    Diese Aktion kann nicht rückgängig gemacht werden.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Abbrechen</Button>
                <Button onClick={onConfirm} color="error" variant="contained">
                    Löschen
                </Button>
            </DialogActions>
        </Dialog>
    );
}
