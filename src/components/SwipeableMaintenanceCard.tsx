import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Stack,
    Chip,
    IconButton,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Slide
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import {
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Maintenance } from '../database/entities/Maintenance';
import { MaintenanceTypeLabels, MaintenanceTypeIcons } from '../database/entities/Maintenance';
import type { MaintenanceStatus } from '../hooks/useMaintenanceData';

// Slide transition for delete animation
const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface SwipeableMaintenanceCardProps {
    maintenance: Maintenance;
    onEdit: (maintenance: Maintenance) => void;
    onDelete: (maintenance: Maintenance) => void;
    remainingTime?: string;
    status?: MaintenanceStatus;
    isMobile?: boolean;
    displayUnit?: string;
    formatMaintenanceInterval: (maintenance: Maintenance) => string;
    convertKmToMiles?: (km: number) => number;
}

const SwipeableMaintenanceCard: React.FC<SwipeableMaintenanceCardProps> = ({
    maintenance,
    onEdit,
    onDelete,
    remainingTime,
    status,
    isMobile = false,
    displayUnit = 'km',
    formatMaintenanceInterval,
    convertKmToMiles = (km) => km * 0.621371
}) => {
    const [translateX, setTranslateX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showDeleteAction, setShowDeleteAction] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);

    const SWIPE_THRESHOLD = -80; // Schwellenwert für Delete-Action
    const DELETE_THRESHOLD = -120; // Schwellenwert für automatisches Löschen

    // Touch Events
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isMobile) return;
        setIsDragging(true);
        startXRef.current = e.touches[0].clientX;
        currentXRef.current = translateX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isMobile || !isDragging) return;
        
        const currentX = e.touches[0].clientX;
        const diff = currentX - startXRef.current;
        const newTranslateX = currentXRef.current + diff;
        
        // Nur nach links swipen erlauben (negative Werte)
        if (newTranslateX <= 0) {
            setTranslateX(newTranslateX);
            setShowDeleteAction(newTranslateX <= SWIPE_THRESHOLD);
        }
    };

    const handleTouchEnd = () => {
        if (!isMobile || !isDragging) return;
        setIsDragging(false);

        if (translateX <= DELETE_THRESHOLD) {
            // Automatisches Löschen bei zu weit geswipt
            setShowDeleteDialog(true);
        } else if (translateX <= SWIPE_THRESHOLD) {
            // Delete-Action anzeigen
            setTranslateX(SWIPE_THRESHOLD);
            setShowDeleteAction(true);
        } else {
            // Zurück zur ursprünglichen Position
            setTranslateX(0);
            setShowDeleteAction(false);
        }
    };

    // Mouse Events (für Desktop-Testing)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isMobile) return;
        setIsDragging(true);
        startXRef.current = e.clientX;
        currentXRef.current = translateX;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isMobile || !isDragging) return;
        
        const currentX = e.clientX;
        const diff = currentX - startXRef.current;
        const newTranslateX = currentXRef.current + diff;
        
        if (newTranslateX <= 0) {
            setTranslateX(newTranslateX);
            setShowDeleteAction(newTranslateX <= SWIPE_THRESHOLD);
        }
    };

    const handleMouseUp = () => {
        if (isMobile || !isDragging) return;
        handleTouchEnd();
    };

    // Reset position on escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setTranslateX(0);
                setShowDeleteAction(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleDeleteClick = () => {
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = () => {
        setShowDeleteDialog(false);
        onDelete(maintenance);
    };

    const handleCancelDelete = () => {
        setShowDeleteDialog(false);
        setTranslateX(0);
        setShowDeleteAction(false);
    };

    const handleCardClick = () => {
        // Nur bei Klick ohne Swipe bearbeiten
        if (Math.abs(translateX) < 5) {
            onEdit(maintenance);
        }
    };

    return (
        <>
            <Box
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 1,
                    mb: 2
                }}
            >
                {/* Delete Action Background */}
                <Box
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 120,
                        backgroundColor: '#d32f2f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: showDeleteAction ? 1 : 0,
                        transition: 'opacity 0.2s ease'
                    }}
                >
                    <IconButton
                        onClick={handleDeleteClick}
                        sx={{ color: 'white' }}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>

                {/* Main Card */}
                <Card
                    ref={cardRef}
                    sx={{
                        transform: `translateX(${translateX}px)`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease',
                        cursor: isMobile ? 'default' : 'pointer',
                        '&:hover': !isDragging ? { boxShadow: 3 } : {},
                        userSelect: 'none',
                        position: 'relative',
                        zIndex: 1
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onClick={handleCardClick}
                >
                    <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: isMobile ? 1.5 : 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body1" sx={{ fontSize: isMobile ? '1.3rem' : '1.5rem' }}>
                                        {MaintenanceTypeIcons[maintenance.type]}
                                    </Typography>
                                    <Typography variant={isMobile ? "subtitle1" : "h6"} component="h3">
                                        {MaintenanceTypeLabels[maintenance.type]}
                                    </Typography>
                                </Box>
                                
                                {/* Wartungsintervall Chip */}
                                <Chip
                                    label={`Intervall: ${formatMaintenanceInterval(maintenance)}`}
                                    variant="outlined"
                                    size="small"
                                    color="info"
                                    sx={{ alignSelf: 'flex-start' }}
                                />
                            </Box>
                            
                            {/* Desktop Edit Button */}
                            {!isMobile && (
                                <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(maintenance);
                                    }}
                                >
                                    <EditIcon />
                                </IconButton>
                            )}
                        </Stack>
                        
                        {/* Status-Anzeige */}
                        {remainingTime && (
                            <Box sx={{ 
                                backgroundColor: status === 'overdue' ? '#d32f2f' : 
                                              status === 'soon' ? '#ed6c02' : 
                                              status === 'good' ? '#2e7d32' : '#e0e0e0',
                                color: 'white', 
                                p: 2, 
                                borderRadius: 1, 
                                textAlign: 'center',
                                mb: 2
                            }}>
                                <Typography variant="h6" fontWeight="bold">
                                    {status === 'overdue' ? '🚨 ' : 
                                     status === 'soon' ? '⚠️ ' : 
                                     status === 'good' ? '✅ ' : '⏱️ '}
                                    {remainingTime}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'white' }}>
                                    {status === 'overdue' ? 'Wartung überfällig!' : 
                                     status === 'soon' ? 'Wartung bald erforderlich' : 
                                     status === 'good' ? 'Wartung in Ordnung' : 'bis zur nächsten Wartung'}
                                </Typography>
                            </Box>
                        )}
                        
                        <Divider sx={{ mb: 2 }} />
                        
                        {/* Kompakte Informationen */}
                        <Stack spacing={1}>
                            {maintenance.lastPerformed && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Zuletzt:
                                    </Typography>
                                    <Typography variant="body2">
                                        {format(new Date(maintenance.lastPerformed), 'dd.MM.yyyy', { locale: de })}
                                    </Typography>
                                </Box>
                            )}
                            
                            {maintenance.lastMileage && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Bei {displayUnit === 'miles' ? 'mi:' : 'km:'}
                                    </Typography>
                                    <Typography variant="body2">
                                        {displayUnit === 'miles'
                                            ? convertKmToMiles(maintenance.lastMileage).toLocaleString('de-DE')
                                            : maintenance.lastMileage.toLocaleString('de-DE')
                                        } {displayUnit === 'miles' ? 'mi' : 'km'}
                                    </Typography>
                                </Box>
                            )}
                            
                            {maintenance.cost && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Kosten:
                                    </Typography>
                                    <Typography variant="body2" color="primary">
                                        {maintenance.cost.toLocaleString('de-DE', { 
                                            style: 'currency', 
                                            currency: 'EUR' 
                                        })}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={showDeleteDialog}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleCancelDelete}
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle>
                    Wartung löschen?
                </DialogTitle>
                <DialogContent>
                    <Typography id="delete-dialog-description">
                        Möchten Sie die Wartung "{MaintenanceTypeLabels[maintenance.type]}" wirklich aus der Datenbank löschen? 
                        Diese Aktion kann nicht rückgängig gemacht werden.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="primary">
                        Abbrechen
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Löschen
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SwipeableMaintenanceCard;