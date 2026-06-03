import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../config/firebase';
import { Card, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import {
  TrendingUp, DollarSign, ShoppingBag, Star, Search, ChefHat,
  CalendarDays, ChartNoAxesCombined, Wallet, Activity, Trophy,
  Eye, X, User as UserIcon, Receipt, ClipboardList
} from 'lucide-react';

export function SalesAnalytics() {
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState({});
  const [search, setSearch] = useState('');
  
  // Estados para controlar los diálogos de detalles
  const [selectedCookDetails, setSelectedCookDetails] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  useEffect(() => {
    // Sincronización en tiempo real de Órdenes
    const ordersRef = ref(db, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          data.push({ id: child.key, ...child.val() });
        });
      }
      setOrders(data.reverse());
    });

    // Sincronización en tiempo real de Reseñas
    const reviewsRef = ref(db, 'reviews');
    const unsubscribeReviews = onValue(reviewsRef, (snapshot) => {
      const data = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          data.push({ id: child.key, ...child.val() });
        });
      }
      setReviews(data);
    });

    // Sincronización en tiempo real de Usuarios
    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          data.push({ id: child.key, ...child.val() });
        });
      }
      setUsers(data);
    });

    // Sincronización en tiempo real de Catálogo de Productos (Items) para resolver nombres
    const itemsRef = ref(db, 'items');
    const unsubscribeItems = onValue(itemsRef, (snapshot) => {
      if (snapshot.exists()) {
        setItems(snapshot.val());
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeReviews();
      unsubscribeUsers();
      unsubscribeItems();
    };
  }, []);

  // Procesamiento de Métricas y Ranking (Equivalente al updateSalesCount y loadReviews del fragment nativo)
  const metrics = useMemo(() => {
    let revenue = 0;
    let completed = 0;
    let pending = 0;
    let preparing = 0;
    const cooksMap = {};

    orders.forEach((order) => {
      const status = order.status?.toLowerCase();

      if (status === 'completed' || status === 'completado' || status === 'entregado' || status === 'ready') {
        completed++;
        revenue += Number(order.totalPrice || 0);

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

        if (!cooksMap[cookId || 'unassigned']) {
          cooksMap[cookId || 'unassigned'] = { 
            name: cookName, 
            ordersCount: 0, 
            revenue: 0, 
            completedOrders: [] 
          };
        }
        cooksMap[cookId || 'unassigned'].ordersCount++;
        cooksMap[cookId || 'unassigned'].revenue += Number(order.totalPrice || 0);
        cooksMap[cookId || 'unassigned'].completedOrders.push(order);
      }

      if (status === 'pending' || status === 'pendiente') pending++;
      if (status === 'preparing' || status === 'preparando') preparing++;
    });

    const averageTicket = completed > 0 ? revenue / completed : 0;

    let avgRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
      avgRating = sum / reviews.length;
    }

    const cooksArray = Object.values(cooksMap).sort((a, b) => b.ordersCount - a.ordersCount);

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

  // Filtro de búsqueda inteligente por Nombre de Cliente, Código o Estado
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const text = ` ${o.userName || ''} ${o.status || ''} ${o.orderCode || ''} `.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [orders, search]);

  // Helper para construir el string con los nombres de productos de una orden
  const getOrderItemsSummary = (orderItems) => {
    if (!orderItems || !Array.isArray(orderItems)) return 'Sin productos';
    return orderItems
      .map(item => {
        const itemData = items[item.itemId];
        const name = itemData ? itemData.name : 'Producto';
        return `${item.quantity}x ${name}`;
      })
      .join(', ');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 bg-[#121214] min-h-screen text-white">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 rounded-2xl text-[#4DB6AC]">
            <ChartNoAxesCombined className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Análisis del Negocio</h1>
            <p className="text-sm text-slate-400 font-medium">
              Panel de control operativo e histórico de ventas en tiempo real
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
            className="w-full pl-12 bg-[#1e1e24] border-white/5 text-white placeholder-slate-500 rounded-2xl h-12 focus:border-teal-500/50 transition-all outline-none"
          />
        </div>
      </div>

      {/* METRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <BigMetric title="Ingresos Totales" value={`S/ ${metrics.revenue.toFixed(2)}`} icon={DollarSign} color="emerald" />
        <BigMetric title="Ticket Promedio" value={`S/ ${metrics.averageTicket.toFixed(2)}`} icon={Wallet} color="blue" />
        <BigMetric title="Pedidos Completados" value={metrics.completed} icon={ShoppingBag} color="purple" />
        <BigMetric title="Calificación Promedio" value={`${metrics.avgRating.toFixed(1)} / 5.0`} icon={Star} color="yellow" />
      </div>

      {/* CONTENIDO OPERATIVO */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* TABLA DE ULTIMAS ORDENES */}
        <Card className="xl:col-span-2 bg-[#1e1e24] border-white/5 shadow-xl rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-400" />
                <h2 className="text-lg font-black uppercase tracking-wider">Estado Operativo Actual</h2>
              </div>
              <Badge variant="outline" className="bg-teal-500/5 text-teal-400 border-teal-500/10 px-3 py-1 text-xs font-bold rounded-xl animate-pulse">
                En Vivo
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
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Últimas Órdenes Registradas</h3>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-black/30 text-slate-400">
                    <tr>
                      <th className="p-3 font-bold">Código</th>
                      <th className="p-3 font-bold">Cliente</th>
                      <th className="p-3 font-bold">Resumen Pedido</th>
                      <th className="p-3 font-bold">Total</th>
                      <th className="p-3 font-bold">Estado</th>
                      <th className="p-3 font-bold text-center">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-black/10">
                    {filteredOrders.slice(0, 6).map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-mono text-xs text-yellow-400 font-bold">#{order.orderCode || 'N/A'}</td>
                        <td className="p-3 font-medium text-white truncate max-w-[120px]">{order.userName || 'Anónimo'}</td>
                        <td className="p-3 text-xs text-slate-400 truncate max-w-[200px]" title={getOrderItemsSummary(order.items)}>
                          {getOrderItemsSummary(order.items)}
                        </td>
                        <td className="p-3 font-bold text-teal-400">S/ {Number(order.totalPrice || 0).toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            ['completed', 'completado', 'entregado', 'ready'].includes(order.status?.toLowerCase())
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : ['preparing', 'preparando'].includes(order.status?.toLowerCase())
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {order.status || 'PENDIENTE'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => setSelectedOrderDetails(order)}
                            className="p-1.5 bg-white/5 hover:bg-teal-500/20 text-slate-300 hover:text-teal-400 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500 font-medium">
                          No se encontraron órdenes registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COLUMNA LATERAL: RENDIMIENTO Y RESUMEN */}
        <div className="space-y-6">
          {/* RENDIMIENTO DE COCINA */}
          <Card className="bg-[#1e1e24] border-white/5 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <h2 className="text-lg font-black uppercase tracking-wider">Rendimiento de Cocina</h2>
              </div>

              {metrics.topCook ? (
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400">
                      <ChefHat className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Líder de Producción</p>
                      <h3 className="text-lg font-black text-white mt-0.5 truncate">{metrics.topCook.name}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {metrics.topCook.ordersCount} pedidos finalizados
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Ranking de Cocineros</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {metrics.cooksArray.map((cook, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-black/10 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-black text-slate-500 w-4 text-center">{index + 1}</span>
                            <span className="text-sm font-bold text-white truncate">{cook.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 bg-white/5 rounded-md text-xs font-bold text-slate-300">
                              {cook.ordersCount} {cook.ordersCount === 1 ? 'pedido' : 'pedidos'}
                            </span>
                            <button
                              onClick={() => setSelectedCookDetails(cook)}
                              className="px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-md text-xs font-bold transition-colors"
                            >
                              Detalle
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 font-medium">
                  No hay datos operativos disponibles.
                </div>
              )}
            </CardContent>
          </Card>

          {/* RESUMEN DE METRICAS */}
          <Card className="bg-[#1e1e24] border-white/5 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-black uppercase tracking-wider">Resumen de Métricas</h2>
              </div>
              <div className="space-y-1">
                <SummaryLine label="Ingresos Consolidados" value={`S/ ${metrics.revenue.toFixed(2)}`} color="text-emerald-400" />
                <SummaryLine label="Ticket Medio" value={`S/ ${metrics.averageTicket.toFixed(2)}`} color="text-blue-400" />
                <SummaryLine label="Entregas Exitosas" value={metrics.completed} color="text-purple-400" />
                <SummaryLine label="Rating General" value={`${metrics.avgRating.toFixed(1)} / 5.0`} color="text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL: DETALLES DE COCINERO (Equivalente al Diálogo Nativo del Fragment) */}
      {selectedCookDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e1e24] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-start bg-black/20">
              <div>
                <span className="text-xs font-black text-teal-400 uppercase tracking-widest">Desempeño de Cocina</span>
                <h3 className="text-2xl font-black text-white mt-1">{selectedCookDetails.name}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{selectedCookDetails.ordersCount} órdenes despachadas con éxito</p>
              </div>
              <button onClick={() => setSelectedCookDetails(null)} className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar bg-black/5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Historial de Órdenes Atendidas</h4>
              {selectedCookDetails.completedOrders.map((order) => {
                // Buscamos si la orden tiene una reseña vinculada por su ID único de Firebase
                const orderReview = reviews.find(r => r.orderCode?.trim() === order.id?.trim());

                return (
                  <div key={order.id} className="bg-[#25252e] border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-yellow-400" />
                        <span className="font-mono text-xs font-bold text-yellow-400">#{order.orderCode}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Fecha N/A'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="text-white font-bold flex items-center gap-1.5 mb-2">
                        <UserIcon className="h-3.5 w-3.5 text-slate-400" /> {order.userName || 'Anónimo'}
                      </p>
                      <div className="bg-black/20 rounded-lg p-2.5 text-xs text-slate-300 font-mono space-y-1">
                        {order.items?.map((it, idx) => (
                          <p key={idx}>• {it.quantity}x {items[it.itemId]?.name || 'Producto'}</p>
                        ))}
                      </div>
                    </div>
                    {/* Sección de Reseña de la orden sincronizada */}
                    <div className="pt-2 border-t border-white/5 text-xs">
                      {orderReview ? (
                        <div className="space-y-1 bg-yellow-500/5 p-2 rounded-lg border border-yellow-500/10">
                          <p className="text-yellow-400 font-bold flex items-center gap-1">
                            {'⭐'.repeat(orderReview.rating)} <span className="ml-1 text-slate-300">({orderReview.rating}/5)</span>
                          </p>
                          <p className="text-slate-400 italic">" {orderReview.comment || 'Sin comentarios escritos.'} "</p>
                        </div>
                      ) : (
                        <p className="text-slate-500 font-medium italic">⚠️ El cliente aún no ha calificado este pedido.</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1 font-bold">
                      <span className="text-slate-400 font-medium">Monto Total:</span>
                      <span className="text-teal-400">S/ {Number(order.totalPrice || 0).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setSelectedCookDetails(null)}
                className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALLES DE ORDEN INDIVIDUAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e1e24] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-teal-400" />
                <h3 className="text-lg font-black text-white">Detalle de Orden #{selectedOrderDetails.orderCode}</h3>
              </div>
              <button onClick={() => setSelectedOrderDetails(null)} className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Cliente</p>
                <p className="text-base font-bold text-white mt-0.5">{selectedOrderDetails.userName || 'Anónimo'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Productos solicitados</p>
                <div className="mt-1.5 space-y-2 bg-black/20 p-3 rounded-xl border border-white/5 max-h-40 overflow-y-auto custom-scrollbar">
                  {selectedOrderDetails.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-300">{items[it.itemId]?.name || 'Producto'}</span>
                      <span className="font-bold text-yellow-400">x{it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Método de Pago</p>
                  <span className="inline-flex mt-1 text-xs font-bold bg-white/5 px-2.5 py-1 rounded-lg text-slate-300">
                    {selectedOrderDetails.paymentMethod || 'No especificado'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Estado de Pago</p>
                  <span className={`inline-flex mt-1 text-xs font-black px-2.5 py-1 rounded-lg ${
                    selectedOrderDetails.paymentConfirmed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {selectedOrderDetails.paymentConfirmed ? 'Confirmado' : 'Pendiente'}
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-white/5 flex justify-between items-center text-base font-black">
                <span className="text-slate-400">Total de la Orden:</span>
                <span className="text-xl text-teal-400">S/ {Number(selectedOrderDetails.totalPrice || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setSelectedOrderDetails(null)}
                className="w-full sm:w-auto px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// COMPONENTES AUXILIARES INTERNOS LIMPIOS
function BigMetric({ title, value, icon: Icon, color }) {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    yellow: 'bg-yellow-500/10 text-yellow-400'
  };

  return (
    <div className="bg-[#1e1e24] border border-white/5 rounded-2xl p-5 shadow-sm hover:border-white/10 transition-all">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">{title}</p>
          <h3 className="text-2xl font-black text-white mt-1.5 truncate">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl flex-shrink-0 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SmallMetric({ label, value }) {
  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-3 text-center">
      <p className="text-[10px] uppercase tracking-widest font-black text-yellow-500">{label}</p>
      <h3 className="text-xl font-black text-white mt-0.5">{value}</h3>
    </div>
  );
}

function SummaryLine({ label, value, color }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 text-sm">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className={`font-black ${color}`}>{value}</span>
    </div>
  );
}
