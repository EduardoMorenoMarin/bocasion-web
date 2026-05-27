import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
// Recuerda verificar que las rutas de importación de tu archivo firebase coincidan
import { db, auth } from '../../config/firebase'; 

import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export function OrderHistory() {
  const [historyOrders, setHistoryOrders] = useState([]);
  const [itemIdToNameMap, setItemIdToNameMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  // ID único del cocinero autenticado en la sesión web actual
  const currentCookId = auth.currentUser?.uid || null;

  // 1. Sincronizar catálogo de productos (Equivalente al mapa cargado en la app móvil)
  useEffect(() => {
    const itemsRef = ref(db, 'items');
    const unsubscribeItems = onValue(itemsRef, (snapshot) => {
      const map = {};
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const itemId = childSnapshot.key;
          const itemName = childSnapshot.child('name').val();
          if (itemId && itemName) {
            map[itemId] = itemName;
          }
        });
      }
      setItemIdToNameMap(map);
    }, (error) => {
      console.error("Error al cargar mapa de productos en historial:", error);
    });

    return () => unsubscribeItems();
  }, []);

  // 2. Escuchar orders en tiempo real aplicando los criterios exactos de HistoryFragment.java
  useEffect(() => {
    setLoading(true);
    const ordersRef = ref(db, 'orders');

    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const ordersList = [];

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const orderData = childSnapshot.val();
          const status = orderData.status || '';

          // Filtro estricto: preparar, listo, completado o cancelado
          const isValidStatus = status === 'preparing' || 
                                status === 'ready' || 
                                status === 'completed' || 
                                status === 'cancelled';

          // Filtro de pertenencia: El cookId del ticket debe coincidir con el cocinero en línea
          const belongsToCurrentCook = orderData.cookId === currentCookId;

          if (isValidStatus && belongsToCurrentCook) {
            ordersList.push({
              id: childSnapshot.key,
              ...orderData
            });
          }
        });
      }

      // Ordenar cronológicamente de forma descendente (los pedidos más recientes arriba)
      ordersList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setHistoryOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar órdenes de la base de datos:", error);
      setLoading(false);
    });

    return () => unsubscribeOrders();
  }, [currentCookId]);

  // Formateadores de fecha y marcas de tiempo
  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return `Hoy, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Selector dinámico de estilos de color para las insignias de estado
  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'preparing': return 'warning';
      case 'ready': return 'info';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Historial de Pedidos</h1>
        <p className="text-[var(--color-text)]">Aquí podrás ver todos los pedidos completados y cancelados.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-[var(--color-text)] py-4">Cargando historial...</div>
          ) : historyOrders.length === 0 ? (
            /* Mensaje cuando el historial está vacío (idéntico a la visibilidad controlada en tu fragment_history.xml) */
            <div className="text-[var(--color-text)] text-center py-8 font-semibold">
              No hay pedidos en el historial.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-[var(--color-text)] bg-white/5">
                    <th className="px-6 py-3 rounded-tl-lg">Código</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Fecha / Hora Creación</th>
                    <th className="px-6 py-3">Productos Detallados</th>
                    <th className="px-6 py-3">Pago / Entrega</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3 rounded-tr-lg">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historyOrders.map((order) => (
                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                      
                      {/* Código de Orden */}
                      <td className="px-6 py-4 font-medium text-white align-top">
                        #{order.orderCode}
                      </td>
                      
                      {/* Nombre del Cliente */}
                      <td className="px-6 py-4 text-[var(--color-text)] align-top">
                        {order.userName || 'Cliente'}
                      </td>
                      
                      {/* Fecha y hora del registro */}
                      <td className="px-6 py-4 text-[var(--color-text)] align-top">
                        {formatDate(order.createdAt || order.completedAt)}
                      </td>
                      
                      {/* Listado de ítems mapeando la estructura real de List<OrderItem> */}
                      <td className="px-6 py-4 text-[var(--color-text)] align-top">
                        <ul className="space-y-1">
                          {order.items && order.items.map((item, idx) => {
                            const itemName = itemIdToNameMap[item.itemId] || 'Producto';
                            return (
                              <li key={idx} className="text-white text-xs bg-white/5 px-2 py-1 rounded flex justify-between gap-4 max-w-xs">
                                <span>{itemName}</span>
                                <span className="text-[var(--color-accent)] font-semibold">x{item.quantity}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                      
                      {/* Información Adicional (Método de pago + Hora Programada si aplica) */}
                      <td className="px-6 py-4 space-y-2 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-[var(--color-text)] uppercase font-medium">
                            {order.paymentMethod || 'Efectivo'}
                          </span>
                          <Badge variant={order.paymentConfirmed ? 'success' : 'danger'}>
                            {order.paymentConfirmed ? 'PAGO CONFIRMADO' : 'PAGO PENDIENTE'}
                          </Badge>
                        </div>
                        
                        {/* Indicador de Hora Programada obtenido desde el item_order.xml y adapter */}
                        {order.scheduledTime && (
                          <div className="text-[11px] text-blue-300 bg-blue-950/40 px-2 py-1 rounded border border-blue-900/40 inline-block mt-1">
                            ⏰ Prog: {formatTimestamp(order.scheduledTime)}
                          </div>
                        )}
                        
                        {/* Mensaje de Calificación Pendiente (order_waiting_review_text) */}
                        {order.waitingReview && (
                          <div className="text-[11px] text-red-400 font-bold uppercase tracking-wider animate-pulse mt-1">
                            ⚠️ Esperando calificación...
                          </div>
                        )}
                      </td>
                      
                      {/* Total Monetario */}
                      <td className="px-6 py-4 text-white font-medium align-top">
                        S/. {Number(order.totalPrice || 0).toFixed(2)}
                      </td>
                      
                      {/* Badge con el Estado del pedido en Cocina */}
                      <td className="px-6 py-4 align-top">
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status ? order.status.toUpperCase() : 'DESCONOCIDO'}
                        </Badge>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}