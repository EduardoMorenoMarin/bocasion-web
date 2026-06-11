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
          if (itemId && itemName) map[itemId] = itemName;
        });
      }
      setItemIdToNameMap(map);
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
          if ((orderData.status === 'accepted' || orderData.status === 'preparing') && orderData.cookId === currentCookId) {
            ordersList.push({ id: childSnapshot.key, ...orderData });
          }
        });
      }
      setOrders(ordersList);
      setLoading(false);
    });
    return () => unsubscribeOrders();
  }, [currentCookId]);

  const handleOrderAction = async (orderId, newStatus) => {
    try {
      setActionLoading(orderId);
      await update(ref(db, `orders/${orderId}`), { status: newStatus });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPayment = async (orderId) => {
    await update(ref(db, `orders/${orderId}`), { paymentConfirmed: true });
  };

  const handleMarkAsReady = async (order) => {
    if (!order.paymentConfirmed) {
      alert("Pago pendiente.");
      return;
    }
    setActionLoading(order.id);
    await update(ref(db, `orders/${order.id}`), { status: 'ready', waitingReview: true, readyAt: Date.now() });
    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Pedidos en Cocina</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map(order => (
          <Card key={order.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg text-white">Pedido #{order.orderCode}</CardTitle>
              <p className="text-sm text-gray-400">Cliente: {order.userName}</p>
              <p className="text-xs text-blue-400 font-mono">{order.userEmail}</p>
              <Badge>{order.status.toUpperCase()}</Badge>
            </CardHeader>
            <CardContent>
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm text-white">
                  <span>{itemIdToNameMap[item.itemId]}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {!order.paymentConfirmed && <Button className="w-full bg-green-700" onClick={() => handleConfirmPayment(order.id)}>Confirmar Pago</Button>}
              <Button className="w-full" onClick={() => handleMarkAsReady(order)}>Listo</Button>
              <Button className="w-full bg-red-600" onClick={() => { if(window.confirm("¿Cancelar?")) handleOrderAction(order.id, 'cancelled'); }}>Cancelar</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
