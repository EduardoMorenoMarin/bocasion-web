import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../config/firebase'; 

import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export function StockCook() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const itemsRef = ref(db, 'items');
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const itemsList = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          itemsList.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
      }
      setItems(itemsList);
      setLoading(false);
    }, (error) => {
      console.error("Error sincronizando almacén:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStock = async (itemId, currentStock, amount) => {
    const newStock = Math.max(0, currentStock + amount);
    try {
      const itemRef = ref(db, `items/${itemId}`);
      await update(itemRef, { 
        stock: newStock,
        available: newStock > 0 
      });
    } catch (error) {
      console.error("Error al actualizar stock del item:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Inventario de Cocina</h1>
        <p className="text-[var(--color-text-secondary)]">Monitorea y ajusta las porciones y stocks disponibles en el menú</p>
      </div>

      {loading ? (
        <div className="text-[var(--color-text-secondary)] py-4">Sincronizando almacén de datos...</div>
      ) : items.length === 0 ? (
        <div className="text-[var(--color-text-secondary)] py-4 text-center">No se encontraron productos registrados.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between overflow-hidden border border-[var(--color-border-light)] bg-[var(--color-card)] shadow-sm">
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold text-[var(--color-text-primary)] tracking-tight break-words flex-1">
                      {item.name}
                    </CardTitle>
                    <Badge 
                      style={{
                        backgroundColor: item.stock > 0 ? 'var(--color-success-green)' : 'var(--color-error-red)',
                        color: '#FFFFFF'
                      }}
                      className="shrink-0 text-[10px]"
                    >
                      {item.stock > 0 ? `Unidades: ${item.stock}` : 'AGOTADO'}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                    {item.description || 'Sin ingredientes asignados.'}
                  </p>
                  
                  <p className="text-sm font-bold text-[var(--color-red-primary)] pt-1">
                    S/. {Number(item.price || 0).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between bg-[var(--color-soft)] p-2 rounded border border-[var(--color-border-light)]">
                  <span className="text-xs text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">Ajuste:</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleUpdateStock(item.id, item.stock, -1)}
                      className="w-7 h-7 rounded bg-[var(--color-pure)] hover:bg-[var(--color-card-dark)] active:scale-95 text-[var(--color-text-primary)] font-black flex items-center justify-center transition-all select-none border border-[var(--color-border-medium)] shadow-sm"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-[var(--color-text-primary)] min-w-[20px] text-center select-none">
                      {item.stock}
                    </span>
                    <button 
                      onClick={() => handleUpdateStock(item.id, item.stock, 1)}
                      className="w-7 h-7 rounded text-white font-black flex items-center justify-center hover:opacity-90 active:scale-95 transition-all select-none border"
                      style={{ backgroundColor: 'var(--color-red-primary)', borderColor: 'var(--color-red-primary-dark)' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}