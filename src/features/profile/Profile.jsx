import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, LogOut } from 'lucide-react';

export function Profile() {
  // Extraemos 'logout' de tu useAuthStore para cerrar sesión de verdad
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.name || user?.email?.split('@')[0] || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // FUNCIÓN DE LOGOUT CORREGIDA
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // 1. Llama a la función logout del store (que ejecuta auth.signOut() de Firebase)
      await logout();
      
      // 2. Redirige limpiando el historial para que no pueda volver atrás con el navegador
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    console.log("Guardando cambios de perfil:", { displayName, currentPassword, newPassword });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-[var(--color-text-primary)]">
      {/* Banner de Encabezado */}
      <div className="relative overflow-hidden rounded-xl bg-[var(--color-red-primary-dark)] p-6 border border-white/5 flex items-center gap-4">
        <div className="h-20 w-20 bg-[var(--color-card)] p-1 rounded-full shadow-md border border-white/10 flex items-center justify-center flex-shrink-0">
          <img 
            src="/src/assets/logo.png" 
            alt="Logo Bocacion" 
            className="h-full w-full object-contain rounded-full"
            onError={(e) => { e.target.src = "https://placehold.co/80x80?text=Bocacion"; }}
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase font-[Poppins]">Perfil</h1>
          <p className="text-[var(--color-blue-soft)] text-sm font-medium">Gestión de cuenta de Cocina</p>
        </div>
      </div>

      <Card className="bg-[var(--color-card)] border-white/5">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-[var(--color-accent-mint)]" /> Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <form onSubmit={handleSaveChanges} className="space-y-5">
            
            {/* Campo de Correo Electrónico */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--color-blue-soft)] flex items-center gap-2">
                <Mail className="h-4 w-4" /> Correo Electrónico
              </label>
              <Input 
                type="email" 
                value={user?.email || ''} 
                disabled 
                className="w-full bg-[var(--color-card-dark)] border-white/5 text-[var(--color-blue-soft)] opacity-80 cursor-not-allowed" 
              />
            </div>

            {/* Campo de Nombre */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">Nombre en Pantalla</label>
              <Input 
                type="text" 
                placeholder="Nombre del Cocinero" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[var(--color-card-dark)] border-white/5 text-white focus:border-[var(--color-accent-mint)]" 
              />
            </div>

            {/* Campos de Contraseña Opcionales */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--color-blue-soft)] flex items-center gap-2">
                <Lock className="h-4 w-4" /> Cambiar Contraseña
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-xs text-white">Contraseña Actual</label>
                <Input 
                  type="password" 
                  placeholder="Ingresa tu contraseña actual" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[var(--color-card-dark)] border-white/5 text-white" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-white">Nueva Contraseña</label>
                <Input 
                  type="password" 
                  placeholder="Mínimo 6 caracteres" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[var(--color-card-dark)] border-white/5 text-white" 
                />
              </div>
            </div>

            {/* Botón Guardar Cambios */}
            <Button 
              type="submit"
              className="w-full font-bold uppercase tracking-wider py-3 rounded-lg text-black transition-opacity hover:opacity-95"
              style={{ backgroundColor: 'var(--color-blue-primary-light)' }}
            >
              Guardar Cambios
            </Button>
          </form>

          {/* BOTÓN CERRAR SESIÓN CON FIREBASE */}
          <Button 
            variant="ghost" 
            className="w-full font-bold uppercase tracking-wider py-3 rounded-lg border border-[var(--color-danger-red)] text-[var(--color-danger-red)] hover:bg-[var(--color-danger-red)]/10 flex items-center justify-center gap-2 mt-2 transition-colors"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-5 w-5" />
            {isLoggingOut ? 'Saliendo...' : 'Cerrar Sesión'}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}