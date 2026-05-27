import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Login } from './features/auth/Login';
import { Dashboard } from './features/orders/Dashboard';
import { PendingOrders } from './features/orders/PendingOrders';
import { PreparingOrders } from './features/orders/PreparingOrders';
import { OrderHistory } from './features/orders/OrderHistory';
import { StockCook } from './features/orders/StockCook';
import { Profile } from './features/profile/Profile';
import { useAuthStore } from './store/useAuthStore';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'orders/pending',
        element: <PendingOrders />
      },
      {
        path: 'orders/preparing',
        element: <PreparingOrders />
      },
      {
        path: 'orders/history',
        element: <OrderHistory />
      },
      {
        path: 'stock',
        element: <StockCook />
      },
      {
        path: 'profile',
        element: <Profile />
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

function App() {
  const { initialize, loading } = useAuthStore();

  React.useEffect(() => {
    const unsubscribe = initialize();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-[var(--color-blue-soft)] font-medium font-[Poppins] animate-pulse">
          Cargando Portal...
        </div>
      </div>
    );
  }

  return (
    <RouterProvider router={router} />
  );
}

export default App;