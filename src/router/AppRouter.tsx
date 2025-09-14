import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import MaintenancePage from '../components/MaintenancePage';
import CarListPage from '../components/CarListPage';
import CarDetailPage from '../components/CarDetailPage';
import LoginPage from '../components/LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'cars',
        element: <CarListPage />
      },
      {
        path: 'cars/:carId',
        element: <CarDetailPage />
      },
      {
        path: 'maintenance',
        element: <MaintenancePage />
      }
    ]
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
