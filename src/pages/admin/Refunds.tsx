import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RotateCcw, Search, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Sale {
  id: string;
  receipt_number: string;
  customer_name: string | null;
  total: number;
  created_at: string;
  sale_items: SaleItem[];
}

interface RefundItem {
  product_id: string;
  product_name: string;
  quantity: number;
  refund_qty: number;
  unit_price: number;
}

interface Refund {
  id: string;
  receipt_number: string;
  reason: string;
  amount: number;
  items_returned: any;
  created_at: string;
  sales: { customer_name: string | null } | null;
}

const Refunds = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptSearch, setReceiptSearch] = useState('');
  const [foundSale, setFoundSale] = useState<Sale | null>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    const { data, error } = await supabase
      .from('refunds')
      .select('*, sales(customer_name)')
      .order('created_at', { ascending: false });

    if (!error) setRefunds(data || []);
  };

  const searchReceipt = async () => {
    if (!receiptSearch) return;

    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('receipt_number', receiptSearch)
      .maybeSingle();

    if (error || !data) {
      toast({ title: 'Not Found', description: 'Receipt not found', variant: 'destructive' });
      setFoundSale(null);
    } else {
      setFoundSale(data);
      // Initialize refund items
      setRefundItems(data.sale_items.map((item: SaleItem) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        refund_qty: item.quantity, // Default to full quantity
        unit_price: item.unit_price
      })));
      setRefundType('full');
      setCustomAmount('');
    }
  };

  const calculateRefundAmount = (): number => {
    if (refundType === 'full' && foundSale) {
      return foundSale.total;
    }
    
    if (customAmount) {
      return parseFloat(customAmount);
    }
    
    return refundItems.reduce((sum, item) => sum + (item.refund_qty * item.unit_price), 0);
  };

  const updateItemRefundQty = (index: number, qty: number) => {
    const newItems = [...refundItems];
    newItems[index].refund_qty = Math.min(Math.max(0, qty), newItems[index].quantity);
    setRefundItems(newItems);
  };

  const processRefund = async () => {
    if (!foundSale || !reason) {
      toast({ title: 'Error', description: 'Please provide a reason', variant: 'destructive' });
      return;
    }

    const amount = calculateRefundAmount();
    if (amount <= 0 || amount > foundSale.total) {
      toast({ title: 'Error', description: 'Invalid refund amount', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const itemsReturned = refundType === 'full' 
        ? refundItems.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity }))
        : refundItems.filter(i => i.refund_qty > 0).map(i => ({ 
            product_id: i.product_id, 
            product_name: i.product_name, 
            quantity: i.refund_qty 
          }));

      const { error } = await supabase
        .from('refunds')
        .insert({
          sale_id: foundSale.id,
          receipt_number: foundSale.receipt_number,
          reason,
          amount,
          items_returned: itemsReturned,
          refunded_by: user?.id
        });

      if (error) throw error;

      // Update inventory - add back refunded items
      for (const item of itemsReturned) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const newStock = product.stock_quantity + item.quantity;
          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id);

          await supabase.from('inventory_transactions').insert({
            product_id: item.product_id,
            transaction_type: 'return',
            quantity: item.quantity,
            previous_stock: product.stock_quantity,
            new_stock: newStock,
            notes: `Refund from ${foundSale.receipt_number}`,
            created_by: user?.id
          });
        }
      }

      toast({ title: 'Success', description: 'Refund processed successfully' });
      setDialogOpen(false);
      setFoundSale(null);
      setReceiptSearch('');
      setReason('');
      setRefundItems([]);
      setCustomAmount('');
      fetchRefunds();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredRefunds = refunds.filter(r =>
    r.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);
  const refundAmount = calculateRefundAmount();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Refunds</h1>
          <p className="text-muted-foreground">Process full or partial customer refunds</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { 
          setDialogOpen(open); 
          if (!open) {
            setFoundSale(null);
            setReceiptSearch('');
            setReason('');
            setRefundItems([]);
            setCustomAmount('');
          }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Process Refund</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Process Refund</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter receipt number"
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                />
                <Button onClick={searchReceipt}>Search</Button>
              </div>

              {foundSale && (
                <>
                  <Card className="bg-secondary/50">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Receipt:</span>
                        <span className="font-mono">{foundSale.receipt_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer:</span>
                        <span>{foundSale.customer_name || 'Walk-in'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{new Date(foundSale.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Sale Total:</span>
                        <span>{formatCurrency(foundSale.total)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Refund Type Selection */}
                  <div>
                    <Label>Refund Type</Label>
                    <RadioGroup value={refundType} onValueChange={(v) => setRefundType(v as 'full' | 'partial')} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full" id="full" />
                        <Label htmlFor="full" className="cursor-pointer">Full Refund ({formatCurrency(foundSale.total)})</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="partial" id="partial" />
                        <Label htmlFor="partial" className="cursor-pointer">Partial Refund (Select items or enter amount)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Partial Refund Options */}
                  {refundType === 'partial' && (
                    <>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Select Items to Refund</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Purchased</TableHead>
                                <TableHead className="text-right">Refund Qty</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {refundItems.map((item, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{item.product_name}</TableCell>
                                  <TableCell className="text-right">{item.quantity}</TableCell>
                                  <TableCell className="text-right">
                                    <Input
                                      type="number"
                                      className="w-20 text-right"
                                      min={0}
                                      max={item.quantity}
                                      value={item.refund_qty}
                                      onChange={(e) => updateItemRefundQty(idx, parseInt(e.target.value) || 0)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(item.refund_qty * item.unit_price)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      <div>
                        <Label>Or Enter Custom Amount (UGX)</Label>
                        <Input
                          type="number"
                          placeholder="Custom refund amount"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          max={foundSale.total}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Leave empty to use item-based calculation</p>
                      </div>
                    </>
                  )}

                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Refund Amount:</span>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(refundAmount)}</span>
                    </div>
                    {refundType === 'partial' && (
                      <Badge variant="secondary" className="mt-2">Partial Refund</Badge>
                    )}
                  </div>

                  <div>
                    <Label>Reason for Refund *</Label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Describe the reason for this refund"
                    />
                  </div>

                  <Button onClick={processRefund} disabled={loading || !reason} className="w-full">
                    {loading ? 'Processing...' : `Confirm Refund - ${formatCurrency(refundAmount)}`}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <RotateCcw className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Refunds</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalRefunds)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by receipt number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Refund History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Receipt #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRefunds.map(refund => (
                <TableRow key={refund.id}>
                  <TableCell>{new Date(refund.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono">{refund.receipt_number}</TableCell>
                  <TableCell>{refund.sales?.customer_name || 'Walk-in'}</TableCell>
                  <TableCell>
                    <Badge variant={refund.items_returned?.length > 0 ? 'secondary' : 'outline'}>
                      {refund.items_returned?.length > 0 ? 'Items' : 'Amount'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{refund.reason}</TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    -{formatCurrency(refund.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredRefunds.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No refunds found
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

export default Refunds;