import { CartItem as CartItemType, Product } from "@shared/schema";
import { Trash, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

interface CartItemProps {
  item: CartItemType & { product: Product };
}

export default function CartItem({ item }: CartItemProps) {
  const { updateCartItem, removeCartItem, isPendingRemove, isPendingUpdate } = useCart();
  
  const handleIncrement = () => {
    updateCartItem(item.id, item.quantity + 1);
  };
  
  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateCartItem(item.id, item.quantity - 1);
    } else {
      removeCartItem(item.id);
    }
  };
  
  const handleRemove = () => {
    removeCartItem(item.id);
  };
  
  return (
    <div className="flex items-start py-4 border-b border-gray-100">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        <img
          src={item.product.imageUrl}
          alt={item.product.name}
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div className="ml-4 flex-1">
        <div className="flex justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {item.product.name}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Price: ${item.price.toFixed(2)}
            </p>
          </div>
          <p className="text-sm font-medium text-gray-900">
            ${(item.price * item.quantity).toFixed(2)}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={handleDecrement}
              disabled={isPendingUpdate || isPendingRemove}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="px-2 text-sm">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={handleIncrement}
              disabled={isPendingUpdate}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleRemove}
            disabled={isPendingRemove}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
