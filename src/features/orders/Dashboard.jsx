import React from 'react';
import { Card, CardContent } from '../../components/common/Card';
import { ChefHat, Utensils } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 py-4">
      
      {/* Banner de Encabezado Principal */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--color-card)] p-8 border border-white/5 shadow-xl flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        {/* Contenedor del Logo Circular */}
        <div className="h-24 w-24 bg-[var(--color-card-dark)] p-2 rounded-full shadow-md border border-white/10 flex items-center justify-center flex-shrink-0">
          <img 
            src="/src/assets/logo.png" 
            alt="Logo Bocacion" 
            className="h-full w-full object-contain rounded-full"
            onError={(e) => { e.target.src = "https://placehold.co/96x96?text=Bocacion"; }}
          />
        </div>
        
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-[Poppins] uppercase" style={{ color: '#4DB6AC' }}>
            ¡Bienvenido al Portal!
          </h1>
          <p className="text-white text-base mt-1 font-medium max-w-xl">
            Sistema Interno de Monitoreo e Inventario para la Cocina de <span style={{ color: '#4DB6AC' }}>Bocacion Restaurante</span>.
          </p>
        </div>
      </div>

      {/* Tarjeta Informativa de Instrucciones */}
      <Card className="bg-[var(--color-card)] border-white/5 shadow-lg rounded-xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <ChefHat className="h-6 w-6" style={{ color: '#4DB6AC' }} />
            <h2 className="text-xl font-bold text-white font-[Poppins]">
              Instrucciones del Sistema
            </h2>
          </div>
          
          <p className="text-sm leading-relaxed" style={{ color: '#80CBC4' }}>
            Para gestionar los pedidos en tiempo real o ajustar las existencias de insumos en el almacén, por favor utiliza las opciones disponibles en la barra de navegación lateral izquierda:
          </p>

          {/* Listado Visual Breve */}
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-sm text-white">
            <li className="flex items-center gap-2.5 bg-[var(--color-card-dark)]/50 p-3 rounded-lg border border-white/5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4DB6AC' }} />
              Ver y aceptar <strong style={{ color: '#4DB6AC' }}>Pedidos Pendientes</strong>.
            </li>
            <li className="flex items-center gap-2.5 bg-[var(--color-card-dark)]/50 p-3 rounded-lg border border-white/5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4DB6AC' }} />
              Controlar órdenes <strong style={{ color: '#4DB6AC' }}>En Preparación</strong>.
            </li>
            <li className="flex items-center gap-2.5 bg-[var(--color-card-dark)]/50 p-3 rounded-lg border border-white/5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4DB6AC' }} />
              Monitorear insumos en <strong style={{ color: '#4DB6AC' }}>Almacén / Stock</strong>.
            </li>
            <li className="flex items-center gap-2.5 bg-[var(--color-card-dark)]/50 p-3 rounded-lg border border-white/5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4DB6AC' }} />
              Configurar tu cuenta desde <strong style={{ color: '#4DB6AC' }}>Mi Perfil</strong>.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Footer Informativo Fijo */}
      <div className="text-center pt-4">
        <p className="text-xs font-medium tracking-wide flex items-center justify-center gap-1.5" style={{ color: '#4DB6AC' }}>
          <Utensils className="h-3.5 w-3.5" /> Portal Cocina v2.0 • Sincronizado con Base de Datos
        </p>
      </div>

    </div>
  );
}