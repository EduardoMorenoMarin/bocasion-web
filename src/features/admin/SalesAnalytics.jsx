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
  Activity,
  Trophy
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

        const cookId = order.cookId;
        let cookName = 'Sin asignar';

        if (cookId && cookId !== 'Sin asignar') {
          const matchedUser = users.find(u => u.uid === cookId || u.id === cookId);
          if (matchedUser) {
            cookName = matchedUser.name;
          } else {
            cookName = `Cocinero (${cookId.substring(0, 5)})`;
          }
        }

        if (!cooksMap[cookName]) {
          cooksMap[cookName] = { orders: 0, revenue: 0 };
        }
        cooksMap[cookName].orders++;
        cooksMap[cookName].revenue += Number(order.totalPrice || 0);
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

    averageTicket = completed > 0 ? revenue / completed : 0;

    let avgRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce(
        (acc, r) => acc + Number(r.rating || 0), 0
      );
      avgRating = sum / reviews.length;
    }

    const cooksArray = Object.entries(cooksMap)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort(
        (a, b) => b.orders - a.orders
      );

    return {
      revenue,
      completed,
      pending,
      preparing,
      averageTicket,
      avgRating,
      topCook: cooksArray[0] || null,
      cooksArray
    };
  }, [orders, reviews, users]);

  const filteredOrders = orders.filter((o) => {
    const text = ` ${o.userName || ''} ${o.status || ''} ${o.orderCode || ''} `
      .toLowerCase();
    return text.includes(
      search.toLowerCase()
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ChartNoAxesCombined className="h-8 w-8" style={{ color: '#4DB6AC' }} />
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Análisis del Negocio
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              Panel de control operativo e histórico de ventas
            </p>
          </div>
        </div>

        <div className="relative w-full xl:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <Input
            type="text"
            placeholder="Buscar por cliente, código o estado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 bg-[var(--color-card-dark)] border-white/5 text-white placeholder-slate-500 rounded-2xl h-12 focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <BigMetric
          title="Ingresos Totales"
          value={`S/ ${metrics.revenue.toFixed(2)}`}
          icon={DollarSign}
          color="emerald"
        />
        <BigMetric
          title="Ticket Promedio"
          value={`S/ ${metrics.averageTicket.toFixed(2)}`}
          icon={Wallet}
          color="blue"
        />
        <BigMetric
          title="Pedidos Completados"
          value={metrics.completed}
          icon={ShoppingBag}
          color="purple"
        />
        <BigMetric
          title="Calificación Promedio"
          value={`${metrics.avgRating.toFixed(1)} / 5.0`}
          icon={Star}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-black text-white uppercase tracking-wider">
                  Estado Operativo Actual
                </h2>
              </div>
              <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 border-emerald-500/10 px-3 py-1 text-xs font-bold rounded-xl">
                En tiempo real
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <SmallMetric label="Pendientes" value={metrics.pending} />
              <SmallMetric label="En Preparación" value={metrics.preparing} />
              <SmallMetric label="Completados" value={metrics.completed} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Últimas Órdenes Registradas
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-black/20 text-slate-400">
                    <tr>
                      <th className="p-3 font-bold rounded-l-xl">Código</th>
                      <th className="p-3 font-bold">Cliente</th>
                      <th className="p-3 font-bold">Total</th>
                      <th className="p-3 font-bold rounded-r-xl">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredOrders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-mono text-xs text-yellow-400">{order.orderCode || 'N/A'}</td>
                        <td className="p-3 font-medium text-white">{order.userName || 'Anónimo'}</td>
                        <td className="p-3 font-bold">S/ {Number(order.totalPrice || 0).toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            order.status?.toLowerCase() === 'completed' || order.status?.toLowerCase() === 'completado' || order.status?.toLowerCase() === 'entregado'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : order.status?.toLowerCase() === 'preparing' || order.status?.toLowerCase() === 'preparando'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {order.status || 'PENDIENTE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-500 font-medium">
                          No se encontraron órdenes que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <h2 className="text-lg font-black text-white uppercase tracking-wider">
                  Rendimiento de Cocina
                </h2>
              </div>

              {metrics.topCook ? (
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400">
                      <ChefHat className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                        Líder de Producción
                      </p>
                      <h3 className="text-xl font-black text-white mt-0.5">
                        {metrics.topCook.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-400 mt-1">
                        {metrics.topCook.orders} {metrics.topCook.orders === 1 ? 'pedido finalizado' : 'pedidos finalizados'} con éxito
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                      Ranking de Cocineros
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {metrics.cooksArray.map((cook, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-slate-500 w-4 text-center">
                              {index + 1}
                            </span>
                            <span className="text-sm font-bold text-white">
                              {cook.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2.5 py-1 bg-white/5 rounded-lg text-xs font-bold text-slate-300">
                              {cook.orders} {cook.orders === 1 ? 'pedido' : 'pedidos'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 font-medium">
                  No hay datos de cocineros en las órdenes completadas.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-black text-white uppercase tracking-wider">
                  Resumen de Métricas
                </h2>
              </div>
              <div className="space-y-3">
                <SummaryLine label="Ingresos" value={`S/ ${metrics.revenue.toFixed(2)}`} color="text-emerald-400" />
                <SummaryLine label="Ticket Medio" value={`S/ ${metrics.averageTicket.toFixed(2)}`} color="text-blue-400" />
                <SummaryLine label="Entregas" value={metrics.completed} color="text-purple-400" />
                <SummaryLine label="Rating" value={`${metrics.avgRating.toFixed(1)} / 5.0`} color="text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BigMetric({
  title,
  value,
  icon: Icon,
  color
}) {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    yellow: 'bg-yellow-500/10 text-yellow-400'
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
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-400 font-medium">{label}</span>
      <span className={`text-sm font-black ${color}`}>{value}</span>
    </div>
  );
}
