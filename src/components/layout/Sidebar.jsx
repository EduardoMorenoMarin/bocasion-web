import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  ChefHat,   
  Package,   
  History, 
  User 
} from 'lucide-react';
import { cn } from '../../utils/cn';

export function Sidebar({ isMobileClose }) {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/orders/pending', icon: Clock, label: 'Pedidos Pendientes' },
    { to: '/orders/preparing', icon: ChefHat, label: 'En Preparación' },
    { to: '/orders/history', icon: History, label: 'Historial de Pedidos' },
    { to: '/stock', icon: Package, label: 'Almacén / Stock' },
    { to: '/profile', icon: User, label: 'Mi Perfil' },
  ];

  return (
    <aside className="w-64 h-screen bg-[var(--color-card)] border-r border-white/5 flex flex-col sticky top-0 z-20">
      {/* Brand Header con Logo PNG */}
      <div className="p-6 flex flex-col items-center gap-2 border-b border-white/5">
        <img 
          src="/src/assets/logo.png" 
          alt="Restaurante Logo" 
          className="h-16 w-16 object-contain mb-1 rounded-full bg-[var(--color-card-dark)] p-1 shadow-sm"
          onError={(e) => { e.target.src = "https://placehold.co/60x60?text=Logo"; }}
        />
        <div className="text-center">
          <h2 className="text-white font-bold tracking-tight text-lg font-[Poppins]">Portal Cocina</h2>
          {/* Subtítulo con color corporativo #4DB6AC */}
          <p className="text-xs font-medium" style={{ color: '#4DB6AC' }}>Gestión Interna</p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => isMobileClose && isMobileClose()}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "text-white font-semibold border-l-4 pl-3" 
                  : "hover:bg-white/5 hover:text-white"
              )
            }
            style={({ isActive }) => {
              return isActive 
                ? { 
                    backgroundColor: '#175651', // Tono oscuro cuando está seleccionado
                    borderColor: '#4DB6AC'      // Borde del color principal turquesa
                  }
                : { 
                    color: '#4DB6AC'            // Color de las letras cuando no está seleccionado
                  };
            }}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}