import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import CarProfile from '../components/CarProfile';
import CarRefuelings from '../components/CarRefuelings';
import CarSettings from '../components/CarSettings';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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
        path: 'cars/:carId',
        element: <CarProfile />,
        children: [
          {
            index: true,
            element: <Navigate to="overview" replace />
          },
          {
            path: 'overview',
            element: <CarProfile />
          },
          {
            path: 'refuelings',
            element: <CarRefuelings />
          },
          {
            path: 'settings',
            element: <CarSettings />
          }
        ]
      }
    ]
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
