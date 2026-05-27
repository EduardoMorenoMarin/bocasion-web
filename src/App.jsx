import React from 'react';

import {
  createBrowserRouter,
  RouterProvider,
  Navigate
} from 'react-router-dom';

import { Layout } from './components/layout/Layout';

import { Login } from './features/auth/Login';

// ======================================
// COCINERO
// ======================================

import {
  Dashboard as CookDashboard
} from './features/orders/Dashboard';

import {
  PendingOrders
} from './features/orders/PendingOrders';

import {
  PreparingOrders
} from './features/orders/PreparingOrders';

import {
  OrderHistory
} from './features/orders/OrderHistory';

import {
  StockCook
} from './features/orders/StockCook';

// ======================================
// ADMIN
// ======================================

import {
  AdminDashboard
} from './features/admin/AdminDashboard';

import {
  ManageCategories
} from './features/admin/ManageCategories';

import {
  ManageItems
} from './features/admin/ManageItems';

import {
  ManageUsers
} from './features/admin/ManageUsers';

import {
  SalesAnalytics
} from './features/admin/SalesAnalytics';

// ======================================
// PROFILE
// ======================================

import {
  Profile
} from './features/profile/Profile';

// ======================================
// STORE
// ======================================

import {
  useAuthStore
} from './store/useAuthStore';


// ======================================
// HOME SEGÚN ROL
// ======================================

const HomeDispatcher = () => {

  const { user } =
    useAuthStore();

  // ADMIN
  if (user?.role === 'admin') {

    return <AdminDashboard />;
  }

  // COCINERO
  if (user?.role === 'cocinero') {

    return <CookDashboard />;
  }

  // SIN ACCESO
  return (
    <Navigate
      to="/login"
      replace
    />
  );
};


// ======================================
// RUTAS ADMIN
// ======================================

const AdminRoute = ({ children }) => {

  const { user } =
    useAuthStore();

  if (user?.role !== 'admin') {

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
};


// ======================================
// RUTAS COCINERO
// ======================================

const CookRoute = ({ children }) => {

  const { user } =
    useAuthStore();

  if (user?.role !== 'cocinero') {

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
};


// ======================================
// ROUTER
// ======================================

const router = createBrowserRouter([

  // ======================================
  // LOGIN
  // ======================================

  {
    path: '/login',
    element: <Login />
  },

  // ======================================
  // SISTEMA
  // ======================================

  {
    path: '/',
    element: <Layout />,

    children: [

      // ======================================
      // HOME
      // ======================================

      {
        index: true,
        element: <HomeDispatcher />
      },

      // ======================================
      // COCINERO
      // ======================================

      {
        path: 'orders/pending',

        element: (
          <CookRoute>
            <PendingOrders />
          </CookRoute>
        )
      },

      {
        path: 'orders/preparing',

        element: (
          <CookRoute>
            <PreparingOrders />
          </CookRoute>
        )
      },

      {
        path: 'orders/history',

        element: (
          <CookRoute>
            <OrderHistory />
          </CookRoute>
        )
      },

      {
        path: 'stock',

        element: (
          <CookRoute>
            <StockCook />
          </CookRoute>
        )
      },

      // ======================================
      // PERFIL
      // ======================================

      {
        path: 'profile',
        element: <Profile />
      },

      // ======================================
      // ADMIN
      // ======================================

      {
        path: 'admin/categories',

        element: (
          <AdminRoute>
            <ManageCategories />
          </AdminRoute>
        )
      },

      {
        path: 'admin/items',

        element: (
          <AdminRoute>
            <ManageItems />
          </AdminRoute>
        )
      },

      {
        path: 'admin/users',

        element: (
          <AdminRoute>
            <ManageUsers />
          </AdminRoute>
        )
      },

      {
        path: 'admin/sales',

        element: (
          <AdminRoute>
            <SalesAnalytics />
          </AdminRoute>
        )
      }

    ]
  },

  // ======================================
  // FALLBACK
  // ======================================

  {
    path: '*',

    element: (
      <Navigate
        to="/"
        replace
      />
    )
  }

]);


// ======================================
// APP
// ======================================

function App() {

  const {
    initialize,
    loading
  } = useAuthStore();

  React.useEffect(() => {

    const unsubscribe =
      initialize();

    return () => {

      if (unsubscribe) {
        unsubscribe();
      }
    };

  }, [initialize]);

  // ======================================
  // LOADING
  // ======================================

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">

        <div className="text-[#4DB6AC] font-bold font-[Poppins] animate-pulse">

          Sincronizando Bocacion Restaurante...

        </div>

      </div>
    );
  }

  return (
    <RouterProvider router={router} />
  );
}

export default App;
