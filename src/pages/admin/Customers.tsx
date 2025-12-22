import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Users, Edit, Trash2, Search, Mail, Phone, CreditCard, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
}

interface CreditSale {
  id: string;
  sale_id: string;
  customer_id: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: string;
  notes: string | null;
  created_at: string;
  sales: { receipt_number: string };
  customers: { name: string; phone: string | null };
}

interface CreditPayment {
  id: string;
  credit_sale_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
}

const Customers = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  // Customer form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCreditSale, setSelectedCreditSale] = useState<CreditSale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentHistory, setPaymentHistory] = useState<CreditPayment[]>([]);

  useEffect(() => {
    fetchCustomers();
    fetchCreditSales();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (!error) setCustomers(data || []);
  };

  const fetchCreditSales = async () => {
    const { data, error } = await supabase
      .from('credit_sales')
      .select('*, sales(receipt_number), customers(name, phone)')
      .order('created_at', { ascending: false });

    if (!error) setCreditSales(data || []);
  };

  const fetchPaymentHistory = async (creditSaleId: string) => {
    const { data } = await supabase
      .from('credit_payments')
      .select('*')
      .eq('credit_sale_id', creditSaleId)
      .order('payment_date', { ascending: false });
    setPaymentHistory(data || []);
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setNotes('');
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setEmail(customer.email || '');
    setPhone(customer.phone || '');
    setCompany(customer.company || '');
    setNotes(customer.notes || '');
    setDialogOpen(true);
  };

  const openPaymentDialog = async (creditSale: CreditSale) => {
    setSelectedCreditSale(creditSale);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    await fetchPaymentHistory(creditSale.id);
    setPaymentDialogOpen(true);
  };

  const saveCustomer = async () => {
    if (!name) {
      toast({ title: 'Error', description: 'Customer name is required', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const customerData = {
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        notes: notes || null
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', editingCustomer.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Customer updated' });
      } else {
        const { error } = await supabase.from('customers').insert(customerData);
        if (error) throw error;
        toast({ title: 'Success', description: 'Customer added' });
      }

      setDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async () => {
    if (!selectedCreditSale || !paymentAmount) {
      toast({ title: 'Error', description: 'Please enter payment amount', variant: 'destructive' });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > selectedCreditSale.balance) {
      toast({ title: 'Error', description: 'Invalid payment amount', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Record payment with custom date
      await supabase.from('credit_payments').insert({
        credit_sale_id: selectedCreditSale.id,
        amount,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        received_by: user?.id,
        notes: paymentNotes || null
      });

      // Update credit sale
      const newAmountPaid = selectedCreditSale.amount_paid + amount;
      const newBalance = selectedCreditSale.total_amount - newAmountPaid;
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      await supabase
        .from('credit_sales')
        .update({
          amount_paid: newAmountPaid,
          balance: newBalance,
          status: newStatus
        })
        .eq('id', selectedCreditSale.id);

      toast({ title: 'Success', description: `Payment of ${formatCurrency(amount)} recorded` });
      setPaymentDialogOpen(false);
      fetchCreditSales();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Customer deleted' });
      fetchCustomers();
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.company?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredCreditSales = creditSales.filter(cs =>
    cs.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cs.sales?.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const outstandingTotal = creditSales.filter(cs => cs.balance > 0).reduce((sum, cs) => sum + cs.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage customers and credit sales</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Customer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" /></div>
                <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+256..." /></div>
              </div>
              <div><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" /></div>
              <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" /></div>
              <Button onClick={saveCustomer} disabled={loading} className="w-full">
                {loading ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers or receipts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers" className="gap-2">
            <Users className="h-4 w-4" />
            Customers ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="credit" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Credit Sales
            {outstandingTotal > 0 && (
              <Badge variant="destructive" className="ml-1">{formatCurrency(outstandingTotal)}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customers ({customers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />{customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />{customer.phone}
                            </div>
                          )}
                          {!customer.email && !customer.phone && <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>{customer.company || '-'}</TableCell>
                      <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(customer)}><Edit className="h-4 w-4" /></Button>
                        {isAdmin && (
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCustomer(customer.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No customers found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Credit Sales
                </div>
                {outstandingTotal > 0 && (
                  <div className="text-orange-600">
                    Total Outstanding: <span className="font-bold">{formatCurrency(outstandingTotal)}</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCreditSales.map(cs => (
                    <TableRow key={cs.id} className={cs.balance > 0 ? 'bg-orange-500/5' : ''}>
                      <TableCell>{new Date(new Date(cs.created_at).toLocaleString('en-US', { timeZone: 'Africa/Kampala' })).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-sm">{cs.sales?.receipt_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cs.customers?.name}</p>
                          {cs.customers?.phone && <p className="text-xs text-muted-foreground">{cs.customers.phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(cs.total_amount)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(cs.amount_paid)}</TableCell>
                      <TableCell className="text-right font-bold text-orange-600">{formatCurrency(cs.balance)}</TableCell>
                      <TableCell>
                        <Badge variant={cs.status === 'paid' ? 'default' : cs.status === 'partial' ? 'secondary' : 'destructive'}>
                          {cs.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {cs.balance > 0 && (
                          <Button size="sm" onClick={() => openPaymentDialog(cs)} className="gap-1">
                            <DollarSign className="h-3 w-3" />
                            Record Payment
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCreditSales.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No credit sales found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Record Payment
            </DialogTitle>
          </DialogHeader>
          {selectedCreditSale && (
            <div className="space-y-4">
              <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
                <p className="font-medium">{selectedCreditSale.customers?.name}</p>
                <p className="text-sm text-muted-foreground">Receipt: {selectedCreditSale.sales?.receipt_number}</p>
                <div className="flex justify-between mt-2 pt-2 border-t">
                  <span>Outstanding Balance:</span>
                  <span className="font-bold text-orange-600">{formatCurrency(selectedCreditSale.balance)}</span>
                </div>
              </div>

              <div>
                <Label>Payment Amount (UGX) *</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  max={selectedCreditSale.balance}
                />
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Payment reference, etc."
                />
              </div>

              <Button onClick={recordPayment} disabled={loading} className="w-full">
                {loading ? 'Recording...' : 'Record Payment'}
              </Button>

              {paymentHistory.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Payment History:</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {paymentHistory.map(p => (
                      <div key={p.id} className="flex justify-between text-sm p-2 bg-secondary/30 rounded">
                        <span>{new Date(p.payment_date).toLocaleDateString()} - {p.payment_method}</span>
                        <span className="font-medium text-green-600">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;