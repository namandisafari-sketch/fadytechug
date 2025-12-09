import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Receipt, Search, Eye, Printer, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface Sale {
  id: string;
  receipt_number: string;
  customer_name: string | null;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  amount_paid: number;
  change_given: number;
  created_at: string;
}

interface SaleItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const Sales = () => {
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, [dateFilter]);

  const fetchSales = async () => {
    setLoading(true);
    let query = supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (dateFilter) {
      const startDate = new Date(dateFilter);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateFilter);
      endDate.setHours(23, 59, 59, 999);
      
      query = query
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query.limit(100);

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch sales', variant: 'destructive' });
    } else {
      setSales(data || []);
    }
    setLoading(false);
  };

  const viewSaleDetails = async (sale: Sale) => {
    setSelectedSale(sale);
    
    const { data } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', sale.id);

    setSaleItems(data || []);
  };

  const filteredSales = sales.filter(s => 
    s.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const todaySales = sales.filter(s => {
    const saleDate = new Date(s.created_at).toDateString();
    return saleDate === new Date().toDateString();
  });

  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sales</h1>
        <p className="text-muted-foreground">View and manage sales records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(todayTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Transactions</p>
                <p className="text-2xl font-bold">{todaySales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total (Showing)</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by receipt number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-auto"
        />
        {dateFilter && (
          <Button variant="outline" onClick={() => setDateFilter('')}>
            Clear Date
          </Button>
        )}
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Sales Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono">{sale.receipt_number}</TableCell>
                  <TableCell>{new Date(sale.created_at).toLocaleString()}</TableCell>
                  <TableCell>{sale.customer_name || 'Walk-in'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {sale.payment_method.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => viewSaleDetails(sale)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No sales found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sale Details Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Sale Details
              <Button size="icon" variant="ghost" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4 text-sm">
              <div className="text-center border-b pb-4">
                <h2 className="font-bold text-lg">FADY TECHNOLOGIES</h2>
                <p className="text-muted-foreground">Receipt #{selectedSale.receipt_number}</p>
                <p className="text-xs text-muted-foreground">{new Date(selectedSale.created_at).toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <p><strong>Customer:</strong> {selectedSale.customer_name || 'Walk-in'}</p>
                
                <div className="border-t border-b py-2 space-y-1">
                  {saleItems.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span>{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedSale.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="capitalize">{selectedSale.payment_method.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid</span>
                  <span>{formatCurrency(selectedSale.amount_paid)}</span>
                </div>
                {selectedSale.change_given > 0 && (
                  <div className="flex justify-between">
                    <span>Change</span>
                    <span>{formatCurrency(selectedSale.change_given)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
