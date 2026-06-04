import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../config/firebase';
import { Card, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Activity,
  ShoppingBag,
  ShieldCheck,
  TrendingUp,
  Users,
  Utensils,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  XCircle,
  Database,
  Wifi,
  Star,
  ChefHat,
  Eye,
  X
} from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    admins: 0,
    cooks: 0,
    items: 0,
    availableItems: 0,
    outOfStock: 0,
    categories: 0,
    activeOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    lostRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    averageTicket: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [cancelledOrdersList, setCancelledOrdersList] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  useEffect(() => {
    // Sincronización de Usuarios
    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      let totalUsers = 0;
      let admins = 0;
      let cooks = 0;
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          totalUsers++;
          const role = child.val().role?.toLowerCase();
          if (role === 'admin' || role === 'administrador') admins++;
          if (role === 'cocinero' || role === 'cook') cooks++;
        });
      }
      setStats(prev => ({ ...prev, users: totalUsers, admins, cooks }));
    });

    // Sincronización de Ítems / Productos
    const itemsRef = ref(db, 'items');
    const unsubscribeItems = onValue(itemsRef, (snapshot) => {
      let totalItems = 0;
      let availableItems = 0;
      let outOfStock = 0;
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          totalItems++;
          const item = child.val();
          if (item.available === true) availableItems++;
          if ((item.stock || 0) <= 0) outOfStock++;
        });
      }
      setStats(prev => ({ ...prev, items: totalItems, availableItems, outOfStock }));
    });

    // Sincronización de Categorías
    const categoriesRef = ref(db, 'categories');
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      let totalCategories = 0;
      if (snapshot.exists()) {
        snapshot.forEach(() => { totalCategories++; });
      }
      setStats(prev => ({ ...prev, categories: totalCategories }));
    });

    // Sincronización de Reseñas / Opiniones
    const reviewsRef = ref(db, 'reviews');
    const unsubscribeReviews = onValue(reviewsRef, (snapshot) => {
      let total = 0;
      let sum = 0;
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          total++;
          sum += Number(child.val().rating || 0);
        });
      }
      setStats(prev => ({
        ...prev,
        totalReviews: total,
        averageRating: total > 0 ? (sum / total).toFixed(1) : '0.0'
      }));
    });

    // Sincronización Histórica de Pedidos (Sin filtros de tiempo)
    const ordersRef = ref(db, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      let pending = 0;
      let preparing = 0;
      let completed = 0;
      let cancelled = 0;
      let revenue = 0;
      let lost = 0;
      const activeOrdersList = [];
      const cancelledList = [];

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const orderData = child.val();
          const order = { id: child.key, ...orderData };
          const status = orderData.status?.toLowerCase();

          if (status === 'cancelled' || status === 'cancelado') {
            cancelled++;
            lost += Number(order.totalPrice || 0);
            cancelledList.push(order);
          } else {
            activeOrdersList.push(order);
            if (status === 'pendiente' || status === 'pending') pending++;
            if (status === 'preparing' || status === 'preparando') preparing++;
            if (status === 'completed' || status === 'completado' || status === 'entregado') {
              completed++;
              revenue += Number(order.totalPrice || 0);
            }
          }
        });
      }

      // Ordenar cronológicamente (más recientes primero) utilizando el timestamp de creación
      activeOrdersList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      cancelledList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setRecentOrders(activeOrdersList);
      setCancelledOrdersList(cancelledList);

      setStats(prev => ({
        ...prev,
        activeOrders: pending + preparing,
        pendingOrders: pending,
        preparingOrders: preparing,
        completedOrders: completed,
        cancelledOrders: cancelled,
        totalRevenue: revenue,
        lostRevenue: lost,
        averageTicket: completed > 0 ? (revenue / completed) : 0
      }));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeItems();
      unsubscribeCategories();
      unsubscribeReviews();
      unsubscribeOrders();
    };
  }, []);

  const kpis = [
    { label: 'Usuarios', value: stats.users, icon: Users, color: '#4DB6AC', bg: 'bg-teal-500/10' },
    { label: 'Productos', value: stats.items, icon: Utensils, color: '#FF7043', bg: 'bg-orange-500/10' },
    { label: 'Pedidos Activos', value: stats.activeOrders, icon: ShoppingBag, color: '#66BB6A', bg: 'bg-green-500/10' },
    { label: 'Cancelados Totales', value: stats.cancelledOrders, icon: XCircle, color: '#E57373', bg: 'bg-rose-500/10' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6 font-[Poppins]">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-card)] to-[var(--color-card-dark)] p-8 border border-white/5 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
              <ShieldCheck className="h-10 w-10" style={{ color: '#4DB6AC' }} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
                Panel Administrativo
              </h1>
              <p className="text-slate-400 mt-1 font-medium text-sm md:text-base">
                Supervisión global de Bocacion Restaurante
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <StatusCard icon={Database} label="Realtime DB" value="ONLINE" color="emerald" />
            <StatusCard icon={Wifi} label="Sincronización" value="ACTIVA" color="cyan" />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#4DB6AC]/5 rounded-full blur-3xl -mr-24 -mt-24" />
      </div>

      {/* INDICADORES CLAVE (KPIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi, index) => (
          <Card key={index} className="bg-[var(--color-card)] border-white/5 overflow-hidden hover:scale-[1.02] transition-transform duration-300 shadow-md">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">
                  {kpi.label}
                </p>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {kpi.value}
                </h2>
              </div>
              <div className={`p-4 rounded-2xl ${kpi.bg}`}>
                <kpi.icon className="h-7 w-7" style={{ color: kpi.color }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CONTENIDO PRINCIPAL EN DOS COLUMNAS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: LISTADOS Y ESTADOS DE PEDIDOS */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* MICRO-ESTADOS DE OPERACIÓN */}
          <Card className="bg-[var(--color-card)] border-white/5 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="h-5 w-5 text-[#4DB6AC]" />
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Estado de Operaciones</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MiniCard title="Pendientes" value={stats.pendingOrders} icon={Clock3} color="amber" />
                <MiniCard title="En Cocina" value={stats.preparingOrders} icon={ChefHat} color="blue" />
                <MiniCard title="Entregados" value={stats.completedOrders} icon={CheckCircle2} color="emerald" />
                <MiniCard title="Cancelados" value={stats.cancelledOrders} icon={XCircle} color="rose" />
              </div>
            </CardContent>
          </Card>

          {/* ÚLTIMOS PEDIDOS ACTIVOS */}
          <Card className="bg-[var(--color-card)] border-white/5 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Pedidos en Curso</h2>
                <Badge variant="neutral">{recentOrders.length} totales</Badge>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {recentOrders.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-12 bg-[var(--color-card-dark)] rounded-2xl border border-dashed border-white/5">
                    No existen pedidos activos registrados.
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="bg-[var(--color-card-dark)] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-white text-sm md:text-base">
                            Pedido #{order.orderCode || order.id.slice(-5)}
                          </p>
                          <Badge variant={
                            order.status === 'completed' || order.status === 'completado' ? 'success' :
                            order.status === 'preparing' || order.status === 'preparando' ? 'warning' : 'neutral'
                          }>
                            {order.status || 'pendiente'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Cliente: {order.userName || 'Sin nombre'}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-2 sm:pt-0 border-white/5">
                        <div className="sm:text-right">
                          <p className="text-base font-black text-[#4DB6AC]">S/. {Number(order.totalPrice || 0).toFixed(2)}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedOrderDetails(order)}
                          className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 px-3 py-2 rounded-xl hover:bg-[#4DB6AC] hover:text-black transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> Detalles
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* HISTORIAL DE PEDIDOS CANCELADOS */}
          <Card className="bg-[var(--color-card)] border-white/5 border-l-4 border-l-rose-500 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-rose-400" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wide">Historial de Cancelados</h2>
                </div>
                <Badge variant="danger">{cancelledOrdersList.length} totales</Badge>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {cancelledOrdersList.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-12 bg-[var(--color-card-dark)] rounded-2xl border border-dashed border-white/5">
                    No hay registros de pedidos cancelados.
                  </div>
                ) : (
                  cancelledOrdersList.map((order) => (
                    <div key={order.id} className="bg-rose-950/10 border border-rose-500/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-rose-500/20 transition">
                      <div className="space-y-1">
                        <p className="font-bold text-rose-300 text-sm md:text-base">
                          Pedido #{order.orderCode || order.id.slice(-5)}
                        </p>
                        <p className="text-xs text-slate-400">Cliente: {order.userName || 'Sin nombre'}</p>
                        {order.cancellationReason && (
                          <p className="text-xs text-rose-400/80 italic mt-1 bg-rose-500/5 p-1.5 rounded-lg border border-rose-500/5">
                            Motivo: "{order.cancellationReason}"
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-2 sm:pt-0 border-white/5">
                        <div className="sm:text-right">
                          <p className="text-base font-black text-rose-400">- S/. {Number(order.totalPrice || 0).toFixed(2)}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedOrderDetails(order)}
                          className="flex items-center gap-1.5 text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl hover:bg-rose-500 hover:text-white transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> Detalles
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: RESUMEN FINANCIERO, FEEDBACK E INVENTARIO */}
        <div className="space-y-6">
          
          {/* RESUMEN FINANCIERO COMPLETO */}
          <Card className="bg-[var(--color-card)] border-white/5 shadow-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Finanzas Totales</h2>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/10 rounded-2xl p-5 shadow-inner">
                <p className="text-xs uppercase tracking-widest font-bold text-emerald-400">Ingresos Percibidos</p>
                <h3 className="text-3xl font-black text-white mt-1.5">S/. {stats.totalRevenue.toFixed(2)}</h3>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/10 rounded-2xl p-5 shadow-inner">
                <p className="text-xs uppercase tracking-widest font-bold text-rose-400">No Percibido (Fugas)</p>
                <h3 className="text-2xl font-black text-white mt-1.5">S/. {stats.lostRevenue.toFixed(2)}</h3>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/10 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-bold text-blue-400">Ticket Promedio</p>
                  <p className="text-sm text-slate-300 font-medium">Por pedido concretado</p>
                </div>
                <h4 className="text-xl font-black text-white">S/. {stats.averageTicket.toFixed(2)}</h4>
              </div>
            </CardContent>
          </Card>

          {/* RATING Y OPINIONES */}
          <Card className="bg-[var(--color-card)] border-white/5 shadow-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Satisfacción</h2>
              </div>
              <div className="flex items-center justify-between bg-[var(--color-card-dark)] p-4 rounded-2xl border border-white/5">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Rating Global</p>
                  <h3 className="text-3xl font-black text-white mt-1 flex items-center gap-1.5">
                    ⭐ {stats.averageRating}
                  </h3>
                </div>
                <Badge variant="warning">{stats.totalReviews} reviews</Badge>
              </div>
            </CardContent>
          </Card>

          {/* CONTROL DE INVENTARIO */}
          <Card className="bg-[var(--color-card)] border-white/5 shadow-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Inventario General</h2>
              </div>
              <div className="space-y-2.5">
                <InventoryLine label="Productos Visibles / Activos" value={stats.availableItems} color="emerald" />
                <InventoryLine label="Agotados (Sin Stock)" value={stats.outOfStock} color="rose" />
                <InventoryLine label="Categorías en Menú" value={stats.categories} color="cyan" />
              </div>
            </CardContent>
          </Card>

          {/* EQUIPO / PERSONAL */}
          <Card className="bg-[var(--color-card)] border-white/5 shadow-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#4DB6AC]" />
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Personal Registrado</h2>
              </div>
              <div className="space-y-2.5">
                <InventoryLine label="Administradores (Full Access)" value={stats.admins} color="cyan" />
                <InventoryLine label="Cocineros asignados" value={stats.cooks} color="amber" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL CON DETALLES DEL PEDIDO SELECCIONADO */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[var(--color-card)] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            
            {/* Cabecera Modal */}
            <div className="p-6 bg-[var(--color-card-dark)] border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  Pedido #{selectedOrderDetails.orderCode || selectedOrderDetails.id.slice(-5)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ID: {selectedOrderDetails.id}</p>
              </div>
              <button 
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 bg-[var(--color-card-dark)] p-4 rounded-2xl border border-white/5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Cliente</span>
                  <span className="text-sm font-bold text-white">{selectedOrderDetails.userName || 'Sin nombre'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Estado</span>
                  <div className="mt-0.5">
                    <Badge variant={
                      selectedOrderDetails.status === 'completed' || selectedOrderDetails.status === 'completado' ? 'success' :
                      selectedOrderDetails.status === 'cancelled' || selectedOrderDetails.status === 'cancelado' ? 'danger' : 'warning'
                    }>
                      {selectedOrderDetails.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Método de Pago</span>
                  <span className="text-xs font-semibold text-slate-300 uppercase">{selectedOrderDetails.paymentMethod || 'No definido'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Confirmación de Pago</span>
                  <span className={`text-xs font-bold ${selectedOrderDetails.paymentConfirmed ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedOrderDetails.paymentConfirmed ? '✓ Pagado y Confirmado' : '⏳ Pendiente'}
                  </span>
                </div>
              </div>

              {/* Lista de Ítems del Pedido */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Productos solicitados</span>
                <div className="space-y-2">
                  {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                    selectedOrderDetails.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-[var(--color-card-dark)] px-4 py-3 rounded-xl border border-white/5 text-sm">
                        <div className="text-white font-medium">
                          ID Producto: <span className="text-slate-400 font-mono text-xs">{item.itemId}</span>
                        </div>
                        <div className="text-right">
                          <span className="bg-white/5 text-slate-300 px-2.5 py-1 rounded-lg font-bold text-xs">Cant: {item.quantity}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No hay desglose de productos individuales.</p>
                  )}
                </div>
              </div>

              {/* Tiempos de atención */}
              <div className="space-y-2 text-xs text-slate-400 border-t border-white/5 pt-4">
                {selectedOrderDetails.createdAt && (
                  <p>📅 <span className="font-semibold">Fecha Registro:</span> {new Date(selectedOrderDetails.createdAt).toLocaleString()}</p>
                )}
                {selectedOrderDetails.scheduledTime && (
                  <p>⏰ <span className="font-semibold">Programado para:</span> {new Date(selectedOrderDetails.scheduledTime).toLocaleTimeString()}</p>
                )}
                {selectedOrderDetails.cookId && (
                  <p>👨‍🍳 <span className="font-semibold">Cocinero Asignado:</span> {selectedOrderDetails.cookId}</p>
                )}
                {selectedOrderDetails.cancellationReason && (
                  <div className="mt-3 bg-rose-500/10 text-rose-300 p-3 rounded-xl border border-rose-500/20">
                    <p className="font-bold uppercase text-[10px] tracking-wider text-rose-400 mb-0.5">Razón del Rechazo:</p>
                    <p className="italic">"{selectedOrderDetails.cancellationReason}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-[var(--color-card-dark)] border-t border-white/5 flex justify-between items-center">
              <span className="text-xs uppercase font-bold text-slate-400">Total cobrado:</span>
              <span className="text-2xl font-black text-[#4DB6AC]">S/. {Number(selectedOrderDetails.totalPrice || 0).toFixed(2)}</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// COMPONENTES AUXILIARES EXTRAÍDOS PARA LIMPIEZA VISUAL
function StatusCard({ icon: Icon, label, value, color }) {
  const styles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/10'
  };
  return (
    <div className={`rounded-2xl px-4 py-3 border ${styles[color]} shadow-inner w-full`}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{label}</span>
      </div>
      <p className="font-black text-sm mt-1 tracking-wide">{value}</p>
    </div>
  );
}

function MiniCard({ title, value, icon: Icon, color }) {
  const colors = {
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/5',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/5',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/5',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/5'
  };
  return (
    <div className="bg-[var(--color-card-dark)] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-sm">
      <div className="min-w-0">
        <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-slate-500 truncate">{title}</p>
        <h3 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight">{value}</h3>
      </div>
      <div className={`p-2.5 rounded-xl border ${colors[color]} shrink-0`}>
        <Icon className="h-4 w-4 md:h-5 md:w-5" />
      </div>
    </div>
  );
}

function InventoryLine({ label, value, color }) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10',
    rose: 'text-rose-400 bg-rose-500/5 border-rose-500/10',
    amber: 'text-amber-400 bg-amber-500/5 border-amber-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/5 border-cyan-500/10'
  };
  return (
    <div className="flex items-center justify-between bg-[var(--color-card-dark)] border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition">
      <span className="text-xs md:text-sm text-slate-300 font-medium">{label}</span>
      <span className={`font-black text-xs md:text-sm px-2.5 py-0.5 rounded-lg border ${colors[color]}`}>
        {value}
      </span>
    </div>
  );
}
