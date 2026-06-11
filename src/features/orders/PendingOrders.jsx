import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, update, query, orderByChild, equalTo } from 'firebase/database';
import { db, auth } from '../../config/firebase'; 

import { Card, CardContent, CardFooter } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export function PendingOrders() {
  const [orders, setOrders] = useState([]);
  const [itemIdToNameMap, setItemIdToNameMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  const lastOrderCountRef = useRef(-1);
  const audioRef = useRef(new Audio('https://www.image2url.com/r2/default/audio/1780022833452-396fe619-1651-48c3-bc9e-98350c619a74.mp3'));
  
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
      console.error("Error cargando ítems:", error);
    });

    return () => unsubscribeItems();
  }, []);

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

      if (lastOrderCountRef.current !== -1 && currentCount > lastOrderCountRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.warn("Navegador bloqueó el audio.", err);
        });
      }

      lastOrderCountRef.current = currentCount;
      setOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error("Error cargando pedidos:", error);
      setLoading(false);
    });

    return () => unsubscribeOrders();
  }, []);

  const handleOrderAction = async (orderId, newStatus) => {
    if (newStatus === 'accepted' && !currentCookId) {
      alert("No se detectó un usuario autenticado.");
      return;
    }

    try {
      setActionLoading(orderId);
      const orderRef = ref(db, `orders/${orderId}`);
      
      const updates = { status: newStatus };
      if (newStatus === 'accepted') {
        updates.cookId = currentCookId;
      }
      
      await update(orderRef, updates);
    } catch (error) {
      console.error('Error al procesar pedido:', error);
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
            <Card key={order.id} className="flex flex-col bg-[var(--color-surface-variant)] p-4 rounded-2xl shadow-md border-none">
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex items-center">
                  <span className="font-bold text-lg text-[var(--color-primary)] mr-1">Cliente: </span>
                  <span className="text-lg text-white">{order.userName || 'Usuario'}</span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="font-bold text-sm text-[var(--color-primary)] mr-1">Correo: </span>
                  <span className="text-sm text-white">{order.userEmail || 'Sin correo'}</span>
                </div>

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

                <div className="flex flex-col mb-1">
                  <span className="font-bold text-sm text-[var(--color-primary)] mb-1">Datos del Pedido:</span>
                  <span className="text-[13px] text-white">Método: {order.paymentMethod || 'Efectivo'}</span>
                  <span className="text-[13px] text-white mt-0.5">
                    Pago: {order.paymentConfirmed ? 'Confirmado' : 'Pendiente'}
                  </span>
                  <span className="text-[13px] text-white mt-0.5">
                    Estado: {order.status || 'pending'}
                  </span>
                  
                  {order.scheduledTime && (
                    <span className="text-[13px] text-red-500 font-bold mt-1">
                      Hora de Entrega: {formatTimestamp(order.scheduledTime)}
                    </span>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="p-0 pt-3 mt-auto flex flex-col gap-2">
                <Button
                  className="w-full"
                  disabled={actionLoading === order.id}
                  onClick={() => handleOrderAction(order.id, 'accepted')}
                >
                  {actionLoading === order.id ? 'Aceptando...' : 'Aceptar'}
                </Button>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={actionLoading === order.id}
                  onClick={() => {
                    if (window.confirm("¿Estás seguro de cancelar este pedido?")) {
                      handleOrderAction(order.id, 'cancelled');
                    }
                  }}
                >
                  Cancelar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
