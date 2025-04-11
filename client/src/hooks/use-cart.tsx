import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CartItem, Cart, InsertCartItem } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

type CartContextType = {
  cartData: { cart: Cart; items: (CartItem & { product: any })[] } | null;
  cartItems: (CartItem & { product: any })[] | null;
  isLoading: boolean;
  error: Error | null;
  addToCart: (item: Omit<InsertCartItem, "cartId" | "price">) => void;
  updateCartItem: (id: number, quantity: number) => void;
  removeCartItem: (id: number) => void;
  clearCart: () => void;
  isPendingAdd: boolean;
  isPendingUpdate: boolean;
  isPendingRemove: boolean;
  isPendingClear: boolean;
};

export const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const {
    data: cartData,
    error,
    isLoading,
  } = useQuery<{ cart: Cart; items: (CartItem & { product: any })[] }>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (item: Omit<InsertCartItem, "cartId" | "price">) => {
      const res = await apiRequest("POST", "/api/cart/items", item);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const res = await apiRequest("PUT", `/api/cart/items/${id}`, { quantity });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const removeCartItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/cart/items/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/cart");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const addToCart = (item: Omit<InsertCartItem, "cartId" | "price">) => {
    addToCartMutation.mutate(item);
  };

  const updateCartItem = (id: number, quantity: number) => {
    updateCartItemMutation.mutate({ id, quantity });
  };

  const removeCartItem = (id: number) => {
    removeCartItemMutation.mutate(id);
  };

  const clearCart = () => {
    clearCartMutation.mutate();
  };

  return (
    <CartContext.Provider
      value={{
        cartData: cartData ?? null,
        cartItems: cartData?.items ?? null,
        isLoading,
        error,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
        isPendingAdd: addToCartMutation.isPending,
        isPendingUpdate: updateCartItemMutation.isPending,
        isPendingRemove: removeCartItemMutation.isPending,
        isPendingClear: clearCartMutation.isPending,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
