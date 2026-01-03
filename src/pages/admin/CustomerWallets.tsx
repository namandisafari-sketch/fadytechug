import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { Wallet, Plus, Minus, Search, History, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  company: string | null;
}

interface CustomerWallet {
  id: string;
  customer_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

interface WalletTransaction {
  id: string;
  customer_id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  sale_id: string | null;
  notes: string | null;
  created_at: string;
}

const CustomerWallets = () => {
  const [wallets, setWallets] = useState<CustomerWallet[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<CustomerWallet | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, name, phone, company')
        .order('name');
      
      // Fetch wallets with customer info
      const { data: walletsData } = await supabase
        .from('customer_wallets')
        .select('*')
        .order('updated_at', { ascending: false });

      if (customersData) setCustomers(customersData);
      
      if (walletsData && customersData) {
        const walletsWithCustomers = walletsData.map(wallet => ({
          ...wallet,
          customer: customersData.find(c => c.id === wallet.customer_id)
        }));
        setWallets(walletsWithCustomers);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (customerId: string) => {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast.error('Failed to load transaction history');
      return;
    }
    
    setTransactions(data || []);
  };

  const handleDeposit = async () => {
    if (!selectedCustomerId || !amount || parseFloat(amount) <= 0) {
      toast.error('Please select a customer and enter a valid amount');
      return;
    }

    const depositAmount = parseFloat(amount);

    try {
      // Check if wallet exists
      const { data: existingWallet } = await supabase
        .from('customer_wallets')
        .select('*')
        .eq('customer_id', selectedCustomerId)
        .maybeSingle();

      let newBalance: number;
      
      if (existingWallet) {
        newBalance = existingWallet.balance + depositAmount;
        await supabase
          .from('customer_wallets')
          .update({ balance: newBalance })
          .eq('id', existingWallet.id);
      } else {
        newBalance = depositAmount;
        await supabase
          .from('customer_wallets')
          .insert({ customer_id: selectedCustomerId, balance: newBalance });
      }

      // Record transaction
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('wallet_transactions')
        .insert({
          customer_id: selectedCustomerId,
          transaction_type: 'deposit',
          amount: depositAmount,
          balance_after: newBalance,
          notes: notes || null,
          created_by: user?.id
        });

      toast.success(`Deposited ${formatCurrency(depositAmount)} successfully`);
      resetForm();
      setDepositDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error processing deposit:', error);
      toast.error('Failed to process deposit');
    }
  };

  const handleWithdraw = async () => {
    if (!selectedWallet || !amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount > selectedWallet.balance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      const newBalance = selectedWallet.balance - withdrawAmount;
      
      await supabase
        .from('customer_wallets')
        .update({ balance: newBalance })
        .eq('id', selectedWallet.id);

      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('wallet_transactions')
        .insert({
          customer_id: selectedWallet.customer_id,
          transaction_type: 'withdrawal',
          amount: -withdrawAmount,
          balance_after: newBalance,
          notes: notes || null,
          created_by: user?.id
        });

      toast.success(`Withdrew ${formatCurrency(withdrawAmount)} successfully`);
      resetForm();
      setWithdrawDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error('Failed to process withdrawal');
    }
  };

  const openHistoryDialog = async (wallet: CustomerWallet) => {
    setSelectedWallet(wallet);
    await fetchTransactions(wallet.customer_id);
    setHistoryDialogOpen(true);
  };

  const openWithdrawDialog = (wallet: CustomerWallet) => {
    setSelectedWallet(wallet);
    setWithdrawDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setAmount('');
    setNotes('');
    setSelectedWallet(null);
  };

  const filteredWallets = wallets.filter(wallet => 
    wallet.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
    wallet.customer?.phone?.includes(search)
  );

  const totalDeposits = wallets.reduce((sum, w) => sum + w.balance, 0);

  const customersWithoutWallet = customers.filter(
    c => !wallets.find(w => w.customer_id === c.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Wallets</h1>
          <p className="text-muted-foreground">Manage customer deposits and store credit</p>
        </div>
        <Button onClick={() => setDepositDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Deposit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Held</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDeposits)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets.filter(w => w.balance > 0).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filteredWallets.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {search ? 'No wallets found' : 'No customer wallets yet. Add a deposit to create one.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWallets.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell className="font-medium">{wallet.customer?.name}</TableCell>
                    <TableCell>{wallet.customer?.phone || '-'}</TableCell>
                    <TableCell>{wallet.customer?.company || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(wallet.balance)}
                    </TableCell>
                    <TableCell>{format(new Date(wallet.updated_at), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openHistoryDialog(wallet)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedWallet(wallet);
                            setSelectedCustomerId(wallet.customer_id);
                            setDepositDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWithdrawDialog(wallet)}
                          disabled={wallet.balance <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={(open) => { setDepositDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {selectedWallet && (
                    <SelectItem value={selectedWallet.customer_id}>
                      {selectedWallet.customer?.name}
                    </SelectItem>
                  )}
                  {customersWithoutWallet.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone && `(${customer.phone})`}
                    </SelectItem>
                  ))}
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.customer_id} value={wallet.customer_id}>
                      {wallet.customer?.name} - Balance: {formatCurrency(wallet.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDepositDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleDeposit}>
              <Plus className="h-4 w-4 mr-2" />
              Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={(open) => { setWithdrawDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{selectedWallet?.customer?.name}</p>
              <p className="text-sm text-muted-foreground mt-2">Available Balance</p>
              <p className="text-xl font-bold">{formatCurrency(selectedWallet?.balance || 0)}</p>
            </div>
            <div className="space-y-2">
              <Label>Amount to Withdraw</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                max={selectedWallet?.balance}
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setWithdrawDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} variant="destructive">
              <Minus className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction History - {selectedWallet?.customer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(selectedWallet?.balance || 0)}</p>
            </div>
            {transactions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {tx.transaction_type === 'deposit' && (
                              <ArrowDownCircle className="h-4 w-4 text-green-500" />
                            )}
                            {tx.transaction_type === 'withdrawal' && (
                              <ArrowUpCircle className="h-4 w-4 text-red-500" />
                            )}
                            {tx.transaction_type === 'purchase' && (
                              <ArrowUpCircle className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="capitalize">{tx.transaction_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(tx.balance_after)}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{tx.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerWallets;
