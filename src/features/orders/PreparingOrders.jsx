import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, auth } from '../../config/firebase'; 

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export function PreparingOrders() {
  const [orders, setOrders] = useState([]);
  const [itemIdToNameMap, setItemIdToNameMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  const currentCookId = auth.currentUser?.uid || null;

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
      console.error("Error mapeando productos:", error);
    });

    return () => unsubscribeItems();
  }, []);

  useEffect(() => {
    setLoading(true);
    const ordersRef = ref(db, 'orders');

    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const ordersList = [];

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const orderData = childSnapshot.val();
          const status = orderData.status || '';

          const isPreparingOrAccepted = status === 'accepted' || status === 'preparing';
          const belongsToCurrentCook = orderData.cookId === currentCookId;

          if (isPreparingOrAccepted && belongsToCurrentCook) {
            ordersList.push({
              id: childSnapshot.key,
              ...orderData
            });
          }
        });
      }

      setOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error("Error al escuchar órdenes:", error);
      setLoading(false);
    });

    return () => unsubscribeOrders();
  }, [currentCookId]);

  const handleConfirmPayment = async (orderId) => {
    try {
      const orderRef = ref(db, `orders/${orderId}`);
      await update(orderRef, { paymentConfirmed: true });
    } catch (error) {
      console.error("Error confirmando el pago:", error);
    }
  };

  const handleMarkAsReady = async (order) => {
    if (!order.paymentConfirmed) {
      alert("Pago pendiente: Debes confirmar el pago antes de marcarlo como listo.");
      return;
    }

    try {
      setActionLoading(order.id);
      const orderRef = ref(db, `orders/${order.id}`);
      
      await update(orderRef, {
        status: 'ready',
        waitingReview: true,
        reviewed: false,
        readyAt: Date.now()
      });
      
    } catch (error) {
      console.error('Error al actualizar a listo:', error);
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
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Pedidos en Cocina</h1>
        <p className="text-[var(--color-text-secondary)]">Gestiona y despacha los platos asignados que están en preparación</p>
      </div>

      {loading ? (
        <div className="text-[var(--color-text-secondary)] py-4">Cargando cocina...</div>
      ) : orders.length === 0 ? (
        <div className="text-[var(--color-text-secondary)] py-8 text-center font-medium bg-[var(--color-card-dark)] rounded-lg border border-[var(--color-border-light)]">
          No tienes pedidos en preparación asignados actualmente.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map(order => (
            <Card key={order.id} className="flex flex-col border border-[var(--color-border-light)] bg-[var(--color-card)] shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-[var(--color-text-primary)]">Pedido #{order.orderCode}</CardTitle>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Para: {order.userName || 'Usuario'}</p>
                  </div>
                  <Badge 
                    style={{
                      backgroundColor: order.status === 'preparing' ? 'var(--color-order-preparing)' : 'var(--color-order-accepted)',
                      color: '#FFFFFF'
                    }}
                  >
                    {order.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div className="text-sm space-y-1 bg-[var(--color-soft)] p-3 rounded border border-[var(--color-border-light)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)] text-xs font-medium">Método de pago:</span>
                    <span className="text-[var(--color-text-primary)] font-bold uppercase text-xs">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-[var(--color-border-light)] mt-1.5">
                    <span className="text-[var(--color-text-secondary)] text-xs font-medium">Validación:</span>
                    <span 
                      className="font-bold text-xs uppercase" 
                      style={{ color: order.paymentConfirmed ? 'var(--color-success-green)' : 'var(--color-error-red)' }}
                    >
                      {order.paymentConfirmed ? 'Pago confirmado' : 'Pago pendiente'}
                    </span>
                  </div>
                </div>

                {order.scheduledTime && (
                  <div className="text-xs bg-[var(--color-blue-ultra-light)] text-[var(--color-blue-navy)] p-2 rounded border border-[var(--color-blue-soft)] font-medium">
                    ⏰ Hora programada: {formatTimestamp(order.scheduledTime)}
                  </div>
                )}

                {order.waitingReview && (
                  <div className="text-xs text-[var(--color-error-red)] font-bold tracking-wide uppercase bg-[var(--color-error-red)]/10 p-2 rounded border border-[var(--color-error-red)]/20 text-center">
                    ⚠️ Esperando calificación...
                  </div>
                )}

                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Líneas del ticket:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {order.items && order.items.map((item, idx) => {
                      const itemName = itemIdToNameMap[item.itemId] || 'Producto';
                      return (
                        <div key={idx} className="flex justify-between text-xs text-[var(--color-text-primary)] bg-[var(--color-pure)] p-2 rounded border border-[var(--color-border-light)] font-medium">
                          <span>{itemName}</span>
                          <span className="font-bold text-[var(--color-red-primary)]">x{item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-4 border-t border-[var(--color-border-light)] flex flex-col gap-2">
                {!order.paymentConfirmed && (
                  <Button
                    className="w-full text-white font-bold text-xs uppercase tracking-wider py-2.5"
                    style={{ backgroundColor: 'var(--color-success-green)', borderColor: 'var(--color-success-green-dark)' }}
                    onClick={() => handleConfirmPayment(order.id)}
                  >
                    Confirmar Pago
                  </Button>
                )}

                <Button
                  className="w-full text-xs uppercase tracking-wider font-bold text-white"
                  style={{ backgroundColor: 'var(--color-blue-primary)' }}
                  disabled={actionLoading === order.id}
                  onClick={() => handleMarkAsReady(order)}
                >
                  {actionLoading === order.id ? 'Guardando...' : 'Listo'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}