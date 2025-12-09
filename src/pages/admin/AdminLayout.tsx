import { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Receipt,
  Wallet,
  Building2,
  RotateCcw,
  ClipboardList,
  ShoppingBag,
  FileText,
  Hash,
  Moon,
  Sun
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import fadyLogo from '@/assets/fady-logo.png';
import { Loader2 } from 'lucide-react';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/pos', icon: ShoppingCart, label: 'Point of Sale' },
  { path: '/admin/products', icon: Package, label: 'Products' },
  { path: '/admin/inventory', icon: ClipboardList, label: 'Inventory' },
  { path: '/admin/serial-numbers', icon: Hash, label: 'Serial Numbers' },
  { path: '/admin/sales', icon: Receipt, label: 'Sales & Refunds' },
  { path: '/admin/purchase-orders', icon: ShoppingBag, label: 'Purchase Orders' },
  { path: '/admin/expenses', icon: Wallet, label: 'Expenses' },
  { path: '/admin/suppliers', icon: Truck, label: 'Suppliers' },
  { path: '/admin/banking', icon: Building2, label: 'Banking' },
  { path: '/admin/reports', icon: FileText, label: 'Reports' },
  { path: '/admin/customers', icon: Users, label: 'Customers' },
  { path: '/admin/inquiries', icon: MessageSquare, label: 'Inquiries' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

const AdminLayout = () => {
  const { user, loading, isStaff, isAdmin, signOut, userRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !isStaff) {
      navigate('/');
    }
  }, [user, loading, isStaff, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isStaff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Logo Watermark */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.02]"
        style={{
          backgroundImage: `url(${fadyLogo})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: '50%'
        }}
      />

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <img src={fadyLogo} alt="Fady Technologies" className="h-8" />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40 transition-transform duration-300",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-border">
            <img src={fadyLogo} alt="Fady Technologies" className="h-10" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-secondary text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle & User info & Logout */}
          <div className="p-4 border-t border-border space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3" 
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium capitalize">{userRole}</span>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3" 
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen relative z-10">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
