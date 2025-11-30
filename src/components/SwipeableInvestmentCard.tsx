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
    Delete as DeleteIcon
} from '@mui/icons-material';
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

interface SwipeableInvestmentCardProps {
    investment: Investment;
    onEdit: (investment: Investment) => void;
    onDelete: (investment: Investment) => void;
}

const SwipeableInvestmentCard: React.FC<SwipeableInvestmentCardProps> = ({ 
    investment, 
    onEdit, 
    onDelete 
}) => {
    const [translateX, setTranslateX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showDeleteAction, setShowDeleteAction] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);

    const DELETE_THRESHOLD = -50; // Schwellenwert für automatisches Öffnen des Delete-Dialogs

    // Touch Events
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        startXRef.current = e.touches[0].clientX;
        currentXRef.current = translateX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        
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
        if (!isDragging) return;
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

    // Mouse Events (für Desktop-Testing)
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        startXRef.current = e.clientX;
        currentXRef.current = translateX;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        
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
        if (!isDragging) return;
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
        onDelete(investment);
    };

    const handleCancelDelete = () => {
        setShowDeleteDialog(false);
        setTranslateX(0);
        setShowDeleteAction(false);
    };

    const handleCardClick = () => {
        // Nur bei Klick ohne Swipe bearbeiten
        if (Math.abs(translateX) < 5) {
            onEdit(investment);
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
                {/* Delete Action Background - hinter der Karte */}
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

                {/* Main Card - über dem Delete Button */}
                <Card 
                    ref={cardRef}
                    sx={{ 
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        transform: `translateX(${translateX}px)`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': !isDragging ? { 
                            boxShadow: 3,
                            transform: `translateX(${translateX}px) translateY(-2px)`
                        } : {},
                        '&:active': !isDragging ? {
                            transform: `translateX(${translateX}px) translateY(0) scale(0.98)`,
                            boxShadow: 1
                        } : {},
                        userSelect: 'none',
                        position: 'relative',
                        zIndex: 1,
                        backgroundColor: 'background.paper',
                        borderRadius: 1
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
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
                            {/* Header mit Datum und Betrag */}
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.8 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                    {dayjs(investment.date).format('DD.MM.YYYY')}
                                </Typography>
                                <Chip 
                                    label={`${investment.amount.toFixed(2)} €`} 
                                    color="primary" 
                                    variant="filled" 
                                    size="small"
                                    sx={{ 
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem'
                                    }}
                                />
                            </Stack>

                            {/* Hauptinformationen */}
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>
                                    {investment.description}
                                </Typography>
                                {investment.category && (
                                    <Chip 
                                        label={investment.category} 
                                        size="small"
                                        variant="outlined"
                                        sx={{ 
                                            mt: 0.5,
                                            fontSize: '0.7rem',
                                            height: '20px'
                                        }}
                                    />
                                )}
                            </Box>

                            {investment.notes && (
                                <>
                                    <Divider sx={{ mb: 1 }} />
                                    <Box sx={{ p: 0.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Notizen:
                                        </Typography>
                                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                            {investment.notes}
                                        </Typography>
                                    </Box>
                                </>
                            )}
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
                    Investition löschen?
                </DialogTitle>
                <DialogContent>
                    <Typography id="delete-dialog-description">
                        Möchten Sie die Investition "{investment.description}" vom {dayjs(investment.date).format('DD.MM.YYYY')} 
                        ({investment.amount.toFixed(2)} €) wirklich aus der Datenbank löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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

export default SwipeableInvestmentCard;
