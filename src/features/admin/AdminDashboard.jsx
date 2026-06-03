import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../config/firebase';
import { Card, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Activity,
  Layers,
  ShoppingBag,
  ShieldCheck,
  TrendingUp,
  Users,
  Utensils,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Database,
  Wifi,
  Star,
  ChefHat
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
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      let totalUsers = 0;
      let admins = 0;
      let cooks = 0;
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          totalUsers++;
          const role = child.val().role;
          if (role === 'admin') admins++;
          if (role === 'cocinero') cooks++;
        });
      }
      setStats(prev => ({
        ...prev,
        users: totalUsers,
        admins,
        cooks
      }));
    });

    const itemsRef = ref(db, 'items');
    onValue(itemsRef, (snapshot) => {
      let totalItems = 0;
      let availableItems = 0;
      let outOfStock = 0;
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          totalItems++;
          const item = child.val();
          if (item.available) {
            availableItems++;
          }
          if ((item.stock || 0) <= 0) {
            outOfStock++;
          }
        });
      }
      setStats(prev => ({
        ...prev,
        items: totalItems,
        availableItems,
        outOfStock
      }));
    });

    const categoriesRef = ref(db, 'categories');
    onValue(categoriesRef, (snapshot) => {
      let totalCategories = 0;
      if (snapshot.exists()) {
        snapshot.forEach(() => {
          totalCategories++;
        });
      }
      setStats(prev => ({
        ...prev,
        categories: totalCategories
      }));
    });

    const ordersRef = ref(db, 'orders');
    onValue(ordersRef, (snapshot) => {
      let pending = 0;
      let preparing = 0;
      let completed = 0;
      let revenue = 0;
      const ordersList = [];

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const orderData = child.val();
          const status = orderData.status?.toLowerCase();

          if (status === 'cancelled' || status === 'cancelado') {
            return;
          }

          const order = {
            id: child.key,
            ...orderData
          };

          ordersList.push(order);

          if (status === 'pendiente' || status === 'pending') {
            pending++;
          }
          if (status === 'preparing' || status === 'preparando') {
            preparing++;
          }
          if (status === 'completed' || status === 'completado' || status === 'entregado') {
            completed++;
            revenue += Number(order.totalPrice || 0);
          }
        });
      }

      ordersList.reverse();
      setRecentOrders(ordersList.slice(0, 5));

      setStats(prev => ({
        ...prev,
        activeOrders: pending + preparing,
        pendingOrders: pending,
        preparingOrders: preparing,
        completedOrders: completed,
        totalRevenue: revenue
      }));
    });

    const reviewsRef = ref(db, 'reviews');
    onValue(reviewsRef, (snapshot) => {
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
        averageRating: total > 0 ? (sum / total).toFixed(1) : 0
      }));
    });
  }, []);

  const kpis = [
    {
      label: 'Usuarios',
      value: stats.users,
      icon: Users,
      color: '#4DB6AC',
      bg: 'bg-teal-500/10'
    },
    {
      label: 'Productos',
      value: stats.items,
      icon: Utensils,
      color: '#FF7043',
      bg: 'bg-orange-500/10'
    },
    {
      label: 'Categorías',
      value: stats.categories,
      icon: Layers,
      color: '#5C6BC0',
      bg: 'bg-indigo-500/10'
    },
    {
      label: 'Pedidos Activos',
      value: stats.activeOrders,
      icon: ShoppingBag,
      color: '#66BB6A',
      bg: 'bg-green-500/10'
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-card)] to-[var(--color-card-dark)] p-8 border border-white/5 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
              <ShieldCheck
                className="h-10 w-10"
                style={{ color: '#4DB6AC' }}
              />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white font-[Poppins] tracking-tight">
                PANEL ADMINISTRATIVO
              </h1>
              <p className="text-slate-400 mt-2 font-medium">
                Supervisión global de Bocacion Restaurante
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <StatusCard
              icon={Database}
              label="Realtime DB"
              value="ONLINE"
              color="emerald"
            />
            <StatusCard
              icon={Wifi}
              label="Sincronización"
              value="ACTIVA"
              color="cyan"
            />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#4DB6AC]/5 rounded-full blur-3xl -mr-24 -mt-24" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card
            key={index}
            className="bg-[var(--color-card)] border-white/5 overflow-hidden"
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">
                  {kpi.label}
                </p>
                <h2 className="text-3xl font-black text-white">
                  {kpi.value}
                </h2>
              </div>
              <div className={`p-4 rounded-2xl ${kpi.bg}`}>
                <kpi.icon
                  className="h-7 w-7"
                  style={{ color: kpi.color }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-[var(--color-card)] border-white/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="h-5 w-5 text-[#4DB6AC]" />
                <h2 className="text-lg font-bold text-white">
                  Estado de Operaciones
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MiniCard
                  title="Pendientes"
                  value={stats.pendingOrders}
                  icon={Clock3}
                  color="amber"
                />
                <MiniCard
                  title="Preparando"
                  value={stats.preparingOrders}
                  icon={ChefHat}
                  color="blue"
                />
                <MiniCard
                  title="Completados"
                  value={stats.completedOrders}
                  icon={CheckCircle2}
                  color="emerald"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--color-card)] border-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">
                  Últimos Pedidos
                </h2>
                <Badge variant="neutral">
                  {recentOrders.length} recientes
                </Badge>
              </div>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-10">
                    No existen pedidos registrados.
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-[var(--color-card-dark)] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">
                            Pedido #{order.orderCode || order.id.slice(-5)}
                          </p>
                          <Badge
                            variant={
                              order.status === 'completed'
                                ? 'success'
                                : order.status === 'preparing'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {order.status || 'pendiente'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                          Cliente: {order.userName || 'Sin nombre'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#4DB6AC]">
                          S/. {Number(order.totalPrice || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[var(--color-card)] border-white/5">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">
                  Resumen Financiero
                </h2>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/10 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-widest font-bold text-emerald-400">
                  Ingresos Totales
                </p>
                <h3 className="text-4xl font-black text-white mt-2">
                  S/. {stats.totalRevenue.toFixed(2)}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--color-card)] border-white/5">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-white">
                  Opiniones
                </h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-500">
                    Rating General
                  </p>
                  <h3 className="text-4xl font-black text-white mt-1">
                    ⭐ {stats.averageRating}
                  </h3>
                </div>
                <Badge variant="warning">
                  {stats.totalReviews} reviews
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--color-card)] border-white/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">
                  Inventario
                </h2>
              </div>
              <div className="space-y-3">
                <InventoryLine
                  label="Productos Activos"
                  value={stats.availableItems}
                  color="emerald"
                />
                <InventoryLine
                  label="Sin Stock"
                  value={stats.outOfStock}
                  color="rose"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--color-card)] border-white/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#4DB6AC]" />
                <h2 className="text-lg font-bold text-white">
                  Personal
                </h2>
              </div>
              <div className="space-y-3">
                <InventoryLine
                  label="Administradores"
                  value={stats.admins}
                  color="cyan"
                />
                <InventoryLine
                  label="Cocineros"
                  value={stats.cooks}
                  color="amber"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, color }) {
  const styles = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    cyan: 'bg-cyan-500/10 text-cyan-400'
  };
  return (
    <div className={`rounded-2xl px-4 py-3 border border-white/5 ${styles[color]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] uppercase font-bold tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-black text-sm mt-2">
        {value}
      </p>
    </div>
  );
}

function MiniCard({ title, value, icon: Icon, color }) {
  const colors = {
    amber: 'text-amber-400 bg-amber-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10'
  };
  return (
    <div className="bg-[var(--color-card-dark)] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500">
            {title}
          </p>
          <h3 className="text-3xl font-black text-white mt-2">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InventoryLine({ label, value, color }) {
  const colors = {
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400'
  };
  return (
    <div className="flex items-center justify-between bg-[var(--color-card-dark)] border border-white/5 rounded-xl px-4 py-3">
      <span className="text-sm text-slate-300 font-medium">
        {label}
      </span>
      <span className={`font-black ${colors[color]}`}>
        {value}
      </span>
    </div>
  );
}
