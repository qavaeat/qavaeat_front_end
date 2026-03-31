
"use client";

import { CartProvider } from "@/context/CartContext";
import { PlanProvider } from "@/context/PlanContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <PlanProvider>
        {children}
      </PlanProvider>
    </CartProvider>
  );
}