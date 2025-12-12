import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Inquiries from "./pages/admin/Inquiries";
import Customers from "./pages/admin/Customers";
import Settings from "./pages/admin/Settings";
import PointOfSale from "./pages/admin/PointOfSale";
import Inventory from "./pages/admin/Inventory";
import Sales from "./pages/admin/Sales";
import Expenses from "./pages/admin/Expenses";
import Suppliers from "./pages/admin/Suppliers";

import Banking from "./pages/admin/Banking";
import PurchaseOrders from "./pages/admin/PurchaseOrders";
import Reports from "./pages/admin/Reports";
import SerialNumbers from "./pages/admin/SerialNumbers";
import StaffManagement from "./pages/admin/StaffManagement";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="pos" element={<PointOfSale />} />
                <Route path="products" element={<Products />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="sales" element={<Sales />} />
                <Route path="purchase-orders" element={<PurchaseOrders />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="suppliers" element={<Suppliers />} />
                
                <Route path="banking" element={<Banking />} />
                <Route path="reports" element={<Reports />} />
                <Route path="serial-numbers" element={<SerialNumbers />} />
                <Route path="customers" element={<Customers />} />
                <Route path="inquiries" element={<Inquiries />} />
                <Route path="settings" element={<Settings />} />
                <Route path="staff" element={<StaffManagement />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
