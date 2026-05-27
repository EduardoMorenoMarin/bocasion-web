import React from 'react';

import { NavLink } from 'react-router-dom';

import {

  LayoutDashboard,
  Clock,
  ChefHat,
  Package,
  History,
  Layers,
  UtensilsCrossed,
  Users,
  BarChart3,
  LogOut

} from 'lucide-react';

import { cn } from '../../utils/cn';

import { useAuthStore } from '../../store/useAuthStore';

export function Sidebar({ isMobileClose }) {

  const {
    user,
    logout
  } = useAuthStore();

  const role =
    user?.role;

  // =========================================
  // SIDEBAR ADMIN
  // =========================================

  const adminItems = [

    {
      to: '/',
      icon: LayoutDashboard,
      label: 'Dashboard'
    },

    {
      to: '/admin/categories',
      icon: Layers,
      label: 'Categorías'
    },

    {
      to: '/admin/items',
      icon: UtensilsCrossed,
      label: 'Menú / Items'
    },

    {
      to: '/admin/users',
      icon: Users,
      label: 'Usuarios / Staff'
    },

    {
      to: '/admin/sales',
      icon: BarChart3,
      label: 'Ventas e IA'
    }

  ];

  // =========================================
  // SIDEBAR COCINERO
  // =========================================

  const cookItems = [

    {
      to: '/',
      icon: LayoutDashboard,
      label: 'Dashboard'
    },

    {
      to: '/orders/pending',
      icon: Clock,
      label: 'Pedidos Pendientes'
    },

    {
      to: '/orders/preparing',
      icon: ChefHat,
      label: 'En Preparación'
    },

    {
      to: '/orders/history',
      icon: History,
      label: 'Historial'
    },

    {
      to: '/stock',
      icon: Package,
      label: 'Almacén / Stock'
    }

  ];

  // =========================================
  // MENÚ SEGÚN ROL
  // =========================================

  let navItems = [];

  if (role === 'admin') {

    navItems = adminItems;

  } else if (role === 'cocinero') {

    navItems = cookItems;
  }

  return (

    <aside className="w-64 h-screen bg-[var(--color-card)] border-r border-white/5 flex flex-col sticky top-0 z-20 shadow-2xl">

      {/* HEADER */}

      <div className="p-6 flex flex-col items-center gap-2 border-b border-white/5 bg-[var(--color-card-dark)]/30">

        <img
          src="https://i.imgur.com/fCxxZCe.png"
          alt="Logo"
          className="h-14 w-14 object-contain mb-1 rounded-full p-1 bg-white/5 border border-white/10"
        />

        <div className="text-center">

          <h2 className="text-white font-black tracking-tight text-base font-[Poppins] uppercase italic">

            Portal Cocina

          </h2>

          <Badge role={role} />

        </div>

      </div>

      {/* NAV */}

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">

        {navItems.map((item) => (

          <NavLink
            key={item.to}
            to={item.to}

            onClick={() =>
              isMobileClose &&
              isMobileClose()
            }

            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300",

                isActive
                  ? "text-white shadow-lg translate-x-1"
                  : "text-slate-400 hover:bg-white/5 hover:text-[#4DB6AC]"
              )
            }

            style={({ isActive }) =>

              isActive
                ? {
                    backgroundColor: '#175651',
                    borderLeft: '4px solid #4DB6AC'
                  }
                : {}
            }
          >

            <item.icon className="h-5 w-5" />

            {item.label}

          </NavLink>
        ))}

      </nav>

      {/* FOOTER */}

      <div className="p-4 border-t border-white/5">

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
        >

          <LogOut className="h-5 w-5" />

          Cerrar Sesión

        </button>

      </div>

    </aside>
  );
}

// =========================================
// BADGE
// =========================================

function Badge({ role }) {

  const styles = {

    admin: {
      text: 'ADMINISTRADOR',
      color: '#4DB6AC'
    },

    cocinero: {
      text: 'COCINERO',
      color: '#FFB74D'
    }

  };

  const current =
    styles[role] || {

      text: 'USUARIO',
      color: '#94A3B8'
    };

  return (

    <p
      className="text-[10px] font-black tracking-widest"
      style={{
        color: current.color
      }}
    >

      {current.text}

    </p>
  );
}
