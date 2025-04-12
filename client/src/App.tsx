import { Switch, Route } from "wouter";
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
import VendorRegister from "@/pages/vendor-register";
import VendorDashboard from "@/pages/vendor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ProfilePage from "@/pages/profile-page";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

function App() {
  return (
    <>
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
            <ProtectedRoute path="/cart" component={CartPage} />
            <ProtectedRoute path="/checkout" component={CheckoutPage} />
            <ProtectedRoute path="/vendor/register" component={VendorRegister} />
            <ProtectedRoute path="/vendor/dashboard" component={VendorDashboard} />
            <ProtectedRoute path="/profile" component={ProfilePage} />
            <Route path="*">
              <NotFound />
            </Route>
          </Switch>
        </main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
}

export default App;
