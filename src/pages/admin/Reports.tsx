import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { FileText, TrendingUp, TrendingDown, DollarSign, Calendar, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface FinancialData {
  sales: number;
  refunds: number;
  expenses: number;
  purchases: number;
  netIncome: number;
}

interface MonthlyData {
  month: string;
  sales: number;
  expenses: number;
  profit: number;
}

const Reports = () => {
  const [period, setPeriod] = useState('current');
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<FinancialData>({
    sales: 0, refunds: 0, expenses: 0, purchases: 0, netIncome: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<Record<string, number>>({});
  const [assets, setAssets] = useState({ cash: 0, inventory: 0, receivables: 0 });
  const [liabilities, setLiabilities] = useState({ payables: 0 });

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (period) {
      case 'current':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 2));
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    return { startDate, endDate };
  };

  const fetchReportData = async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    try {
      // Fetch sales - exclude deleted and credit sales (credit sales don't count until payment)
      const { data: salesData } = await supabase
        .from('sales')
        .select('total, created_at, payment_method')
        .is('deleted_at', null)
        .neq('payment_method', 'credit')
        .gte('created_at', startStr)
        .lte('created_at', endStr + 'T23:59:59');

      const cashCardSales = salesData?.reduce((sum, s) => sum + Number(s.total), 0) || 0;

      // Fetch credit payments - these count as revenue when payment is made
      const { data: creditPaymentsData } = await supabase
        .from('credit_payments')
        .select('amount, payment_date')
        .gte('payment_date', startStr)
        .lte('payment_date', endStr + 'T23:59:59');

      const creditPaymentsRevenue = creditPaymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Total revenue = cash/card sales + credit payments received
      const totalSales = cashCardSales + creditPaymentsRevenue;

      // Fetch refunds - exclude deleted
      const { data: refundsData } = await supabase
        .from('refunds')
        .select('amount, created_at')
        .is('deleted_at', null)
        .gte('created_at', startStr)
        .lte('created_at', endStr + 'T23:59:59');

      const totalRefunds = refundsData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      // Fetch expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount, category, expense_date')
        .gte('expense_date', startStr)
        .lte('expense_date', endStr);

      const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Calculate expenses by category
      const expCat: Record<string, number> = {};
      expensesData?.forEach(e => {
        expCat[e.category] = (expCat[e.category] || 0) + Number(e.amount);
      });
      setExpensesByCategory(expCat);

      // Fetch purchase orders (received)
      const { data: purchasesData } = await supabase
        .from('purchase_orders')
        .select('total_amount, created_at')
        .eq('status', 'received')
        .gte('created_at', startStr)
        .lte('created_at', endStr + 'T23:59:59');

      const totalPurchases = purchasesData?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

      // Calculate net income
      const netIncome = totalSales - totalRefunds - totalExpenses;

      setFinancialData({
        sales: totalSales,
        refunds: totalRefunds,
        expenses: totalExpenses,
        purchases: totalPurchases,
        netIncome
      });

      // Calculate assets
      // Cash from bank deposits
      const { data: depositsData } = await supabase
        .from('bank_deposits')
        .select('amount');
      const cashInBank = depositsData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      // Inventory value (simplified: sum of price * quantity for all products)
      const { data: inventoryData } = await supabase
        .from('products')
        .select('price, stock_quantity');
      const inventoryValue = inventoryData?.reduce((sum, p) => sum + (Number(p.price) * Number(p.stock_quantity)), 0) || 0;

      // Accounts receivable - outstanding credit balances
      const { data: creditSalesData } = await supabase
        .from('credit_sales')
        .select('balance')
        .neq('status', 'paid');
      const receivables = creditSalesData?.reduce((sum, c) => sum + Number(c.balance), 0) || 0;

      setAssets({
        cash: cashInBank,
        inventory: inventoryValue,
        receivables
      });

      // Liabilities (pending purchase orders)
      const { data: pendingPO } = await supabase
        .from('purchase_orders')
        .select('total_amount')
        .in('status', ['pending', 'ordered']);
      const payables = pendingPO?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

      setLiabilities({ payables });

      // Monthly trend data
      const months: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        const monthStartStr = format(monthStart, 'yyyy-MM-dd');
        const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

        const { data: mSales } = await supabase
          .from('sales')
          .select('total')
          .is('deleted_at', null)
          .neq('payment_method', 'credit')
          .gte('created_at', monthStartStr)
          .lte('created_at', monthEndStr + 'T23:59:59');

        const { data: mCreditPayments } = await supabase
          .from('credit_payments')
          .select('amount')
          .gte('payment_date', monthStartStr)
          .lte('payment_date', monthEndStr + 'T23:59:59');

        const { data: mExpenses } = await supabase
          .from('expenses')
          .select('amount')
          .gte('expense_date', monthStartStr)
          .lte('expense_date', monthEndStr);

        const cashCardSales = mSales?.reduce((sum, s) => sum + Number(s.total), 0) || 0;
        const creditPayments = mCreditPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const sales = cashCardSales + creditPayments;
        const expenses = mExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        months.push({
          month: format(monthStart, 'MMM yyyy'),
          sales,
          expenses,
          profit: sales - expenses
        });
      }
      setMonthlyData(months);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAssets = assets.cash + assets.inventory + assets.receivables;
  const totalLiabilities = liabilities.payables;
  const equity = totalAssets - totalLiabilities;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Reports</h1>
          <p className="text-muted-foreground">Balance sheets, income statements, and financial analysis</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">This Month</SelectItem>
            <SelectItem value="last">Last Month</SelectItem>
            <SelectItem value="quarter">Last 3 Months</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="income" className="space-y-6">
        <TabsList>
          <TabsTrigger value="income">Income Statement</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Income Statement */}
        <TabsContent value="income" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(financialData.sales)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Refunds</p>
                    <p className="text-xl font-bold text-red-600">-{formatCurrency(financialData.refunds)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="text-xl font-bold text-orange-600">-{formatCurrency(financialData.expenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={financialData.netIncome >= 0 ? 'border-green-500' : 'border-red-500'}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${financialData.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <FileText className={`h-5 w-5 ${financialData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Income</p>
                    <p className={`text-xl font-bold ${financialData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(financialData.netIncome)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income Statement</CardTitle>
              <CardDescription>Profit and Loss Report</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow className="font-medium bg-muted/50">
                    <TableCell colSpan={2}>Revenue</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Sales Revenue</TableCell>
                    <TableCell className="text-right">{formatCurrency(financialData.sales)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Less: Sales Returns & Refunds</TableCell>
                    <TableCell className="text-right text-red-600">({formatCurrency(financialData.refunds)})</TableCell>
                  </TableRow>
                  <TableRow className="font-medium border-t">
                    <TableCell>Net Revenue</TableCell>
                    <TableCell className="text-right">{formatCurrency(financialData.sales - financialData.refunds)}</TableCell>
                  </TableRow>

                  <TableRow className="font-medium bg-muted/50 mt-4">
                    <TableCell colSpan={2}>Operating Expenses</TableCell>
                  </TableRow>
                  {Object.entries(expensesByCategory).map(([category, amount]) => (
                    <TableRow key={category}>
                      <TableCell className="pl-8 capitalize">{category}</TableCell>
                      <TableCell className="text-right">({formatCurrency(amount)})</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-medium border-t">
                    <TableCell>Total Expenses</TableCell>
                    <TableCell className="text-right text-red-600">({formatCurrency(financialData.expenses)})</TableCell>
                  </TableRow>

                  <TableRow className="font-bold text-lg border-t-2 bg-muted">
                    <TableCell>Net Income</TableCell>
                    <TableCell className={`text-right ${financialData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(financialData.netIncome)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow className="font-medium bg-muted/50">
                      <TableCell>Current Assets</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Cash in Bank</TableCell>
                      <TableCell className="text-right">{formatCurrency(assets.cash)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Inventory</TableCell>
                      <TableCell className="text-right">{formatCurrency(assets.inventory)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Accounts Receivable</TableCell>
                      <TableCell className="text-right">{formatCurrency(assets.receivables)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold border-t-2 bg-muted">
                      <TableCell>Total Assets</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalAssets)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Liabilities & Equity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow className="font-medium bg-muted/50">
                      <TableCell>Current Liabilities</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Accounts Payable (Pending POs)</TableCell>
                      <TableCell className="text-right">{formatCurrency(liabilities.payables)}</TableCell>
                    </TableRow>
                    <TableRow className="font-medium border-t">
                      <TableCell>Total Liabilities</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalLiabilities)}</TableCell>
                    </TableRow>

                    <TableRow className="font-medium bg-muted/50 mt-4">
                      <TableCell>Owner's Equity</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Retained Earnings</TableCell>
                      <TableCell className="text-right">{formatCurrency(equity)}</TableCell>
                    </TableRow>

                    <TableRow className="font-bold border-t-2 bg-muted">
                      <TableCell>Total Liabilities & Equity</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalAssets)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Profit/Loss</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((data, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{data.month}</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.sales)}</TableCell>
                      <TableCell className="text-right text-red-600">({formatCurrency(data.expenses)})</TableCell>
                      <TableCell className={`text-right font-medium ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.profit)}
                      </TableCell>
                      <TableCell className="text-right">
                        {data.sales > 0 ? ((data.profit / data.sales) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t-2 bg-muted">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(monthlyData.reduce((s, d) => s + d.sales, 0))}</TableCell>
                    <TableCell className="text-right text-red-600">({formatCurrency(monthlyData.reduce((s, d) => s + d.expenses, 0))})</TableCell>
                    <TableCell className="text-right">{formatCurrency(monthlyData.reduce((s, d) => s + d.profit, 0))}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;