import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { Menu, X } from 'lucide-react';
import { Button } from '../common/Button';

export function Layout() {
  const { user } = useAuthStore();
  const { listenToOrders, cleanup } = useOrderStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      listenToOrders(user.uid);
    }
    return () => cleanup();
  }, [user?.uid, listenToOrders, cleanup]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative z-50 w-64 h-full bg-white shadow-xl animate-in slide-in-from-left duration-200">
            <Sidebar isMobileClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 border-b border-slate-200 bg-[var(--color-card)] flex items-center justify-between px-4 md:hidden sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <img 
              src="https://i.imgur.com/fCxxZCe.png" 
              alt="Logo" 
              className="h-9 w-9 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
            <span className="text-[var(--color-text-primary)] font-bold tracking-tight text-base">Portal Cocina</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[var(--color-text-primary)] hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}