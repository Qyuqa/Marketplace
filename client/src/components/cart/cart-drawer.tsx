import { Link } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import CartItem from "./cart-item";

interface CartDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function CartDrawer({ open, setOpen }: CartDrawerProps) {
  const { user } = useAuth();
  const { cartData, isLoading, clearCart, isPendingClear } = useCart();
  
  const cartItems = cartData?.items || [];
  const isEmpty = cartItems.length === 0;
  
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  const handleCheckout = () => {
    setOpen(false);
  };
  
  const handleClearCart = () => {
    clearCart();
  };
  
  if (!user) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</p>
            <p className="text-gray-500 mb-6 text-center">Please sign in to view your cart and start shopping.</p>
            <Link href="/auth">
              <Button className="w-full" onClick={() => setOpen(false)}>
                Sign In
              </Button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</p>
            <p className="text-gray-500 mb-6 text-center">Start shopping to add items to your cart.</p>
            <Button className="w-full" onClick={() => setOpen(false)}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6 flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-900">Subtotal</span>
                <span className="text-base font-medium text-gray-900">${subtotal.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50"
                  onClick={handleClearCart}
                  disabled={isPendingClear}
                >
                  {isPendingClear ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Clear Cart"
                  )}
                </Button>

                <Link href="/checkout">
                  <Button onClick={handleCheckout}>Checkout</Button>
                </Link>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Shipping, taxes, and discounts calculated at checkout.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
