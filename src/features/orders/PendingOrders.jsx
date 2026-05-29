import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, update, query, orderByChild, equalTo } from 'firebase/database';
import { db, auth } from '../../config/firebase'; 

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export function PendingOrders() {
  const [orders, setOrders] = useState([]);
  const [itemIdToNameMap, setItemIdToNameMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Referencia para guardar la cantidad anterior de pedidos
  const lastOrderCountRef = useRef(-1);
  // Instancia única del audio para evitar crear múltiples objetos en memoria
  const audioRef = useRef(new Audio('https://www.image2url.com/r2/default/audio/1780022833452-396fe619-1651-48c3-bc9e-98350c619a74.mp3'));
  
  const currentCookId = auth.currentUser?.uid || null;

  // 1. Cargar catálogo de ítems para resolver los IDs a nombres
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
      console.error("Error cargando ítems:", error);
    });

    return () => unsubscribeItems();
  }, []);

  // 2. Escuchar pedidos en tiempo real con estado "pending"
  useEffect(() => {
    setLoading(true);
    const ordersRef = ref(db, 'orders');
    const pendingOrdersQuery = query(ordersRef, orderByChild('status'), equalTo('pending'));

    const unsubscribeOrders = onValue(pendingOrdersQuery, (snapshot) => {
      const ordersList = [];
      let currentCount = 0;

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const orderData = childSnapshot.val();
          ordersList.push({
            id: childSnapshot.key,
            ...orderData
          });
          currentCount++;
        });
      }

      /* SISTEMA DE AUDIO OPTIMIZADO:
        - lastOrderCountRef.current inicia en -1. La primera vez que carga la página 
          guarda la cantidad inicial de pedidos pendientes en la BD sin emitir sonido.
        - En los siguientes eventos en tiempo real, si la cantidad actual supera la 
          última registrada, significa que ha ingresado un pedido genuinamente nuevo.
      */
      if (lastOrderCountRef.current !== -1 && currentCount > lastOrderCountRef.current) {
        // Reiniciamos el audio al segundo 0 por si entraron dos alertas seguidas
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.warn(
            "El navegador bloqueó el sonido automático. " +
            "Haga clic en cualquier parte de la pantalla para activar las alertas de audio.", 
            err
          );
        });
      }

      // Actualizamos la referencia con el conteo actual
      lastOrderCountRef.current = currentCount;
      setOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error("Error cargando pedidos:", error);
      setLoading(false);
    });

    return () => unsubscribeOrders();
  }, []);

  // 3. Acción para aceptar la orden
  const handleAcceptOrder = async (orderId) => {
    if (!currentCookId) {
      alert("No se detectó un usuario autenticado (Cook ID).");
      return;
    }

    try {
      setActionLoading(orderId);
      const orderRef = ref(db, `orders/${orderId}`);
      
      await update(orderRef, {
        status: 'accepted',
        cookId: currentCookId
      });
      
    } catch (error) {
      console.error('Failed to accept order:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Pedidos Pendientes</h1>
        <p className="text-[var(--color-text)]">Control de tickets activos en cocina</p>
      </div>

      {loading ? (
        <div className="text-[var(--color-text)]">Cargando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="text-[var(--color-text)]">No hay pedidos pendientes.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map(order => (
            <Card key={order.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg text-white">
                    Pedido #{order.orderCode}
                  </CardTitle>
                  <p className="text-sm text-[var(--color-text)] font-medium mt-1">
                    Pedido de: {order.userName || 'Cliente'}
                  </p>
                </div>
                <Badge variant="warning">
                  {order.status ? order.status.toUpperCase() : 'PENDING'}
                </Badge>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                {/* Total del Pedido */}
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text)]">Total general:</span>
                  <span className="text-white font-medium">
                    S/. {Number(order.totalPrice || 0).toFixed(2)}
                  </span>
                </div>

                {/* Métodos de Pago y Confirmación */}
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant={order.paymentConfirmed ? 'success' : 'danger'}>
                    {order.paymentConfirmed ? 'PAGO CONFIRMADO' : 'PAGO PENDIENTE'}
                  </Badge>
                  <span className="text-[var(--color-text)] uppercase">
                    Pago: {order.paymentMethod || 'Efectivo'}
                  </span>
                </div>

                {/* Hora Programada */}
                {order.scheduledTime && (
                  <div className="text-xs bg-blue-950/40 text-blue-300 p-2 rounded border border-blue-800/30">
                    ⏰ <strong>Hora programada:</strong> {formatTimestamp(order.scheduledTime)}
                  </div>
                )}

                {/* Lista de productos */}
                <div className="mt-4">
                  <p className="text-xs font-semibold text-[var(--color-text)] mb-1 uppercase tracking-wider">Items del pedido:</p>
                  <ul className="space-y-2">
                    {order.items && order.items.map((item, idx) => {
                      const itemName = itemIdToNameMap[item.itemId] || 'Producto';
                      return (
                        <li key={idx} className="flex justify-between text-white bg-black/20 p-2 rounded text-sm">
                          <span>{itemName}</span>
                          <span className="font-semibold text-[var(--color-accent)]">
                            x{item.quantity}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </CardContent>
              
              <CardFooter className="pt-4 border-t border-white/5">
                <Button
                  className="w-full"
                  disabled={actionLoading === order.id}
                  onClick={() => handleAcceptOrder(order.id)}
                >
                  {actionLoading === order.id ? 'Aceptando...' : 'Aceptar'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
