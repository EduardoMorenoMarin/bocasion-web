import React, {
  useState,
  useEffect,
  useMemo
} from 'react';

import {
  ref,
  onValue
} from 'firebase/database';

import { db } from '../../config/firebase';

import {
  Card,
  CardContent
} from '../../components/common/Card';

import {
  Badge
} from '../../components/common/Badge';

import {
  Input
} from '../../components/common/Input';

import {

  TrendingUp,
  DollarSign,
  ShoppingBag,
  Star,
  Search,
  ChefHat,
  CalendarDays,
  ChartNoAxesCombined,
  Wallet,
  Package,
  Activity,
  Trophy,
  Clock3,
  CheckCircle2

} from 'lucide-react';

export function SalesAnalytics() {

  const [orders, setOrders] =
    useState([]);

  const [reviews, setReviews] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [search, setSearch] =
    useState('');

  // ============================================
  // REALTIME
  // ============================================

  useEffect(() => {

    const ordersRef =
      ref(db, 'orders');

    onValue(ordersRef, (snapshot) => {

      const data = [];

      if (snapshot.exists()) {

        snapshot.forEach((child) => {

          data.push({

            id: child.key,
            ...child.val()
          });
        });
      }

      setOrders(data.reverse());
    });

    const reviewsRef =
      ref(db, 'reviews');

    onValue(reviewsRef, (snapshot) => {

      const data = [];

      if (snapshot.exists()) {

        snapshot.forEach((child) => {

          data.push({

            id: child.key,
            ...child.val()
          });
        });
      }

      setReviews(data);
    });

    const usersRef =
      ref(db, 'users');

    onValue(usersRef, (snapshot) => {

      const data = [];

      if (snapshot.exists()) {

        snapshot.forEach((child) => {

          data.push({

            id: child.key,
            ...child.val()
          });
        });
      }

      setUsers(data);
    });

  }, []);

  // ============================================
  // METRICS
  // ============================================

  const metrics = useMemo(() => {

    let revenue = 0;

    let completed = 0;

    let pending = 0;

    let preparing = 0;

    let averageTicket = 0;

    const cooksMap = {};

    orders.forEach((order) => {

      const status =
        order.status?.toLowerCase();

      if (
        status === 'completed' ||
        status === 'completado' ||
        status === 'entregado'
      ) {

        completed++;

        revenue += Number(
          order.totalPrice || 0
        );

        // COCINERO

        const cookName =
          order.cookName ||
          order.assignedCook ||
          'Sin asignar';

        if (!cooksMap[cookName]) {

          cooksMap[cookName] = {

            orders: 0,
            revenue: 0
          };
        }

        cooksMap[cookName].orders++;

        cooksMap[cookName].revenue +=
          Number(order.totalPrice || 0);
      }

      if (
        status === 'pending' ||
        status === 'pendiente'
      ) {

        pending++;
      }

      if (
        status === 'preparing' ||
        status === 'preparando'
      ) {

        preparing++;
      }
    });

    averageTicket =
      completed > 0
        ? revenue / completed
        : 0;

    // ============================================
    // REVIEWS
    // ============================================

    let avgRating = 0;

    if (reviews.length > 0) {

      const sum =
        reviews.reduce(
          (acc, r) =>
            acc + Number(r.rating || 0),
          0
        );

      avgRating =
        sum / reviews.length;
    }

    // ============================================
    // TOP COOK
    // ============================================

    const cooksArray =
      Object.entries(cooksMap)
        .map(([name, stats]) => ({

          name,
          ...stats
        }))
        .sort(
          (a, b) =>
            b.orders - a.orders
        );

    return {

      revenue,

      completed,

      pending,

      preparing,

      averageTicket,

      avgRating,

      topCook:
        cooksArray[0] || null,

      cooksArray
    };

  }, [orders, reviews]);

  // ============================================
  // FILTER ORDERS
  // ============================================

  const filteredOrders =
    orders.filter((o) => {

      const text =
        `
          ${o.userName}
          ${o.status}
          ${o.orderCode}
        `
          .toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });

  return (

    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">

      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <ChartNoAxesCombined
            className="h-8 w-8"
            style={{
              color: '#4DB6AC'
            }}
          />

          <div>

            <h1 className="text-3xl font-bold font-[Poppins] text-white">

              Ventas & Analítica IA

            </h1>

            <p className="text-sm text-slate-500 mt-1">

              Monitoreo financiero y rendimiento operativo

            </p>

          </div>

        </div>

        {/* SEARCH */}

        <div className="relative w-full xl:w-80">

          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />

          <Input
            placeholder="Buscar pedido..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="pl-10 bg-[var(--color-card)] border-white/5 text-white"
          />

        </div>

      </div>

      {/* ============================================ */}
      {/* KPI GRID */}
      {/* ============================================ */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          label="Ingresos"
          value={`S/. ${metrics.revenue.toFixed(2)}`}
          icon={DollarSign}
          color="emerald"
        />

        <StatCard
          label="Pedidos Completados"
          value={metrics.completed}
          icon={ShoppingBag}
          color="cyan"
        />

        <StatCard
          label="Ticket Promedio"
          value={`S/. ${metrics.averageTicket.toFixed(2)}`}
          icon={Wallet}
          color="amber"
        />

        <StatCard
          label="Rating General"
          value={`⭐ ${metrics.avgRating.toFixed(1)}`}
          icon={Star}
          color="rose"
        />

      </div>

      {/* ============================================ */}
      {/* MAIN GRID */}
      {/* ============================================ */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ============================================ */}
        {/* LEFT */}
        {/* ============================================ */}

        <div className="xl:col-span-2 space-y-6">

          {/* ORDERS STATUS */}

          <Card className="bg-[var(--color-card)] border-white/5">

            <CardContent className="p-6 space-y-5">

              <div className="flex items-center gap-2">

                <Activity className="h-5 w-5 text-[#4DB6AC]" />

                <h2 className="text-lg font-bold text-white">

                  Estado de Pedidos

                </h2>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <MiniCard
                  title="Pendientes"
                  value={metrics.pending}
                  icon={Clock3}
                  color="amber"
                />

                <MiniCard
                  title="Preparando"
                  value={metrics.preparing}
                  icon={ChefHat}
                  color="blue"
                />

                <MiniCard
                  title="Completados"
                  value={metrics.completed}
                  icon={CheckCircle2}
                  color="emerald"
                />

              </div>

            </CardContent>

          </Card>

          {/* ORDERS TABLE */}

          <Card className="bg-[var(--color-card)] border-white/5">

            <CardContent className="p-6 space-y-5">

              <div className="flex items-center justify-between">

                <h2 className="text-lg font-bold text-white">

                  Historial de Ventas

                </h2>

                <Badge variant="neutral">

                  {filteredOrders.length} pedidos

                </Badge>

              </div>

              <div className="space-y-3">

                {filteredOrders.length === 0 && (

                  <div className="text-center py-10 text-slate-500 text-sm">

                    No existen ventas registradas.

                  </div>
                )}

                {filteredOrders.map((order) => (

                  <div
                    key={order.id}
                    className="bg-[var(--color-card-dark)] border border-white/5 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >

                    {/* LEFT */}

                    <div className="space-y-2">

                      <div className="flex items-center gap-2 flex-wrap">

                        <h3 className="font-black text-white">

                          Pedido #{order.orderCode || order.id.slice(-5)}

                        </h3>

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

                      <div className="space-y-1">

                        <p className="text-xs text-slate-400">

                          Cliente: {order.userName || 'Sin nombre'}

                        </p>

                        <p className="text-xs text-slate-500">

                          Cocinero: {order.cookName || 'Sin asignar'}

                        </p>

                      </div>

                    </div>

                    {/* RIGHT */}

                    <div className="text-right space-y-1">

                      <p className="text-lg font-black text-[#4DB6AC]">

                        S/. {Number(order.totalPrice || 0).toFixed(2)}

                      </p>

                      <p className="text-[11px] text-slate-500">

                        {formatDate(order.createdAt)}

                      </p>

                    </div>

                  </div>
                ))}

              </div>

            </CardContent>

          </Card>

        </div>

        {/* ============================================ */}
        {/* RIGHT */}
        {/* ============================================ */}

        <div className="space-y-6">

          {/* TOP COOK */}

          <Card className="bg-[var(--color-card)] border-white/5">

            <CardContent className="p-6 space-y-5">

              <div className="flex items-center gap-2">

                <Trophy className="h-5 w-5 text-yellow-400" />

                <h2 className="text-lg font-bold text-white">

                  Mejor Cocinero

                </h2>

              </div>

              {metrics.topCook ? (

                <div className="bg-yellow-500/10 border border-yellow-500/10 rounded-2xl p-5 space-y-4">

                  <div className="flex items-center gap-3">

                    <div className="h-14 w-14 rounded-2xl bg-yellow-500/20 flex items-center justify-center">

                      <ChefHat className="h-7 w-7 text-yellow-400" />

                    </div>

                    <div>

                      <h3 className="text-xl font-black text-white">

                        {metrics.topCook.name}

                      </h3>

                      <p className="text-xs text-yellow-300">

                        Mayor rendimiento del sistema

                      </p>

                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <SmallMetric
                      label="Pedidos"
                      value={metrics.topCook.orders}
                    />

                    <SmallMetric
                      label="Ingresos"
                      value={`S/. ${metrics.topCook.revenue.toFixed(0)}`}
                    />

                  </div>

                </div>

              ) : (

                <div className="text-sm text-slate-500 text-center py-8">

                  No hay datos disponibles.

                </div>
              )}

            </CardContent>

          </Card>

          {/* REVIEWS */}

          <Card className="bg-[var(--color-card)] border-white/5">

            <CardContent className="p-6 space-y-5">

              <div className="flex items-center gap-2">

                <Star className="h-5 w-5 text-yellow-400" />

                <h2 className="text-lg font-bold text-white">

                  Reviews IA

                </h2>

              </div>

              <div className="space-y-3">

                {reviews.length === 0 && (

                  <div className="text-center py-6 text-slate-500 text-sm">

                    No existen reviews registradas.

                  </div>
                )}

                {reviews.slice(0, 5).map((review) => (

                  <div
                    key={review.id}
                    className="bg-[var(--color-card-dark)] border border-white/5 rounded-xl p-4 space-y-2"
                  >

                    <div className="flex items-center justify-between">

                      <p className="font-bold text-white text-sm">

                        {review.userName || 'Usuario'}

                      </p>

                      <Badge variant="warning">

                        ⭐ {review.rating}

                      </Badge>

                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">

                      {review.comment || 'Sin comentario'}

                    </p>

                  </div>
                ))}

              </div>

            </CardContent>

          </Card>

          {/* SYSTEM */}

          <Card className="bg-[var(--color-card)] border-white/5">

            <CardContent className="p-6 space-y-4">

              <div className="flex items-center gap-2">

                <CalendarDays className="h-5 w-5 text-[#4DB6AC]" />

                <h2 className="text-lg font-bold text-white">

                  Resumen General

                </h2>

              </div>

              <SummaryLine
                label="Usuarios"
                value={users.length}
                color="cyan"
              />

              <SummaryLine
                label="Pedidos"
                value={orders.length}
                color="emerald"
              />

              <SummaryLine
                label="Reviews"
                value={reviews.length}
                color="amber"
              />

              <SummaryLine
                label="Ventas"
                value={`S/. ${metrics.revenue.toFixed(2)}`}
                color="rose"
              />

            </CardContent>

          </Card>

        </div>

      </div>

    </div>
  );
}

// ======================================================
// HELPERS
// ======================================================

function formatDate(timestamp) {

  if (!timestamp) return 'Sin fecha';

  try {

    return new Date(timestamp)
      .toLocaleString();

  } catch {

    return 'Fecha inválida';
  }
}

// ======================================================
// COMPONENTS
// ======================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color
}) {

  const colors = {

    emerald: 'bg-emerald-500/10 text-emerald-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400'
  };

  return (

    <Card className="bg-[var(--color-card)] border-white/5">

      <CardContent className="p-5 flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">

            {label}

          </p>

          <h2 className="text-3xl font-black text-white">

            {value}

          </h2>

        </div>

        <div className={`p-4 rounded-2xl ${colors[color]}`}>

          <Icon className="h-6 w-6" />

        </div>

      </CardContent>

    </Card>
  );
}

function MiniCard({
  title,
  value,
  icon: Icon,
  color
}) {

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

function SmallMetric({
  label,
  value
}) {

  return (

    <div className="bg-black/20 rounded-xl p-3">

      <p className="text-[10px] uppercase tracking-widest font-bold text-yellow-300">

        {label}

      </p>

      <h3 className="text-lg font-black text-white mt-1">

        {value}

      </h3>

    </div>
  );
}

function SummaryLine({
  label,
  value,
  color
}) {

  const colors = {

    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400'
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