import { Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingCart, Trash, ChevronLeft } from "lucide-react";
import CartItem from "@/components/cart/cart-item";

export default function CartPage() {
  const { cartData, isLoading, clearCart, isPendingClear } = useCart();
  
  const cartItems = cartData?.items || [];
  const isEmpty = cartItems.length === 0;
  
  const calculateTotals = () => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    
    return {
      subtotal,
      tax,
      shipping,
      total: subtotal + tax + shipping,
    };
  };
  
  const { subtotal, tax, shipping, total } = calculateTotals();
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
        <p className="text-lg text-gray-600">Loading your cart...</p>
      </div>
    );
  }
  
  if (isEmpty) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Looks like you haven't added any products to your cart yet.
            Browse our products and find something you like!
          </p>
          <Link href="/products">
            <Button size="lg" className="mx-auto">
              Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Shopping Cart</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Items ({cartItems.length})</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50"
                  onClick={clearCart}
                  disabled={isPendingClear}
                >
                  {isPendingClear ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash className="h-4 w-4 mr-2" />
                  )}
                  Clear Cart
                </Button>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex items-center text-sm text-gray-500">
                  <Link href="/products" className="flex items-center hover:text-primary-600">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Continue Shopping
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {/* Order Summary */}
          <div className="lg:w-1/3">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span>${shipping.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                
                <div className="pt-4">
                  <Link href="/checkout">
                    <Button size="lg" className="w-full">
                      Proceed to Checkout
                    </Button>
                  </Link>
                </div>
                
                <div className="pt-2 text-sm text-gray-500">
                  <p>
                    By checking out, you agree to our{" "}
                    <a href="#" className="text-primary-600 hover:underline">
                      terms and conditions
                    </a>
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Payment Methods */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-3">Secure Payment Methods</div>
              <div className="flex space-x-2 items-center">
                <img src="https://cdn-icons-png.flaticon.com/128/196/196578.png" alt="Visa" className="h-8" />
                <img src="https://cdn-icons-png.flaticon.com/128/196/196561.png" alt="MasterCard" className="h-8" />
                <img src="https://cdn-icons-png.flaticon.com/128/196/196565.png" alt="PayPal" className="h-8" />
                <img src="https://cdn-icons-png.flaticon.com/128/196/196539.png" alt="American Express" className="h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
