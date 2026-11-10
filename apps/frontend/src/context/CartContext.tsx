import React, { createContext, useState, useContext, useCallback, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: any, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  removePurchasedItems: (purchased: CartItem[]) => void;
  getTotal: () => number;
  getItemsCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const storageKey = `lumina-cart:${user?.id || 'guest'}`;
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(saved) ? saved.filter((item): item is CartItem =>
        item && typeof item._id === 'string' && typeof item.name === 'string' &&
        Number.isFinite(item.price) && item.price >= 0 && Number.isSafeInteger(item.quantity) && item.quantity > 0) : [];
    } catch { return []; }
  });

  // Persistir carrito en localStorage
  const saveToLocalStorage = useCallback((newItems: CartItem[]) => {
    localStorage.setItem(storageKey, JSON.stringify(newItems));
  }, [storageKey]);

  const addItem = useCallback((product: any, quantity: number = 1) => {
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 100 || !Number.isFinite(product.price) || product.price < 0) return;
    setItems((prev) => {
      const existingItem = prev.find((item) => item._id === product._id);

      let updated;
      if (existingItem) {
        updated = prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: Math.min(100, item.quantity + quantity) }
            : item
        );
      } else {
        updated = [
          ...prev,
          {
            _id: product._id,
            name: product.name,
            price: product.price,
            quantity,
            imageUrl: product.imageUrl,
          },
        ];
      }

      saveToLocalStorage(updated);
      toast.success(`${product.name} agregado al carrito`);
      return updated;
    });
  }, [saveToLocalStorage]);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item._id !== productId);
      saveToLocalStorage(updated);
      toast.success('Producto removido del carrito');
      return updated;
    });
  }, [saveToLocalStorage]);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (!Number.isSafeInteger(quantity) || quantity > 100) return;
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }

      setItems((prev) => {
        const updated = prev.map((item) =>
          item._id === productId ? { ...item, quantity } : item
        );
        saveToLocalStorage(updated);
        return updated;
      });
    },
    [removeItem, saveToLocalStorage]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(storageKey);
    toast.success('Carrito vaciado');
  }, [storageKey]);

  const removePurchasedItems = useCallback((purchased: CartItem[]) => {
    setItems(prev => {
      const updated = prev.map(item => ({ ...item, quantity: Math.max(0, item.quantity - (purchased.find(p => p._id === item._id)?.quantity || 0)) })).filter(item => item.quantity > 0);
      saveToLocalStorage(updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const getItemsCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        removePurchasedItems,
        getTotal,
        getItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};
