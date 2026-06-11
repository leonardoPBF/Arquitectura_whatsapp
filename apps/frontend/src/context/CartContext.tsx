import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';

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
  getTotal: () => number;
  getItemsCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistir carrito en localStorage
  const saveToLocalStorage = useCallback((newItems: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(newItems));
  }, []);

  const addItem = useCallback((product: any, quantity: number = 1) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item._id === product._id);

      let updated;
      if (existingItem) {
        updated = prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
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
    localStorage.removeItem('cart');
    toast.success('Carrito vaciado');
  }, []);

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
