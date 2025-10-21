import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import ProductDetail from "@/pages/product-detail";
import ProductsPage from "@/pages/products-page";
import VendorDetail from "@/pages/vendor-detail";
import VendorsPage from "@/pages/vendors-page";
import CartPage from "@/pages/cart-page";
import CheckoutPage from "@/pages/checkout-page";
import AuthPage from "@/pages/auth-page";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import VendorRegister from "@/pages/vendor-register";
import VendorDashboard from "@/pages/vendor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ProfilePage from "@/pages/profile-page";
import LogoutPage from "@/pages/logout-page";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

// This component handles URL parameters and session clearing
function SessionManager() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Check if there's a logout parameter in the URL
    if (location.includes('logout=')) {
      console.log('Logout parameter detected in URL, performing deep session cleaning');
      
      // Do an additional server-side session verification
      fetch('/api/check-session')
        .then(res => res.json())
        .then(data => {
          console.log('Session check after logout:', data);
          
          // If somehow still authenticated, try one more logout
          if (data.authenticated) {
            console.log('Still authenticated, trying another logout');
            
            // Make one more logout request
            fetch('/api/logout-action', {
              method: 'POST',
              credentials: 'include',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            }).then(() => {
              // Force a page reload to ensure everything is reset
              window.location.reload();
            });
          }
        })
        .catch(err => {
          console.error('Error checking session:', err);
        });
      
      // Clear all client-side state
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies with multiple approaches
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Specifically target the session cookie
      document.cookie = 'connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'connect.sid=; Path=/; Domain=' + window.location.hostname + '; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'connect.sid=; Max-Age=0;';
      
      // Clear the URL parameter without reloading (cleaner URL)
      window.history.replaceState({}, document.title, '/');
    }
  }, [location]);
  
  return null; // This component doesn't render anything
}

function App() {
  return (
    <>
      {/* Add session manager to handle logout via URL parameters */}
      <SessionManager />
      
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/products" component={ProductsPage} />
            <Route path="/products/:id" component={ProductDetail} />
            <Route path="/vendors" component={VendorsPage} />
            <Route path="/vendors/:id" component={VendorDetail} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/forgot-password" component={ForgotPasswordPage} />
            <Route path="/reset-password" component={ResetPasswordPage} />
            <Route path="/logout" component={LogoutPage} />
            <ProtectedRoute path="/cart" component={CartPage} />
            <ProtectedRoute path="/checkout" component={CheckoutPage} />
            <ProtectedRoute path="/vendor/register" component={VendorRegister} />
            <ProtectedRoute path="/vendor/dashboard" component={VendorDashboard} />
            <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
            <ProtectedRoute path="/profile" component={ProfilePage} />
            <Route path="*">
              <NotFound />
            </Route>
          </Switch>
        </main>
        <Footer />
      </div>
      <PWAInstallBanner />
      <Toaster />
    </>
  );
}

export default App;
