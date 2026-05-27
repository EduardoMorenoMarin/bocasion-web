import React, { useState } from 'react';
import { Card, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuthStore();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, ingrese el correo y la contraseña.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      let errorMessage = 'Error al iniciar sesión. Verifique sus credenciales.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        errorMessage = 'Correo o contraseña incorrectos.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intente más tarde.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] px-4 py-8">
      
      {/* Logo superior (Equivalente al ImageView de 140dp en Android) */}
      <div className="mb-6">
        <img 
          src="https://i.imgur.com/fCxxZCe.png" 
          alt="Restaurante Logo" 
          className="h-32 w-32 object-contain rounded-full bg-[var(--color-card)] p-2 shadow-lg border border-white/5"
          onError={(e) => { e.target.src = "https://placehold.co/140x140?text=Logo"; }}
        />
      </div>

      {/* Título de bienvenida con el color #4DB6AC */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-[Poppins]" style={{ color: '#4DB6AC' }}>
          BOCASION WEB
        </h1>
        <p className="text-sm mt-1 font-medium" style={{ color: '#4DB6AC' }}>
          Gestión Interna de Pedidos
        </p>
      </div>

      {/* Contenedor Card (Equivalente a la CardView de Android) */}
      <Card className="w-full max-w-md bg-[var(--color-card)] border-white/5 shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-6 pt-8 space-y-5">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Campo: Correo Electrónico con etiquetas en #4DB6AC */}
            <div className="space-y-2">
              <label className="text-sm font-medium block" style={{ color: '#4DB6AC' }}>
                Correo Electrónico
              </label>
              <Input 
                type="email" 
                placeholder="usuario@bocacion.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-[var(--color-card-dark)] text-white placeholder-slate-500 rounded-xl py-3"
                style={{ borderColor: '#4DB6AC' }}
              />
            </div>

            {/* Campo: Contraseña con etiquetas en #4DB6AC */}
            <div className="space-y-2">
              <label className="text-sm font-medium block" style={{ color: '#4DB6AC' }}>
                Contraseña
              </label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-[var(--color-card-dark)] text-white placeholder-slate-500 rounded-xl py-3"
                style={{ borderColor: '#4DB6AC' }}
              />
            </div>
            
            {/* Mensajes de Error */}
            {error && (
              <div className="text-sm text-[var(--color-danger-red)] bg-[var(--color-danger-red)]/10 border border-[var(--color-danger-red)]/20 p-3 rounded-xl font-medium text-center">
                {error}
              </div>
            )}

            {/* Botón de Ingreso con Fondo #4DB6AC y texto oscuro para contraste */}
            <Button 
              type="submit" 
              className="w-full mt-4 font-bold uppercase tracking-wider py-3.5 rounded-xl text-black transition-opacity hover:opacity-90 shadow-md" 
              style={{ backgroundColor: '#4DB6AC' }}
              disabled={loading}
            >
              {loading ? 'Autenticando...' : 'Ingresar al Portal'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer del Login informativo con texto en #4DB6AC */}
      <p className="text-xs mt-6 font-medium tracking-wide" style={{ color: '#4DB6AC' }}>
        Bocacion Restaurante • Versión Web Cocina
      </p>
    </div>
  );
}
