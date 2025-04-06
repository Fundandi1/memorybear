'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the structure of a cart item
interface CartItem {
  id: string; // Example: Product ID or a unique identifier for the customized bear
  name: string;
  price: number; // Price in DKK (or base currency unit)
  quantity: number;
  // Add other relevant properties like customization details
  customization?: { [key: string]: string | null }; // Allow null values
}

// Define the context shape
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from local storage on initial mount
  useEffect(() => {
    const storedCart = localStorage.getItem('memoryBearCart');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error("Failed to parse cart from local storage:", error);
        localStorage.removeItem('memoryBearCart'); // Clear corrupted data
      }
    }
  }, []);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    if (cartItems.length > 0) { // Avoid saving empty array unnecessarily if initial load failed
        localStorage.setItem('memoryBearCart', JSON.stringify(cartItems));
    } else {
        localStorage.removeItem('memoryBearCart');
    }
  }, [cartItems]);

  const addToCart = (itemToAdd: Omit<CartItem, 'quantity'>) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === itemToAdd.id);
      if (existingItemIndex > -1) {
        // If item exists, update its quantity or replace it
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            // Decide on update logic: increment quantity or replace?
            // For now, let's increment quantity
            quantity: updatedItems[existingItemIndex].quantity + 1,
            // Optionally update other properties if replacing:
            // name: itemToAdd.name,
            // price: itemToAdd.price,
            // customization: itemToAdd.customization
        };
        return updatedItems;
      } else {
        // If item is new, add it with quantity 1
        return [...prevItems, { ...itemToAdd, quantity: 1 }];
      }
    });
  };

  // Add removeFromCart implementation
  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Add updateCartItemQuantity implementation
  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      // If quantity is 0 or negative, remove the item
      removeFromCart(itemId);
      return;
    }

    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Add clearCart implementation
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('memoryBearCart'); // Also clear from local storage
  };

  const getCartTotal = (): number => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Add other cart functions here (remove, update, clear)

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateCartItemQuantity, 
      clearCart, 
      getCartTotal 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 