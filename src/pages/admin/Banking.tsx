import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Plus, Wallet, ArrowUpRight, ArrowDownRight, XCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { getUgandaDateString, formatUgandaDate, formatUgandaDateTime } from '@/lib/utils';

interface BankSettings {
  bankName: string;
  accountNumber: string;
  accountName: string;
  autoDepositOnClose: boolean;
}

interface BankDeposit {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string | null;
  deposit_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

interface CashRegister {
  id: string;
  date: string;
  opening_balance: number;
  total_sales: number;
  total_refunds: number;
  total_expenses: number;
  total_deposits: number;
  closing_balance: number;
  notes: string | null;
}

const Banking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<BankDeposit[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [closeShiftDialogOpen, setCloseShiftDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [closingShift, setClosingShift] = useState(false);
  const [bankBalance, setBankBalance] = useState(0);
  const [cashExpenses, setCashExpenses] = useState(0);
  const [bankExpenses, setBankExpenses] = useState(0);
  const [cashSupplierPayments, setCashSupplierPayments] = useState(0);
  const [bankSupplierPayments, setBankSupplierPayments] = useState(0);
  const [bankSettings, setBankSettings] = useState<BankSettings | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchDeposits();
    fetchTodayCashRegister();
    fetchBalances();
    fetchBankSettings();
  }, []);

  const fetchBankSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'bank_settings')
      .maybeSingle();
    
    if (data?.value && typeof data.value === 'object') {
      setBankSettings(data.value as unknown as BankSettings);
    }
  };

  const fetchDeposits = async () => {
    const { data, error } = await supabase
      .from('bank_deposits')
      .select('*')
      .order('deposit_date', { ascending: false });

    if (!error) setDeposits(data || []);
  };

  const fetchBalances = async () => {
    // Get total deposits to bank
    const { data: allDeposits } = await supabase
      .from('bank_deposits')
      .select('amount');
    const totalDeposited = allDeposits?.reduce((sum, d) => sum + d.amount, 0) || 0;

    // Get expenses by source
    const { data: expensesFromCash } = await supabase
      .from('expenses')
      .select('amount')
      .eq('payment_source', 'cash_register');
    setCashExpenses(expensesFromCash?.reduce((sum, e) => sum + e.amount, 0) || 0);

    const { data: expensesFromBank } = await supabase
      .from('expenses')
      .select('amount')
      .eq('payment_source', 'bank');
    const bankExp = expensesFromBank?.reduce((sum, e) => sum + e.amount, 0) || 0;
    setBankExpenses(bankExp);

    // Get supplier payments by source
    const { data: supplierPaymentsFromCash } = await supabase
      .from('supplier_payments')
      .select('amount')
      .eq('payment_source', 'cash_register');
    setCashSupplierPayments(supplierPaymentsFromCash?.reduce((sum, p) => sum + p.amount, 0) || 0);

    const { data: supplierPaymentsFromBank } = await supabase
      .from('supplier_payments')
      .select('amount')
      .eq('payment_source', 'bank');
    const bankSupp = supplierPaymentsFromBank?.reduce((sum, p) => sum + p.amount, 0) || 0;
    setBankSupplierPayments(bankSupp);

    // Calculate bank balance
    setBankBalance(totalDeposited - bankExp - bankSupp);
  };

  const fetchTodayCashRegister = async (forDateStr?: string): Promise<number> => {
    const dateStr = forDateStr || new Date().toISOString().split('T')[0];

    const startTs = `${dateStr}T00:00:00+03:00`;
    const endTs = `${dateStr}T23:59:59+03:00`;

    // CASH sales only (drawer cash). Ignore credit/card/mobile_money/bank transfers for drawer-banking.
    const { data: salesData } = await supabase
      .from('sales')
      .select('total, payment_method')
      .gte('created_at', startTs)
      .lte('created_at', endTs);

    const totalCashSales =
      salesData?.filter((s) => s.payment_method === 'cash').reduce((sum, s) => sum + s.total, 0) || 0;

    // Credit payments collected (cash coming into drawer)
    const { data: creditPaymentsData } = await supabase
      .from('credit_payments')
      .select('amount, payment_method')
      .gte('payment_date', startTs)
      .lte('payment_date', endTs)
      .eq('payment_method', 'cash');

    const totalCreditPayments = creditPaymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Exchange top-ups (extra cash collected from exchanges)
    const { data: exchangesData } = await supabase
      .from('exchanges')
      .select('amount_paid, refund_given')
      .eq('cash_date', dateStr);

    const totalExchangeTopUps = exchangesData?.reduce((sum, e) => sum + (e.amount_paid || 0), 0) || 0;
    const totalExchangeRefunds = exchangesData?.reduce((sum, e) => sum + (e.refund_given || 0), 0) || 0;

    // Refunds reduce drawer cash
    const { data: refundsData } = await supabase
      .from('refunds')
      .select('amount')
      .gte('created_at', startTs)
      .lte('created_at', endTs);

    const totalRefunds = refundsData?.reduce((sum, r) => sum + r.amount, 0) || 0;

    // Cash register expenses only
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('expense_date', dateStr)
      .eq('payment_source', 'cash_register');

    const totalExpenses = expensesData?.reduce((sum, e) => sum + e.amount, 0) || 0;

    // Cash register supplier payments only
    const { data: supplierPaymentsData } = await supabase
      .from('supplier_payments')
      .select('amount')
      .eq('payment_date', dateStr)
      .eq('payment_source', 'cash_register');

    const totalSupplierPayments = supplierPaymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Get deposits already made for this date - these are LOCKED and cannot be used again
    const { data: depositsData } = await supabase
      .from('bank_deposits')
      .select('amount')
      .eq('deposit_date', dateStr);

    const totalDepositsForDay = depositsData?.reduce((sum, d) => sum + d.amount, 0) || 0;

    // Get or create cash register entry
    const { data: existingRegister } = await supabase
      .from('cash_register')
      .select('*')
      .eq('date', dateStr)
      .maybeSingle();

    // Opening balance = previous day's closing (after deposits), otherwise 0
    const previousDay = new Date(`${dateStr}T00:00:00`);
    previousDay.setDate(previousDay.getDate() - 1);
    const previousDayStr = previousDay.toISOString().split('T')[0];

    const { data: previousDayRegister } = await supabase
      .from('cash_register')
      .select('closing_balance')
      .eq('date', previousDayStr)
      .maybeSingle();

    const openingBalance = existingRegister?.opening_balance ?? previousDayRegister?.closing_balance ?? 0;

    // Drawer cash for the day (what should be bankable):
    // opening + cash sales + credit payments + exchange top-ups - exchange refunds - refunds - cash expenses - cash supplier payments - deposits already made
    // CRITICAL: Deposits are subtracted because once deposited, that money is LOCKED in the bank
    const totalInflows = totalCashSales + totalCreditPayments + totalExchangeTopUps;
    const totalOutflows = totalRefunds + totalExchangeRefunds + totalExpenses + totalSupplierPayments + totalDepositsForDay;
    const closing = openingBalance + totalInflows - totalOutflows;

    if (existingRegister) {
      await supabase
        .from('cash_register')
        .update({
          opening_balance: openingBalance,
          total_sales: totalInflows,
          total_refunds: totalRefunds + totalExchangeRefunds,
          total_expenses: totalExpenses,
          total_deposits: totalDepositsForDay,
          closing_balance: closing,
        })
        .eq('id', existingRegister.id);

      setCashRegister({
        ...existingRegister,
        opening_balance: openingBalance,
        total_sales: totalInflows,
        total_refunds: totalRefunds + totalExchangeRefunds,
        total_expenses: totalExpenses,
        total_deposits: totalDepositsForDay,
        closing_balance: closing,
      });
    } else {
      const { data: newRegister, error } = await supabase
        .from('cash_register')
        .insert({
          date: dateStr,
          opening_balance: openingBalance,
          total_sales: totalInflows,
          total_refunds: totalRefunds + totalExchangeRefunds,
          total_expenses: totalExpenses,
          total_deposits: totalDepositsForDay,
          closing_balance: closing,
        })
        .select()
        .single();

      if (!error) setCashRegister(newRegister);
    }

    return closing;
  };

  const recordDeposit = async () => {
    if (!amount || !bankName) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('bank_deposits')
        .insert({
          amount: parseFloat(amount),
          bank_name: bankName,
          account_number: accountNumber || null,
          deposit_date: depositDate,
          reference_number: referenceNumber || null,
          notes: notes || null,
          deposited_by: user?.id
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Bank deposit recorded' });
      setDialogOpen(false);
      resetForm();
      fetchDeposits();
      fetchTodayCashRegister();
      fetchBalances();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setBankName('');
    setAccountNumber('');
    setDepositDate(new Date().toISOString().split('T')[0]);
    setReferenceNumber('');
    setNotes('');
  };

  const closeShift = async () => {
    if (!bankSettings?.bankName) {
      toast({ 
        title: 'Bank not configured', 
        description: 'Please configure your bank account in Settings before closing shift', 
        variant: 'destructive' 
      });
      return;
    }

    if (!cashRegister || cashRegister.closing_balance <= 0) {
      toast({ 
        title: 'Cannot close shift', 
        description: 'No cash balance available to deposit', 
        variant: 'destructive' 
      });
      return;
    }

    setClosingShift(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Create bank deposit for the closing balance
      const { error } = await supabase
        .from('bank_deposits')
        .insert({
          amount: cashRegister.closing_balance,
          bank_name: bankSettings.bankName,
          account_number: bankSettings.accountNumber || null,
          deposit_date: today,
          reference_number: `SHIFT-${today}`,
          notes: `Automatic deposit from shift close - ${formatUgandaDateTime(new Date().toISOString())}`,
          deposited_by: user?.id
        });

      if (error) throw error;

      // Update cash register with the deposit
      await supabase
        .from('cash_register')
        .update({
          total_deposits: (cashRegister.total_deposits || 0) + cashRegister.closing_balance,
          closing_balance: 0,
          closed_by: user?.id
        })
        .eq('id', cashRegister.id);

      toast({ 
        title: 'Shift closed successfully', 
        description: `${formatCurrency(cashRegister.closing_balance)} deposited to ${bankSettings.bankName}` 
      });
      
      setCloseShiftDialogOpen(false);
      fetchDeposits();
      fetchTodayCashRegister();
      fetchBalances();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setClosingShift(false);
    }
  };

  const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Banking</h1>
          <p className="text-muted-foreground">Manage bank deposits and cash flow</p>
        </div>
        <div className="flex gap-2">
          {bankSettings?.bankName && cashRegister && cashRegister.closing_balance > 0 && (
            <Button 
              variant="default" 
              onClick={() => setCloseShiftDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Close Shift
            </Button>
          )}
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (open) {
                const todayStr = new Date().toISOString().split('T')[0];
                setDepositDate(todayStr);
                void (async () => {
                  const bankable = await fetchTodayCashRegister(todayStr);
                  setAmount(bankable > 0 ? String(bankable) : '');
                })();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Record Deposit
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Bank Deposit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Amount (UGX) *</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label>Bank Name *</Label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Bank name"
                />
              </div>

              <div>
                <Label>Account Number</Label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Deposit Date</Label>
                  <Input
                    type="date"
                    value={depositDate}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      setDepositDate(nextDate);
                      void (async () => {
                        const bankable = await fetchTodayCashRegister(nextDate);
                        setAmount(bankable > 0 ? String(bankable) : '');
                      })();
                    }}
                  />
                </div>
                <div>
                  <Label>Reference #</Label>
                  <Input
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Deposit slip #"
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes"
                />
              </div>

              <Button onClick={recordDeposit} disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Record Deposit'}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Close Shift Dialog */}
      <Dialog open={closeShiftDialogOpen} onOpenChange={setCloseShiftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Close Shift & Deposit to Bank
            </DialogTitle>
            <DialogDescription>
              This will deposit the full cash register balance to your configured bank account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Amount to deposit</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(cashRegister?.closing_balance || 0)}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bank Name</span>
                <span className="font-medium">{bankSettings?.bankName}</span>
              </div>
              {bankSettings?.accountNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account Number</span>
                  <span className="font-medium">{bankSettings.accountNumber}</span>
                </div>
              )}
              {bankSettings?.accountName && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account Name</span>
                  <span className="font-medium">{bankSettings.accountName}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseShiftDialogOpen(false)} disabled={closingShift}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={closeShift} disabled={closingShift} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              {closingShift ? 'Processing...' : 'Confirm & Deposit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bank Not Configured Warning */}
      {!bankSettings?.bankName && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
          <Building2 className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">Bank account not configured</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Configure your bank account in Settings → Bank to enable automatic deposits when closing shifts.
            </p>
          </div>
        </div>
      )}

      {/* Today's Cash Summary */}
      {cashRegister && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Today's Cash Register
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Opening</p>
                <p className="text-lg font-bold">{formatCurrency(cashRegister.opening_balance)}</p>
              </div>
              <div className="text-center p-3 bg-green-100 rounded-lg">
                <p className="text-xs text-green-600 flex items-center justify-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> Sales
                </p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(cashRegister.total_sales)}</p>
              </div>
              <div className="text-center p-3 bg-red-100 rounded-lg">
                <p className="text-xs text-red-600 flex items-center justify-center gap-1">
                  <ArrowDownRight className="h-3 w-3" /> Refunds
                </p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(cashRegister.total_refunds)}</p>
              </div>
              <div className="text-center p-3 bg-orange-100 rounded-lg">
                <p className="text-xs text-orange-600 flex items-center justify-center gap-1">
                  <ArrowDownRight className="h-3 w-3" /> Expenses
                </p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(cashRegister.total_expenses)}</p>
              </div>
              <div className="text-center p-3 bg-blue-100 rounded-lg">
                <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
                  <Building2 className="h-3 w-3" /> To Bank
                </p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(cashRegister.total_deposits)}</p>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-xs text-primary">Closing Balance</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(cashRegister.closing_balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              Cash Register Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(cashRegister?.closing_balance || 0)}</p>
            <p className="text-xs text-muted-foreground mt-2">Available revenue from daily operations</p>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses paid from cash:</span>
                <span className="text-red-600">-{formatCurrency(cashExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier payments from cash:</span>
                <span className="text-red-600">-{formatCurrency(cashSupplierPayments)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Bank Account Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(bankBalance)}</p>
            <p className="text-xs text-muted-foreground mt-2">Total deposits minus bank withdrawals</p>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total deposited:</span>
                <span className="text-green-600">+{formatCurrency(totalDeposited)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses from bank:</span>
                <span className="text-red-600">-{formatCurrency(bankExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier payments from bank:</span>
                <span className="text-red-600">-{formatCurrency(bankSupplierPayments)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposits Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bank Deposit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map(deposit => (
                <TableRow key={deposit.id}>
                  <TableCell>{deposit.deposit_date}</TableCell>
                  <TableCell className="font-medium">{deposit.bank_name}</TableCell>
                  <TableCell>{deposit.account_number || '-'}</TableCell>
                  <TableCell>{deposit.reference_number || '-'}</TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(deposit.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {deposits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No bank deposits recorded
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Banking;
