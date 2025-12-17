import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, MessageSquare, Users, DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalProducts: number;
  activeProducts: number;
  totalInquiries: number;
  newInquiries: number;
  totalCustomers: number;
  todaySales: number;
  todayTransactions: number;
  outstandingCredit: number;
  creditCustomers: number;
}

interface CreditCustomer {
  customer_id: string;
  customer_name: string;
  total_balance: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    activeProducts: 0,
    totalInquiries: 0,
    newInquiries: 0,
    totalCustomers: 0,
    todaySales: 0,
    todayTransactions: 0,
    outstandingCredit: 0,
    creditCustomers: 0
  });
  const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const [productsRes, inquiriesRes, customersRes, salesRes, creditRes] = await Promise.all([
          supabase.from('products').select('id, is_active'),
          supabase.from('inquiries').select('id, status'),
          supabase.from('customers').select('id'),
          supabase.from('sales').select('total, created_at')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`),
          supabase.from('credit_sales')
            .select('customer_id, balance, customers(name)')
            .gt('balance', 0)
        ]);

        const todaySalesTotal = salesRes.data?.reduce((sum, s) => sum + s.total, 0) || 0;
        
        // Calculate outstanding credit
        const outstandingCredit = creditRes.data?.reduce((sum, c) => sum + c.balance, 0) || 0;
        
        // Group by customer
        const customerBalances: Record<string, CreditCustomer> = {};
        creditRes.data?.forEach((c: any) => {
          if (!customerBalances[c.customer_id]) {
            customerBalances[c.customer_id] = {
              customer_id: c.customer_id,
              customer_name: c.customers?.name || 'Unknown',
              total_balance: 0
            };
          }
          customerBalances[c.customer_id].total_balance += c.balance;
        });
        
        const creditCustomersList = Object.values(customerBalances)
          .sort((a, b) => b.total_balance - a.total_balance)
          .slice(0, 5);

        setCreditCustomers(creditCustomersList);

        setStats({
          totalProducts: productsRes.data?.length || 0,
          activeProducts: productsRes.data?.filter(p => p.is_active).length || 0,
          totalInquiries: inquiriesRes.data?.length || 0,
          newInquiries: inquiriesRes.data?.filter(i => i.status === 'new').length || 0,
          totalCustomers: customersRes.data?.length || 0,
          todaySales: todaySalesTotal,
          todayTransactions: salesRes.data?.length || 0,
          outstandingCredit,
          creditCustomers: Object.keys(customerBalances).length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Today's Sales",
      value: formatCurrency(stats.todaySales),
      subtitle: `${stats.todayTransactions} transactions`,
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      subtitle: `${stats.activeProducts} active`,
      icon: Package,
      color: 'text-blue-500'
    },
    {
      title: 'Inquiries',
      value: stats.totalInquiries,
      subtitle: `${stats.newInquiries} new`,
      icon: MessageSquare,
      color: 'text-orange-500'
    },
    {
      title: 'Customers',
      value: stats.totalCustomers,
      subtitle: 'Total registered',
      icon: Users,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Fady Technologies Admin</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Outstanding Credit Card */}
      {stats.outstandingCredit > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <CreditCard className="h-5 w-5" />
              Outstanding Credit
            </CardTitle>
            <Badge variant="outline" className="border-orange-500 text-orange-600">
              {stats.creditCustomers} customers
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-4">
              {loading ? '...' : formatCurrency(stats.outstandingCredit)}
            </div>
            
            {creditCustomers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Top Balances:</p>
                {creditCustomers.map((c) => (
                  <div key={c.customer_id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                    <span className="font-medium">{c.customer_name}</span>
                    <span className="text-orange-600 font-bold">{formatCurrency(c.total_balance)}</span>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-2 border-orange-500 text-orange-600 hover:bg-orange-500/10"
                  onClick={() => navigate('/admin/customers')}
                >
                  View All Credit Sales
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Use the sidebar to access Point of Sale, manage products, track inventory, and handle finances.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 text-sm font-medium">All systems operational</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;