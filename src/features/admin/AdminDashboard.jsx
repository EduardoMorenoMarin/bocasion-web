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
    users: 0, admins: 0, cooks: 0, items: 0, availableItems: 0, outOfStock: 0,
    categories: 0, activeOrders: 0, pendingOrders: 0, preparingOrders: 0,
    completedOrders: 0, cancelledOrders: 0, totalRevenue: 0, lostRevenue: 0,
    averageRating: 0, totalReviews: 0, averageTicket: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [cancelledOrdersList, setCancelledOrdersList] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [itemNames, setItemNames] = useState({});

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      let totalUsers = 0, admins = 0, cooks = 0;
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

    const itemsRef = ref(db, 'items');
    const unsubscribeItems = onValue(itemsRef, (snapshot) => {
      let totalItems = 0, availableItems = 0, outOfStock = 0;
      const namesMap = {};
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          totalItems++;
          const item = child.val();
          namesMap[child.key] = item.name;
          if (item.available === true) availableItems++;
          if ((item.stock || 0) <= 0) outOfStock++;
        });
      }
      setItemNames(namesMap);
      setStats(prev => ({ ...prev, items: totalItems, availableItems, outOfStock }));
    });

    const categoriesRef = ref(db, 'categories');
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      let totalCategories = 0;
      if (snapshot.exists()) snapshot.forEach(() => { totalCategories++; });
      setStats(prev => ({ ...prev, categories: totalCategories }));
    });

    const reviewsRef = ref(db, 'reviews');
    const unsubscribeReviews = onValue(reviewsRef, (snapshot) => {
      let total = 0, sum = 0;
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

    const ordersRef = ref(db, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      let pending = 0, preparing = 0, completed = 0, cancelled = 0, revenue = 0, lost = 0;
      const activeList = [], cancelledList = [];
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
            activeList.push(order);
            if (status === 'pendiente' || status === 'pending') pending++;
            if (status === 'preparing' || status === 'preparando') preparing++;
            if (status === 'completed' || status === 'completado' || status === 'entregado') {
              completed++;
              revenue += Number(order.totalPrice || 0);
            }
          }
        });
      }
      activeList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      cancelledList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRecentOrders(activeList);
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-card)] to-[var(--color-card-dark)] p-8 border border-white/5 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
              <ShieldCheck className="h-10 w-10" style={{ color: '#4DB6AC' }} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">Panel Administrativo</h1>
              <p className="text-slate-400 mt-1 font-medium text-sm md:text-base">Supervisión global de Bocacion Restaurante</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <StatusCard icon={Database} label="Realtime DB" value="ONLINE" color="emerald" />
            <StatusCard icon={Wifi} label="Sincronización" value="ACTIVA" color="cyan" />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#4DB6AC]/5 rounded-full blur-3xl -mr-24 -mt-24" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi, index) => (
          <Card key={index} className="bg-[var(--color-card)] border-white/5 overflow-hidden hover:scale-[1.02] transition-transform duration-300 shadow-md">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">{kpi.label}</p>
                <h2 className="text-3xl font-black text-white tracking-tight">{kpi.value}</h2>
              </div>
              <div className={`p-4 rounded-2xl ${kpi.bg}`}>
                <kpi.icon className="h-7 w-7" style={{ color: kpi.color }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
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

          <Card className="bg-[var(--color-card)] border-white/5 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Pedidos en Curso</h2>
                <Badge variant="neutral">{recentOrders.length} totales</Badge>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {recentOrders.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-12 bg-[var(--color-card-dark)] rounded-2xl border border-dashed border-white/5">No existen pedidos activos.</div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="bg-[var(--color-card-dark)] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-white text-sm md:text-base">Pedido #{order.orderCode || order.id.slice(-5)}</p>
                          <Badge variant={order.status === 'completed' || order.status === 'completado' ? 'success' : 'warning'}>{order.status || 'pendiente'}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Cliente: {order.userName || 'Sin nombre'}</p>
                      </div>
                      <button onClick={() => setSelectedOrderDetails(order)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 px-3 py-2 rounded-xl hover:bg-[#4DB6AC] transition">
                        <Eye className="h-3.5 w-3.5" /> Detalles
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[var(--color-card)] border-white/5 shadow-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-5 w-5 text-emerald-400" /><h2 className="text-lg font-bold text-white uppercase tracking-wide">Finanzas</h2></div>
              <div className="bg-emerald-500/10 border border-emerald-500/10 rounded-2xl p-5"><p className="text-xs uppercase font-bold text-emerald-400">Ingresos</p><h3 className="text-3xl font-black text-white">S/. {stats.totalRevenue.toFixed(2)}</h3></div>
              <div className="bg-rose-500/10 border border-rose-500/10 rounded-2xl p-5"><p className="text-xs uppercase font-bold text-rose-400">Fugas</p><h3 className="text-2xl font-black text-white">S/. {stats.lostRevenue.toFixed(2)}</h3></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--color-card)] border border-white/10 rounded-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="text-lg font-black text-white">Detalles Pedido</h3><button onClick={() => setSelectedOrderDetails(null)}><X className="text-white"/></button></div>
            <div className="space-y-2">
              {selectedOrderDetails.items?.map((item, index) => (
                <div key={index} className="flex justify-between bg-[var(--color-card-dark)] p-3 rounded-lg text-white">
                  <span>{itemNames[item.itemId] || 'Producto desconocido'}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, color }) {
  const styles = { emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10', cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/10' };
  return (
    <div className={`rounded-2xl px-4 py-3 border ${styles[color]} shadow-inner w-full`}>
      <div className="flex items-center gap-1.5"><Icon className="h-4 w-4" /><span className="text-[10px] uppercase font-bold">{label}</span></div>
      <p className="font-black text-sm mt-1">{value}</p>
    </div>
  );
}

function MiniCard({ title, value, icon: Icon, color }) {
  const colors = { amber: 'text-amber-400 bg-amber-500/10', blue: 'text-blue-400 bg-blue-500/10', emerald: 'text-emerald-400 bg-emerald-500/10', rose: 'text-rose-400 bg-rose-500/10' };
  return (
    <div className="bg-[var(--color-card-dark)] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
      <div><p className="text-[10px] uppercase font-bold text-slate-500">{title}</p><h3 className="text-xl font-black text-white">{value}</h3></div>
      <div className={`p-2 rounded-xl ${colors[color]}`}><Icon className="h-5 w-5" /></div>
    </div>
  );
}
