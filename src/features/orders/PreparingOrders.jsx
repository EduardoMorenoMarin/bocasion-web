import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, auth } from '../../config/firebase'; 

import { Card, CardContent, CardFooter } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

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
          {orders.map(order => {
            // Replicando la lógica exacta de OrderAdapter.java para mostrar el botón de pago
            const isTarjeta = order.paymentMethod && order.paymentMethod.toLowerCase().includes("tarjeta");
            const showConfirmPayment = !order.paymentConfirmed && isTarjeta;

            return (
              <Card key={order.id} className="flex flex-col bg-[var(--color-surface-variant)] p-4 rounded-2xl shadow-md border-none">
                <CardContent className="p-0 flex-1 flex flex-col">
                  {/* Cabecera del Cliente */}
                  <div className="flex items-center">
                    <span className="font-bold text-lg text-[var(--color-primary)] mr-1">Cliente: </span>
                    <span className="text-lg text-white">{order.userName || 'Usuario'}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="font-bold text-sm text-[var(--color-primary)] mr-1">Correo: </span>
                    <span className="text-sm text-white">{order.userEmail || 'Sin correo'}</span>
                  </div>

                  {/* Lista de Productos */}
                  <div className="mt-4 mb-1">
                    <span className="font-bold text-sm text-[var(--color-primary)]">PEDIDO:</span>
                    <div className="text-sm text-white mt-1 whitespace-pre-line">
                      {order.items && order.items.map((item, idx) => {
                        const itemName = itemIdToNameMap[item.itemId] || 'Producto';
                        return (
                          <div key={idx}>- {itemName} (x{item.quantity})</div>
                        );
                      })}
                    </div>
                  </div>

                  <hr className="border-white/20 my-3" />

                  {/* Datos del Pedido */}
                  <div className="flex flex-col mb-1">
                    <span className="font-bold text-sm text-[var(--color-primary)] mb-1">Datos del Pedido:</span>
                    <span className="text-[13px] text-white">Método: {order.paymentMethod || 'Efectivo'}</span>
                    <span className="text-[13px] text-white mt-0.5">
                      Pago: {order.paymentConfirmed ? 'Confirmado' : 'Pendiente'}
                    </span>
                    <span className="text-[13px] text-white mt-0.5">
                      Estado: {order.status}
                    </span>
                    
                    {order.scheduledTime && (
                      <span className="text-[13px] text-red-500 font-bold mt-1">
                        Hora de Entrega: {formatTimestamp(order.scheduledTime)}
                      </span>
                    )}

                    {/* Mostrar alerta de calificación si aplica */}
                    {order.waitingReview && !order.reviewed && (
                      <span className="text-[13px] text-red-500 font-bold mt-2">
                        Esperando calificación...
                      </span>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="p-0 pt-3 mt-auto flex flex-col gap-2">
                  {showConfirmPayment && (
                    <Button
                      className="w-full text-white font-bold"
                      style={{ backgroundColor: '#2e7d32' }} // Similar a holo_green_dark
                      onClick={() => handleConfirmPayment(order.id)}
                    >
                      Confirmar Pago
                    </Button>
                  )}

                  <Button
                    className="w-full text-white font-bold"
                    disabled={actionLoading === order.id}
                    onClick={() => handleMarkAsReady(order)}
                  >
                    {actionLoading === order.id ? 'Guardando...' : 'Listo'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
