
"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import type { CartItem, Cart, DeliveryType } from "@/types/user-section";

// ── Dummy initial cart ─────────────────────────────────
const DUMMY_CART_ITEMS: CartItem[] = [
  {
    id: "ci-1", menuItemId: "MI-1",
    name: "Classic Rib Steak",
    imageUrl: null,
    price: 645, quantity: 1,
    deliveryType: "NOW", scheduledAt: null,
    mealTimes: ["LUNCH", "DINNER"],
    description: "Juicy perfectly grilled rib steak served with garlic herb butter, roasted potatoes, and asparagus.",
  },
  {
    id: "ci-2", menuItemId: "MI-2",
    name: "Grilled Chicken Nuggets",
    imageUrl: null,
    price: 520, quantity: 2,
    deliveryType: "NOW", scheduledAt: null,
    mealTimes: ["LUNCH", "DINNER"],
    description: "Deep fried chicken nuggets with season flavour from natural spices.",
  },
];

function computeCart(items: CartItem[]): Cart {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = subtotal > 0 ? 150 : 0;
  const promoDiscount = 0;
  return { items, subtotal, deliveryFee, promoDiscount, total: subtotal + deliveryFee - promoDiscount };
}

interface CartContextValue {
  cart: Cart;
  addItem: (item: Omit<CartItem, "id">) => void;
  updateItem: (cartItemId: string, patch: { quantity?: number; deliveryType?: DeliveryType; scheduledAt?: Date | null }) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(DUMMY_CART_ITEMS);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      // If same menuItemId already in cart, increment quantity
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        toast.success(`${item.name} quantity updated`);
        return prev.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      toast.success(`${item.name} added to cart`);
      return [...prev, { ...item, id: `ci-${Date.now()}` }];
    });
  }, []);

  const updateItem = useCallback((cartItemId: string, patch: { quantity?: number; deliveryType?: DeliveryType; scheduledAt?: Date | null }) => {
    setItems((prev) => prev.map((i) => i.id === cartItemId ? { ...i, ...patch } : i));
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === cartItemId);
      if (item) toast.success(`${item.name} removed from cart`);
      return prev.filter((i) => i.id !== cartItemId);
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    toast.success("Cart cleared");
  }, []);

  const cart = computeCart(items);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, updateItem, removeItem, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}