import React, { useState, useRef, useEffect } from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
    Chip,
    Stack,
    Divider,
    CardActionArea,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Slide
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import {
    Build as BuildIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { MaintenanceTypeLabels, MaintenanceTypeIcons } from '../database/entities/Maintenance';
import dayjs from 'dayjs';

// Slide transition for delete animation
const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Maintenance interface for management
interface MaintenanceData {
    id: number;
    type: string;
    description?: string;
    lastPerformed?: string;
    lastMileage?: number;
    cost?: number;
    notes?: string;
    createdAt: string;
}

interface SwipeableMaintenanceManagementCardProps {
    maintenance: MaintenanceData;
    onEdit: (maintenance: MaintenanceData) => void;
    onDelete: (maintenance: MaintenanceData) => void;
    isMobile?: boolean;
}

const SwipeableMaintenanceManagementCard: React.FC<SwipeableMaintenanceManagementCardProps> = ({ 
    maintenance, 
    onEdit, 
    onDelete,
    isMobile = true 
}) => {
    const [translateX, setTranslateX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showDeleteAction, setShowDeleteAction] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);

    const DELETE_THRESHOLD = -50; // Schwellenwert für automatisches Öffnen des Delete-Dialogs

    // Touch Events (nur im Mobile-View aktiv)
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
        
        // Nur nach links swipen erlauben, maximal bis zur Delete-Button Breite (-120px)
        if (newTranslateX <= 0 && newTranslateX >= -120) {
            setTranslateX(newTranslateX);
            setShowDeleteAction(newTranslateX <= DELETE_THRESHOLD);
        }
    };

    const handleTouchEnd = () => {
        if (!isMobile || !isDragging) return;
        setIsDragging(false);

        if (translateX <= DELETE_THRESHOLD) {
            // Genug geswipt - Delete-Dialog automatisch öffnen
            setShowDeleteDialog(true);
            // Karte bleibt weiter links eingelockt
            setTranslateX(-80);
            setShowDeleteAction(true);
        } else {
            // Zurück zur ursprünglichen Position
            setTranslateX(0);
            setShowDeleteAction(false);
        }
    };

    // Mouse Events (nur im Mobile-View für Desktop-Testing)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isMobile) return;
        setIsDragging(true);
        startXRef.current = e.clientX;
        currentXRef.current = translateX;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isMobile || !isDragging) return;
        
        const currentX = e.clientX;
        const diff = currentX - startXRef.current;
        const newTranslateX = currentXRef.current + diff;
        
        // Nur nach links swipen erlauben, maximal bis zur Delete-Button Breite (-120px)
        if (newTranslateX <= 0 && newTranslateX >= -120) {
            setTranslateX(newTranslateX);
            setShowDeleteAction(newTranslateX <= DELETE_THRESHOLD);
        }
    };

    const handleMouseUp = () => {
        if (!isMobile || !isDragging) return;
        setIsDragging(false);

        if (translateX <= DELETE_THRESHOLD) {
            // Genug geswipt - Delete-Dialog automatisch öffnen
            setShowDeleteDialog(true);
            // Karte bleibt weiter links eingelockt
            setTranslateX(-80);
            setShowDeleteAction(true);
        } else {
            // Zurück zur ursprünglichen Position
            setTranslateX(0);
            setShowDeleteAction(false);
        }
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
                {/* Delete Action Background - nur im Mobile-View */}
                {isMobile && (
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
                            zIndex: 0,
                            pointerEvents: showDeleteAction ? 'auto' : 'none',
                            borderRadius: 1
                        }}
                    >
                        <IconButton
                            onClick={handleDeleteClick}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteClick();
                            }}
                            sx={{ 
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                )}

                {/* Main Card - über dem Delete Button */}
                <Card 
                    ref={cardRef}
                    sx={{ 
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        transform: isMobile ? `translateX(${translateX}px)` : 'none',
                        transition: isDragging ? 'none' : 'transform 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': !isDragging ? { 
                            boxShadow: 3,
                            transform: isMobile ? `translateX(${translateX}px) translateY(-2px)` : 'translateY(-2px)'
                        } : {},
                        '&:active': !isDragging ? {
                            transform: isMobile ? `translateX(${translateX}px) translateY(0) scale(0.98)` : 'translateY(0) scale(0.98)',
                            boxShadow: 1
                        } : {},
                        userSelect: 'none',
                        position: 'relative',
                        zIndex: 1,
                        backgroundColor: 'background.paper',
                        borderRadius: 1
                    }}
                    onTouchStart={isMobile ? handleTouchStart : undefined}
                    onTouchMove={isMobile ? handleTouchMove : undefined}
                    onTouchEnd={isMobile ? handleTouchEnd : undefined}
                    onMouseDown={isMobile ? handleMouseDown : undefined}
                    onMouseMove={isMobile ? handleMouseMove : undefined}
                    onMouseUp={isMobile ? handleMouseUp : undefined}
                >
                    <CardActionArea 
                        onClick={handleCardClick}
                        sx={{
                            '&:active': {
                                '& .MuiCardActionArea-focusHighlight': {
                                    transform: 'scale(1.05)',
                                    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
                                }
                            }
                        }}
                    >
                        <CardContent sx={{ p: 1.5 }}>
                            {/* Header */}
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body1" sx={{ fontSize: '1.3rem' }}>
                                        {MaintenanceTypeIcons[maintenance.type as keyof typeof MaintenanceTypeIcons] || <BuildIcon />}
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                                        {MaintenanceTypeLabels[maintenance.type as keyof typeof MaintenanceTypeLabels] || maintenance.type}
                                    </Typography>
                                </Box>
                                <Stack direction="row" alignItems="center" gap={1}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        {dayjs(maintenance.createdAt).format('DD.MM.YYYY')}
                                    </Typography>
                                    {/* Delete Icon nur im Desktop-View */}
                                    {!isMobile && (
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick();
                                            }}
                                            sx={{ 
                                                color: 'error.main',
                                                '&:hover': {
                                                    backgroundColor: 'action.hover'
                                                }
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Stack>
                            </Stack>

                            {/* Beschreibung falls vorhanden */}
                            {maintenance.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.9rem' }}>
                                    {maintenance.description}
                                </Typography>
                            )}

                            <Divider sx={{ mb: 1.5 }} />

                            {/* Zusätzliche Informationen */}
                            <Stack spacing={0.5}>
                                {maintenance.lastPerformed && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Zuletzt durchgeführt:
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                                            {dayjs(maintenance.lastPerformed).format('DD.MM.YYYY')}
                                        </Typography>
                                    </Box>
                                )}
                                
                                {maintenance.lastMileage && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Bei Kilometerstand:
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                                            {maintenance.lastMileage.toLocaleString()} km
                                        </Typography>
                                    </Box>
                                )}
                                
                                {maintenance.cost && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Kosten:
                                        </Typography>
                                        <Chip 
                                            label={`${maintenance.cost.toFixed(2)} €`} 
                                            color="primary" 
                                            variant="outlined" 
                                            size="small"
                                            sx={{ 
                                                fontSize: '0.75rem',
                                                height: 20
                                            }}
                                        />
                                    </Box>
                                )}
                                
                                {maintenance.notes && (
                                    <Box sx={{ mt: 0.5, p: 0.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Notizen:
                                        </Typography>
                                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                            {maintenance.notes}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </CardContent>
                    </CardActionArea>
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
                        Möchten Sie die Wartung "{MaintenanceTypeLabels[maintenance.type as keyof typeof MaintenanceTypeLabels] || maintenance.type}" 
                        {maintenance.lastPerformed && ` vom ${dayjs(maintenance.lastPerformed).format('DD.MM.YYYY')}`}
                        {maintenance.cost && ` (${maintenance.cost.toFixed(2)} €)`} 
                        wirklich aus der Datenbank löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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

export default SwipeableMaintenanceManagementCard;