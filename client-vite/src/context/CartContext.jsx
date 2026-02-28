import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jz_cart');
      if (saved) setCartItems(JSON.parse(saved));
    } catch { /* ignore corrupt data */ }
  }, []);

  // Persist on change
  useEffect(() => {
    localStorage.setItem('jz_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product, quantity = 1) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.id === product.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + quantity };
        return copy;
      }
      return [...prev, { ...product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((i) => i.id !== productId));
    } else {
      setCartItems((prev) =>
        prev.map((i) => (i.id === productId ? { ...i, quantity } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
