import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, MessageSquare, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalProducts: number;
  activeProducts: number;
  totalInquiries: number;
  newInquiries: number;
  totalCustomers: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    activeProducts: 0,
    totalInquiries: 0,
    newInquiries: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, inquiriesRes, customersRes] = await Promise.all([
          supabase.from('products').select('id, is_active'),
          supabase.from('inquiries').select('id, status'),
          supabase.from('customers').select('id')
        ]);

        setStats({
          totalProducts: productsRes.data?.length || 0,
          activeProducts: productsRes.data?.filter(p => p.is_active).length || 0,
          totalInquiries: inquiriesRes.data?.length || 0,
          newInquiries: inquiriesRes.data?.filter(i => i.status === 'new').length || 0,
          totalCustomers: customersRes.data?.length || 0
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
      color: 'text-green-500'
    },
    {
      title: 'Conversion',
      value: stats.totalInquiries > 0 
        ? `${Math.round((stats.totalCustomers / stats.totalInquiries) * 100)}%` 
        : '0%',
      subtitle: 'Inquiry to customer',
      icon: TrendingUp,
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No inquiries yet. They will appear here when customers submit them.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Use the sidebar to manage products, view inquiries, and handle customers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
