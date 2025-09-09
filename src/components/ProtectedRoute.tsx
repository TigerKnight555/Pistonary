import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  // Show loading while auth is being checked
  if (user === null && !isAuthenticated) {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      return (
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          gap={2}
        >
          <CircularProgress />
          <Typography>Anmeldung wird überprüft...</Typography>
        </Box>
      );
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
