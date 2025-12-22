import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Truck, Plus, Edit, Trash2, Search, CreditCard, Receipt, Printer, History } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/currency';
import { getUgandaDateString } from '@/lib/utils';
import { format } from 'date-fns';
import fadyLogo from '@/assets/fady-logo.png';
import { QRCodeSVG } from 'qrcode.react';

interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
}

interface SupplierPayment {
  id: string;
  supplier_id: string;
  purchase_order_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: string;
  payment_source: 'cash_register' | 'bank';
  bank_name: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  purchase_orders?: { order_number: string } | null;
}

const Suppliers = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getUgandaDateString());
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [bankName, setBankName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [selectedPO, setSelectedPO] = useState('');
  const [paymentSource, setPaymentSource] = useState<'cash_register' | 'bank'>('bank');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Receipt dialog state
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    receiptNumber: string;
    supplier: Supplier;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    paymentSource: 'cash_register' | 'bank';
    bankName: string | null;
    referenceNumber: string | null;
    notes: string | null;
    purchaseOrder: string | null;
  } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Payment history dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historySupplier, setHistorySupplier] = useState<Supplier | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<SupplierPayment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (!error) setSuppliers(data || []);
  };

  const fetchPurchaseOrders = async (supplierId: string) => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('id, order_number, total_amount, status')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (!error) setPurchaseOrders(data || []);
  };

  const fetchPaymentHistory = async (supplierId: string) => {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from('supplier_payments')
      .select('*, purchase_orders(order_number)')
      .eq('supplier_id', supplierId)
      .order('payment_date', { ascending: false });

    if (!error) setPaymentHistory(data || []);
    setHistoryLoading(false);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setContactPerson(supplier.contact_person || '');
    setEmail(supplier.email || '');
    setPhone(supplier.phone || '');
    setAddress(supplier.address || '');
    setNotes(supplier.notes || '');
    setIsActive(supplier.is_active);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
    setIsActive(true);
  };

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentDate(getUgandaDateString());
    setPaymentMethod('bank_transfer');
    setPaymentSource('bank');
    setBankName('');
    setReferenceNumber('');
    setPaymentNotes('');
    setSelectedPO('');
  };

  const openPaymentDialog = (supplier: Supplier) => {
    setPaymentSupplier(supplier);
    fetchPurchaseOrders(supplier.id);
    resetPaymentForm();
    setPaymentDialogOpen(true);
  };

  const openHistoryDialog = (supplier: Supplier) => {
    setHistorySupplier(supplier);
    fetchPaymentHistory(supplier.id);
    setHistoryDialogOpen(true);
  };

  const generateReceiptNumber = () => {
    const dateStr = getUgandaDateString().replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SPR-${dateStr}-${random}`;
  };

  const saveSupplier = async () => {
    if (!name) {
      toast({ title: 'Error', description: 'Supplier name is required', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const supplierData = {
        name,
        contact_person: contactPerson || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        is_active: isActive
      };

      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingSupplier.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Supplier updated' });
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert(supplierData);

        if (error) throw error;
        toast({ title: 'Success', description: 'Supplier added' });
      }

      setDialogOpen(false);
      resetForm();
      fetchSuppliers();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const savePayment = async () => {
    if (!paymentSupplier || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({ title: 'Error', description: 'Valid payment amount is required', variant: 'destructive' });
      return;
    }

    if (paymentMethod === 'bank_transfer' && !bankName) {
      toast({ title: 'Error', description: 'Bank name is required for bank transfers', variant: 'destructive' });
      return;
    }

    setPaymentLoading(true);

    try {
      const receiptNumber = generateReceiptNumber();
      const paymentData = {
        supplier_id: paymentSupplier.id,
        purchase_order_id: selectedPO || null,
        amount: parseFloat(paymentAmount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        payment_source: paymentSource as any,
        bank_name: bankName || null,
        reference_number: referenceNumber ? `${receiptNumber} - ${referenceNumber}` : receiptNumber,
        notes: paymentNotes || null,
        paid_by: user?.id || null
      };

      const { error } = await supabase
        .from('supplier_payments')
        .insert(paymentData);

      if (error) throw error;

      // Get the PO order number if selected
      const poNumber = selectedPO ? purchaseOrders.find(po => po.id === selectedPO)?.order_number : null;

      // Set receipt data and show receipt dialog
      setReceiptData({
        receiptNumber,
        supplier: paymentSupplier,
        amount: parseFloat(paymentAmount),
        paymentDate,
        paymentMethod,
        paymentSource,
        bankName: bankName || null,
        referenceNumber: referenceNumber || null,
        notes: paymentNotes || null,
        purchaseOrder: poNumber || null
      });

      setPaymentDialogOpen(false);
      setReceiptDialogOpen(true);

      toast({ title: 'Success', description: 'Payment recorded successfully' });

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setPaymentLoading(false);
    }
  };

  const printReceipt = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Supplier Payment Receipt</title>
              <style>
                body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
                .receipt { border: 2px dashed #333; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { font-size: 18px; margin: 0; }
                .header p { margin: 5px 0; font-size: 12px; }
                .divider { border-top: 1px dashed #333; margin: 15px 0; }
                .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
                .label { font-weight: bold; }
                .total { font-size: 18px; font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete supplier', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Supplier deleted' });
      fetchSuppliers();
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.contact_person?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      mobile_money: 'Mobile Money',
      cheque: 'Cheque'
    };
    return labels[method] || method;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground">Manage your suppliers and payments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Supplier company name"
                />
              </div>

              <div>
                <Label>Contact Person</Label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Main contact name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@supplier.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Supplier address"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Active Supplier</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <Button onClick={saveSupplier} disabled={loading} className="w-full">
                {loading ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Add Supplier'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Suppliers ({suppliers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_person || '-'}</TableCell>
                  <TableCell>{supplier.email || '-'}</TableCell>
                  <TableCell>{supplier.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openPaymentDialog(supplier)}
                      title="Make Payment"
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      Pay
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => openHistoryDialog(supplier)}
                      title="Payment History"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(supplier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteSupplier(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No suppliers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pay Supplier: {paymentSupplier?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (UGX) *</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                min="0"
                step="1000"
              />
            </div>

            <div>
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Payment Source *</Label>
              <Select value={paymentSource} onValueChange={(val) => setPaymentSource(val as 'cash_register' | 'bank')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_register">Cash Register (Available Revenue)</SelectItem>
                  <SelectItem value="bank">Bank Account</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Where will this payment be deducted from?</p>
            </div>

            <div>
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div>
                <Label>Bank Name *</Label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                />
              </div>
            )}

            <div>
              <Label>Reference Number</Label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Transaction reference"
              />
            </div>

            <div>
              <Label>Purchase Order (Optional)</Label>
              <Select value={selectedPO || "none"} onValueChange={(val) => setSelectedPO(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to purchase order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {purchaseOrders.map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.order_number} - {formatCurrency(po.total_amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Payment notes"
                rows={2}
              />
            </div>

            <Button onClick={savePayment} disabled={paymentLoading} className="w-full">
              <Receipt className="h-4 w-4 mr-2" />
              {paymentLoading ? 'Processing...' : 'Record Payment & Generate Receipt'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Receipt
            </DialogTitle>
          </DialogHeader>
          
          {receiptData && (
            <>
              <div ref={receiptRef} className="receipt border-2 border-dashed border-border p-4 rounded-lg bg-card">
                <div className="header flex items-start gap-3 mb-4">
                  <img src={fadyLogo} alt="Fady Technologies" className="h-12 w-auto" />
                  <div>
                    <h1 className="text-lg font-bold">FADY TECHNOLOGIES</h1>
                    <p className="text-sm text-muted-foreground">Supplier Payment Receipt</p>
                  </div>
                </div>
                
                <div className="border-t border-dashed border-border my-3" />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Receipt No:</span>
                    <span>{receiptData.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    <span>{format(new Date(receiptData.paymentDate), 'dd MMM yyyy')}</span>
                  </div>
                </div>
                
                <div className="border-t border-dashed border-border my-3" />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Supplier:</span>
                    <span className="text-right">{receiptData.supplier.name}</span>
                  </div>
                  {receiptData.purchaseOrder && (
                    <div className="flex justify-between">
                      <span className="font-medium">PO Number:</span>
                      <span>{receiptData.purchaseOrder}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Payment Source:</span>
                    <span>{receiptData.paymentSource === 'bank' ? 'Bank Account' : 'Cash Register'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Payment Method:</span>
                    <span>{getPaymentMethodLabel(receiptData.paymentMethod)}</span>
                  </div>
                  {receiptData.bankName && (
                    <div className="flex justify-between">
                      <span className="font-medium">Bank:</span>
                      <span>{receiptData.bankName}</span>
                    </div>
                  )}
                  {receiptData.referenceNumber && (
                    <div className="flex justify-between">
                      <span className="font-medium">Reference:</span>
                      <span>{receiptData.referenceNumber}</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-dashed border-border my-3" />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>AMOUNT PAID:</span>
                  <span>{formatCurrency(receiptData.amount)}</span>
                </div>
                
                {receiptData.notes && (
                  <>
                    <div className="border-t border-dashed border-border my-3" />
                    <div className="text-sm">
                      <span className="font-medium">Notes:</span>
                      <p className="text-muted-foreground mt-1">{receiptData.notes}</p>
                    </div>
                  </>
                )}
                
                <div className="border-t border-dashed border-border my-3" />
                
                <div className="footer flex flex-col items-center text-xs text-muted-foreground space-y-3">
                  <QRCodeSVG 
                    value={`${window.location.origin}/admin/suppliers?payment=${receiptData.receiptNumber}`}
                    size={80}
                    level="M"
                  />
                  <div className="text-center">
                    <p>Thank you for your business</p>
                    <p className="mt-1">{format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={printReceipt} className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                <Button variant="outline" onClick={() => setReceiptDialogOpen(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Payment History: {historySupplier?.name}
            </DialogTitle>
          </DialogHeader>
          
          {historyLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No payment history found</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>PO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.payment_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={payment.payment_source === 'bank' ? 'secondary' : 'default'} className="text-xs">
                          {payment.payment_source === 'bank' ? 'Bank' : 'Cash'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                      <TableCell className="text-xs">{payment.reference_number || '-'}</TableCell>
                      <TableCell>{payment.purchase_orders?.order_number || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Suppliers;
