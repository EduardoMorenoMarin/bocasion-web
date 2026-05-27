import { create } from 'zustand';
import { db } from '../config/firebase';
import { ref, onValue, query, orderByChild, equalTo, update } from 'firebase/database';

export const useOrderStore = create((set, get) => ({
  pendingOrders: [],
  historyOrders: [],
  loading: false,
  error: null,
  activeListener: null,

  listenToOrders: (cookId) => {
    if (!cookId) return;

    set({ loading: true, error: null });

    const { activeListener } = get();
    if (activeListener) {
      activeListener();
    }

    const ordersRef = ref(db, 'orders');
    const cookOrdersQuery = query(ordersRef, orderByChild('cookId'), equalTo(cookId));

    const unsubscribe = onValue(cookOrdersQuery, (snapshot) => {
      try {
        const data = snapshot.val();
        if (!data) {
          console.log('[DEBUG] No orders found for cookId:', cookId);
          set({ pendingOrders: [], historyOrders: [], loading: false });
          return;
        }

        const allOrders = Object.entries(data).map(([id, order]) => ({
          id,
          ...order
        }));

        console.log('[DEBUG] Raw orders from Firebase:', allOrders);
        const statusValues = [...new Set(allOrders.map(o => o.status))];
        console.log('[DEBUG] Unique status values in DB:', statusValues);

        // Filter based on verified database statuses
        // Note: Assuming "ready" might be considered active or history depending on how the app uses it
        // We will include "ready" in pending for now so it's not lost, and we can adjust if needed
        const pending = allOrders.filter(o =>
          o.status === 'pending' ||
          o.status === 'preparing' ||
          o.status === 'ready'
        );

        console.log('[DEBUG] Filtered pending orders:', pending);

        // Sort by time
        pending.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

        const history = allOrders.filter(o =>
          o.status === 'completed' ||
          o.status === 'cancelled'
        );

        console.log('[DEBUG] Filtered history orders:', history);

        history.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        set({
          pendingOrders: pending,
          historyOrders: history,
          loading: false
        });
        console.log('[DEBUG] Zustand state updated successfully');
      } catch (err) {
        console.error('[DEBUG] Error processing orders:', err);
        set({ error: err.message, loading: false });
      }
    }, (error) => {
      console.error('[DEBUG] Firebase listener error:', error);
      set({ error: error.message, loading: false });
    });

    set({ activeListener: unsubscribe });
    return unsubscribe;
  },

  updateOrderStatus: async (orderId, newStatus) => {
    try {
      set({ error: null });
      const updates = { status: newStatus };

      const now = new Date().toISOString();
      if (newStatus === 'ready') {
        updates.readyAt = now;
      } else if (newStatus === 'completed') {
        updates.completedAt = now;
      }

      await update(ref(db, `orders/${orderId}`), updates);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  cleanup: () => {
    const { activeListener } = get();
    if (activeListener) {
      activeListener();
      set({ activeListener: null });
    }
  }
}));
