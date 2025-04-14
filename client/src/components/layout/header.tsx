import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { 
  ShoppingCart, 
  Heart, 
  User, 
  Search, 
  Menu, 
  ChevronDown,
  LogOut
} from "lucide-react";
import CartDrawer from "../cart/cart-drawer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, forceLogout } from "@/lib/queryClient";
import QyuqaLogo from "@/assets/qyuqa-logo.png";

export default function Header() {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [location, setLocation] = useLocation();
  
  const { user, logoutMutation } = useAuth();
  const { cartItems } = useCart();
  const { toast } = useToast();
  
  const toggleMobileSearch = () => setShowMobileSearch(prev => !prev);
  const toggleMobileMenu = () => setShowMobileMenu(prev => !prev);
  
  const toggleCartDrawer = () => setShowCartDrawer(prev => !prev);
  
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Display logout toast
    toast({
      title: "Logging out...",
      description: "Please wait while we log you out",
    });
    
    try {
      // Use the direct forceLogout function - don't use await here to prevent blocking
      forceLogout();
    } catch (error) {
      console.error("Error in handleLogout:", error);
      // Handle error gracefully
      toast({
        title: "Logout Error",
        description: "There was a problem logging out. The page will reload.",
        variant: "destructive"
      });
      
      // Force reload anyway after a slight delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };
  
  const cartItemCount = cartItems ? cartItems.length : 0;
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src={QyuqaLogo} alt="Qyuqa Logo" className="h-10 w-auto" />
          </Link>
          
          {/* Search Bar (Medium screens and up) */}
          <div className="hidden md:flex flex-1 mx-8">
            <div className="relative w-full max-w-xl">
              <Input
                type="text"
                placeholder="Search products, vendors, categories..."
                className="w-full py-2 pl-10 pr-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition duration-150"
              />
              <Search className="absolute left-3 top-3 text-gray-500 h-4 w-4" />
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-600 hover:text-primary-600">Categories</Link>
            <Link href="/vendors" className="text-gray-600 hover:text-primary-600">Vendors</Link>
          </nav>
          
          {/* User Actions */}
          <div className="flex items-center space-x-3 md:space-x-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-primary-600 md:hidden"
              onClick={toggleMobileSearch}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-primary-600 relative"
            >
              <Heart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">0</span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-primary-600 relative"
              onClick={toggleCartDrawer}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
            
            {/* User dropdown or login button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary-600 hidden md:flex">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    Hi, {user.fullName || user.username}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile" className="w-full">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/orders" className="w-full">Orders</Link>
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem>
                      <Link href="/admin/dashboard" className="w-full">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  
                  {user.isVendor ? (
                    <DropdownMenuItem>
                      <Link href="/vendor/dashboard" className="w-full">Vendor Dashboard</Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem>
                      <Link href="/vendor/register" className="w-full">Become a Vendor</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth" className="hidden md:block">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-primary-600 md:hidden"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Search (Initially Hidden) */}
        {showMobileSearch && (
          <div className="py-3 md:hidden">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search..."
                className="w-full py-2 pl-10 pr-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white"
              />
              <Search className="absolute left-3 top-3 text-gray-500 h-4 w-4" />
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Menu (Initially Hidden) */}
      {showMobileMenu && (
        <div className="bg-white py-4 px-4 border-t border-gray-200 md:hidden">
          <nav className="flex flex-col space-y-3">
            <Link href="/products" className="text-gray-600 hover:text-primary-600 py-2">Categories</Link>
            <Link href="/vendors" className="text-gray-600 hover:text-primary-600 py-2">Vendors</Link>
            {user ? (
              <>
                <Link href="/profile" className="text-gray-600 hover:text-primary-600 py-2">My Account</Link>
                <Link href="/orders" className="text-gray-600 hover:text-primary-600 py-2">Orders</Link>
                {user.isAdmin && (
                  <Link href="/admin/dashboard" className="text-gray-600 hover:text-primary-600 py-2">
                    Admin Dashboard
                  </Link>
                )}
                
                {user.isVendor ? (
                  <Link href="/vendor/dashboard" className="text-gray-600 hover:text-primary-600 py-2">
                    Vendor Dashboard
                  </Link>
                ) : (
                  <Link href="/vendor/register" className="text-gray-600 hover:text-primary-600 py-2">
                    Become a Vendor
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="text-left text-gray-600 hover:text-primary-600 py-2 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <div className="pt-2 border-t border-gray-100 flex space-x-4">
                <Link href="/auth" className="w-full">
                  <Button className="w-full">Sign In</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
      
      {/* Cart Drawer */}
      <CartDrawer open={showCartDrawer} setOpen={setShowCartDrawer} />
    </header>
  );
}
