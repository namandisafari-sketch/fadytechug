import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Search,
  ArrowLeftRight,
  Package,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  RefreshCw,
  Eye,
  CalendarIcon,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { formatUgandaDateTime } from '@/lib/utils';

interface Sale {
  id: string;
  receipt_number: string;
  customer_name: string | null;
  total: number;
  payment_method: string;
  created_at: string;
}

interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category: string;
}

interface ReturnItem {
  product_id: string;
  product_name: string;
  quantity: number;
  return_qty: number;
  unit_price: number;
}

interface NewItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface Exchange {
  id: string;
  original_receipt_number: string;
  customer_name: string | null;
  exchange_type: string;
  returned_items: any;
  returned_value: number;
  new_items: any;
  new_value: number;
  difference_amount: number;
  payment_method: string;
  amount_paid: number;
  refund_given: number;
  reason: string;
  created_at: string;
}

const Exchanges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for exchange history
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for new exchange
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<'find-sale' | 'select-returns' | 'select-new' | 'confirm'>('find-sale');
  const [receiptSearch, setReceiptSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [exchangeType, setExchangeType] = useState<'refund' | 'exchange'>('exchange');
  
  // New items for exchange
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [newItems, setNewItems] = useState<NewItem[]>([]);
  
  // Reason and payment
  const [reason, setReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashDate, setCashDate] = useState<Date | undefined>(undefined);
  const [processing, setProcessing] = useState(false);
  
  // View exchange details
  const [viewExchange, setViewExchange] = useState<Exchange | null>(null);

  useEffect(() => {
    fetchExchanges();
    fetchProducts();
  }, []);

  const fetchExchanges = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exchanges')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch exchanges', variant: 'destructive' });
    } else {
      setExchanges(data || []);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity, category')
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .order('name');
    
    setProducts(data || []);
  };

  const searchSale = async () => {
    if (!receiptSearch.trim()) {
      toast({ title: 'Error', description: 'Please enter a receipt number', variant: 'destructive' });
      return;
    }

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .ilike('receipt_number', `%${receiptSearch.trim()}%`)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      toast({ title: 'Not Found', description: 'No sale found with that receipt number', variant: 'destructive' });
      return;
    }

    setSelectedSale(data);

    // Fetch sale items
    const { data: items } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', data.id);

    setSaleItems(items || []);
    setReturnItems((items || []).map((item: SaleItem) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      return_qty: 0,
      unit_price: item.unit_price
    })));
    setStep('select-returns');
  };

  const updateReturnQty = (index: number, qty: number) => {
    const newItems = [...returnItems];
    newItems[index].return_qty = Math.min(Math.max(0, qty), newItems[index].quantity);
    setReturnItems(newItems);
  };

  const getReturnedValue = () => {
    return returnItems.reduce((sum, item) => sum + (item.return_qty * item.unit_price), 0);
  };

  const getNewItemsValue = () => {
    return newItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const getDifference = () => {
    return getNewItemsValue() - getReturnedValue();
  };

  const addNewItem = (product: Product) => {
    const existing = newItems.find(item => item.product_id === product.id);
    if (existing) {
      setNewItems(newItems.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setNewItems([...newItems, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price
      }]);
    }
    setProductSearch('');
  };

  const updateNewItemQty = (index: number, qty: number) => {
    if (qty <= 0) {
      setNewItems(newItems.filter((_, i) => i !== index));
    } else {
      const product = products.find(p => p.id === newItems[index].product_id);
      const maxQty = product?.stock_quantity || qty;
      const updated = [...newItems];
      updated[index].quantity = Math.min(qty, maxQty);
      setNewItems(updated);
    }
  };

  const removeNewItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const proceedToNewItems = () => {
    const hasReturns = returnItems.some(item => item.return_qty > 0);
    if (!hasReturns) {
      toast({ title: 'Error', description: 'Please select at least one item to return', variant: 'destructive' });
      return;
    }
    
    if (exchangeType === 'exchange') {
      setStep('select-new');
    } else {
      setStep('confirm');
    }
  };

  const proceedToConfirm = () => {
    if (exchangeType === 'exchange' && newItems.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one new item for exchange', variant: 'destructive' });
      return;
    }
    setStep('confirm');
  };

  const processExchange = async () => {
    if (!selectedSale || !reason.trim()) {
      toast({ title: 'Error', description: 'Please provide a reason', variant: 'destructive' });
      return;
    }

    if (!cashDate) {
      toast({
        title: 'Missing date',
        description: 'Please select the exchange date to record the top-up/refund.',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);

    try {
      const returnedValue = getReturnedValue();
      const newValue = exchangeType === 'exchange' ? getNewItemsValue() : 0;
      const difference = newValue - returnedValue;
      
      const returnedItemsData = returnItems
        .filter(item => item.return_qty > 0)
        .map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.return_qty,
          unit_price: item.unit_price
        }));

      const newItemsData = exchangeType === 'exchange' 
        ? newItems.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        : [];

      // Create exchange record with the selected cash_date
      const selectedDate = format(cashDate, 'yyyy-MM-dd');
      const { error: exchangeError } = await supabase
        .from('exchanges')
        .insert({
          original_sale_id: selectedSale.id,
          original_receipt_number: selectedSale.receipt_number,
          customer_name: selectedSale.customer_name,
          exchange_type: exchangeType,
          returned_items: returnedItemsData,
          returned_value: returnedValue,
          new_items: newItemsData,
          new_value: newValue,
          difference_amount: difference,
          payment_method: paymentMethod,
          amount_paid: difference > 0 ? difference : 0,
          refund_given: difference < 0 ? Math.abs(difference) : 0,
          reason,
          processed_by: user?.id,
          cash_date: selectedDate
        });

      if (exchangeError) throw exchangeError;

      // Update cash register for the SELECTED date (top-ups add to sales, refunds add to refunds)
      
      // Check if cash register exists for selected date
      const { data: existingRegister } = await supabase
        .from('cash_register')
        .select('*')
        .eq('date', selectedDate)
        .maybeSingle();

      if (existingRegister) {
        // Update existing register
        if (difference > 0) {
          // Top-up: add to total_sales
          await supabase
            .from('cash_register')
            .update({ 
              total_sales: (existingRegister.total_sales || 0) + difference,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRegister.id);
        } else if (difference < 0 || exchangeType === 'refund') {
          // Refund: add to total_refunds
          const refundAmount = exchangeType === 'refund' ? returnedValue : Math.abs(difference);
          await supabase
            .from('cash_register')
            .update({ 
              total_refunds: (existingRegister.total_refunds || 0) + refundAmount,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRegister.id);
        }
      } else {
        // Create new register for selected date if it doesn't exist
        if (difference > 0) {
          await supabase
            .from('cash_register')
            .insert({
              date: selectedDate,
              opening_balance: 0,
              total_sales: difference,
              total_refunds: 0,
              total_expenses: 0,
              total_deposits: 0,
              notes: 'Auto-created from exchange top-up'
            });
        } else if (difference < 0 || exchangeType === 'refund') {
          const refundAmount = exchangeType === 'refund' ? returnedValue : Math.abs(difference);
          await supabase
            .from('cash_register')
            .insert({
              date: selectedDate,
              opening_balance: 0,
              total_sales: 0,
              total_refunds: refundAmount,
              total_expenses: 0,
              total_deposits: 0,
              notes: 'Auto-created from exchange refund'
            });
        }
      }

      // Update inventory for returned items (add back to stock)
      for (const item of returnedItemsData) {
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
            notes: `Return/Exchange from ${selectedSale.receipt_number}`,
            created_by: user?.id
          });
        }
      }

      // Update inventory for new items (reduce stock) - only for exchanges
      if (exchangeType === 'exchange') {
        for (const item of newItemsData) {
          const { data: product } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.product_id)
            .single();

          if (product) {
            const newStock = product.stock_quantity - item.quantity;
            await supabase
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', item.product_id);

            await supabase.from('inventory_transactions').insert({
              product_id: item.product_id,
              transaction_type: 'sale',
              quantity: -item.quantity,
              previous_stock: product.stock_quantity,
              new_stock: newStock,
              notes: `Exchange from ${selectedSale.receipt_number}`,
              created_by: user?.id
            });
          }
        }
      }

      toast({ 
        title: 'Success', 
        description: exchangeType === 'exchange' 
          ? `Exchange processed. ${difference > 0 ? `Customer paid ${formatCurrency(difference)} top-up (shown on Dashboard for ${format(cashDate!, 'MMM d, yyyy')})` : difference < 0 ? `Refunded ${formatCurrency(Math.abs(difference))} to customer` : 'Even exchange'}`
          : `Refund of ${formatCurrency(returnedValue)} processed (shown on Dashboard for ${format(cashDate!, 'MMM d, yyyy')})`
      });
      
      resetDialog();
      fetchExchanges();
      fetchProducts();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setStep('find-sale');
    setReceiptSearch('');
    setSelectedSale(null);
    setSaleItems([]);
    setReturnItems([]);
    setNewItems([]);
    setExchangeType('exchange');
    setReason('');
    setPaymentMethod('cash');
    setCashDate(undefined);
    setProductSearch('');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredExchanges = exchanges.filter(e =>
    e.original_receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Returns & Exchanges</h1>
          <p className="text-muted-foreground">Process product returns and exchanges with top-up</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          New Return/Exchange
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exchanges</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exchanges.filter(e => e.exchange_type === 'exchange').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exchanges.filter(e => e.exchange_type === 'refund').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top-ups Collected</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(exchanges.reduce((sum, e) => sum + (e.amount_paid || 0), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Exchange History</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by receipt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchExchanges}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredExchanges.length === 0 ? (
            <p className="text-muted-foreground">No exchanges found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Original Receipt</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Returned Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Top-up/Refund</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExchanges.map((exchange) => (
                  <TableRow key={exchange.id}>
                    <TableCell>{formatUgandaDateTime(exchange.created_at)}</TableCell>
                    <TableCell className="font-mono">{exchange.original_receipt_number}</TableCell>
                    <TableCell>{exchange.customer_name || 'Walk-in'}</TableCell>
                    <TableCell>
                      <Badge variant={exchange.exchange_type === 'exchange' ? 'default' : 'secondary'}>
                        {exchange.exchange_type === 'exchange' ? 'Exchange' : 'Refund'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(exchange.returned_value)}</TableCell>
                    <TableCell>{formatCurrency(exchange.new_value)}</TableCell>
                    <TableCell>
                      {exchange.amount_paid > 0 && (
                        <span className="text-green-600">+{formatCurrency(exchange.amount_paid)}</span>
                      )}
                      {exchange.refund_given > 0 && (
                        <span className="text-red-600">-{formatCurrency(exchange.refund_given)}</span>
                      )}
                      {exchange.amount_paid === 0 && exchange.refund_given === 0 && (
                        <span className="text-muted-foreground">Even</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setViewExchange(exchange)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Exchange Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === 'find-sale' && 'Find Original Sale'}
              {step === 'select-returns' && 'Select Items to Return'}
              {step === 'select-new' && 'Select New Items'}
              {step === 'confirm' && 'Confirm Exchange'}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Find Sale */}
          {step === 'find-sale' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Receipt Number</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter receipt number (e.g., RCP-20241220-0001)"
                    value={receiptSearch}
                    onChange={(e) => setReceiptSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchSale()}
                  />
                  <Button onClick={searchSale}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Returns */}
          {step === 'select-returns' && selectedSale && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">{selectedSale.receipt_number}</p>
                <p className="text-sm text-muted-foreground">
                  Customer: {selectedSale.customer_name || 'Walk-in'} | 
                  Total: {formatCurrency(selectedSale.total)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>What would you like to do?</Label>
                <RadioGroup value={exchangeType} onValueChange={(v) => setExchangeType(v as 'refund' | 'exchange')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exchange" id="exchange" />
                    <Label htmlFor="exchange">Exchange for different product(s)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="refund" id="refund" />
                    <Label htmlFor="refund">Process refund only</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Select items to return</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Bought</TableHead>
                      <TableHead>Return Qty</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnItems.map((item, index) => (
                      <TableRow key={item.product_id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateReturnQty(index, item.return_qty - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.return_qty}
                              onChange={(e) => updateReturnQty(index, parseInt(e.target.value) || 0)}
                              className="w-16 text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateReturnQty(index, item.return_qty + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(item.return_qty * item.unit_price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-right font-medium">
                  Return Value: {formatCurrency(getReturnedValue())}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={resetDialog}>Cancel</Button>
                <Button onClick={proceedToNewItems}>
                  {exchangeType === 'exchange' ? 'Select New Items' : 'Continue to Confirm'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 3: Select New Items */}
          {step === 'select-new' && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">Return Value: <strong>{formatCurrency(getReturnedValue())}</strong></p>
              </div>

              <div className="space-y-2">
                <Label>Search Products</Label>
                <Input
                  placeholder="Search by name or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productSearch && filteredProducts.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {filteredProducts.slice(0, 10).map((product) => (
                      <div
                        key={product.id}
                        className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                        onClick={() => addNewItem(product)}
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category} | Stock: {product.stock_quantity}</p>
                        </div>
                        <span className="font-medium">{formatCurrency(product.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {newItems.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>New Items</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newItems.map((item, index) => (
                          <TableRow key={item.product_id}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateNewItemQty(index, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateNewItemQty(index, parseInt(e.target.value) || 0)}
                                  className="w-16 text-center"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateNewItemQty(index, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(item.quantity * item.unit_price)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => removeNewItem(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              <div className="bg-muted p-3 rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span>Returned Value:</span>
                  <span>{formatCurrency(getReturnedValue())}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Items Value:</span>
                  <span>{formatCurrency(getNewItemsValue())}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>{getDifference() > 0 ? 'Customer Top-up:' : getDifference() < 0 ? 'Refund to Customer:' : 'Difference:'}</span>
                  <span className={getDifference() > 0 ? 'text-green-600' : getDifference() < 0 ? 'text-red-600' : ''}>
                    {formatCurrency(Math.abs(getDifference()))}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('select-returns')}>Back</Button>
                <Button onClick={proceedToConfirm}>Continue</Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason for {exchangeType === 'exchange' ? 'Exchange' : 'Return'} *</Label>
                <Textarea
                  placeholder="e.g., Customer wants different size, Product defective, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {getDifference() !== 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Exchange Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !cashDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {cashDate ? format(cashDate, "PPP") : <span>Pick exchange date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={cashDate}
                          onSelect={(date) => setCashDate(date ?? undefined)}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      Dashboard top-ups/refunds will appear on this selected date.
                    </p>
                  </div>
                </div>
              )}

              {getDifference() === 0 && exchangeType === 'refund' && (
                <div className="space-y-2">
                  <Label>Exchange Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full sm:w-[280px] justify-start text-left font-normal",
                          !cashDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {cashDate ? format(cashDate, "PPP") : <span>Pick exchange date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={cashDate}
                        onSelect={(date) => setCashDate(date ?? undefined)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Dashboard refund will appear on this selected date.
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Summary</h4>
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <p><strong>Original Receipt:</strong> {selectedSale?.receipt_number}</p>
                  <p><strong>Customer:</strong> {selectedSale?.customer_name || 'Walk-in'}</p>
                  <p><strong>Type:</strong> {exchangeType === 'exchange' ? 'Product Exchange' : 'Refund Only'}</p>
                  
                  <Separator className="my-2" />
                  
                  <p><strong>Items Returned:</strong></p>
                  <ul className="ml-4 list-disc">
                    {returnItems.filter(i => i.return_qty > 0).map((item, idx) => (
                      <li key={idx}>{item.product_name} x{item.return_qty} = {formatCurrency(item.return_qty * item.unit_price)}</li>
                    ))}
                  </ul>
                  <p>Return Value: <strong>{formatCurrency(getReturnedValue())}</strong></p>

                  {exchangeType === 'exchange' && newItems.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <p><strong>New Items:</strong></p>
                      <ul className="ml-4 list-disc">
                        {newItems.map((item, idx) => (
                          <li key={idx}>{item.product_name} x{item.quantity} = {formatCurrency(item.quantity * item.unit_price)}</li>
                        ))}
                      </ul>
                      <p>New Value: <strong>{formatCurrency(getNewItemsValue())}</strong></p>
                    </>
                  )}

                  <Separator className="my-2" />
                  
                  {getDifference() > 0 ? (
                    <p className="text-green-600 font-bold">Customer pays top-up: {formatCurrency(getDifference())}</p>
                  ) : getDifference() < 0 ? (
                    <p className="text-red-600 font-bold">Refund to customer: {formatCurrency(Math.abs(getDifference()))}</p>
                  ) : (
                    <p className="font-bold">Even exchange - no payment needed</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep(exchangeType === 'exchange' ? 'select-new' : 'select-returns')}>
                  Back
                </Button>
                <Button onClick={processExchange} disabled={processing || !reason.trim()}>
                  {processing ? 'Processing...' : 'Complete Exchange'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Exchange Details Dialog */}
      <Dialog open={!!viewExchange} onOpenChange={() => setViewExchange(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exchange Details</DialogTitle>
          </DialogHeader>
          {viewExchange && (
            <div className="space-y-3 text-sm">
              <p><strong>Date:</strong> {formatUgandaDateTime(viewExchange.created_at)}</p>
              <p><strong>Original Receipt:</strong> {viewExchange.original_receipt_number}</p>
              <p><strong>Customer:</strong> {viewExchange.customer_name || 'Walk-in'}</p>
              <p><strong>Type:</strong> {viewExchange.exchange_type === 'exchange' ? 'Product Exchange' : 'Refund'}</p>
              <p><strong>Reason:</strong> {viewExchange.reason}</p>
              
              <Separator />
              
              <p><strong>Returned Items:</strong></p>
              <ul className="ml-4 list-disc">
                {(viewExchange.returned_items as any[])?.map((item: any, idx: number) => (
                  <li key={idx}>{item.product_name} x{item.quantity} @ {formatCurrency(item.unit_price)}</li>
                ))}
              </ul>
              <p>Return Value: <strong>{formatCurrency(viewExchange.returned_value)}</strong></p>

              {viewExchange.exchange_type === 'exchange' && (viewExchange.new_items as any[])?.length > 0 && (
                <>
                  <Separator />
                  <p><strong>New Items:</strong></p>
                  <ul className="ml-4 list-disc">
                    {(viewExchange.new_items as any[])?.map((item: any, idx: number) => (
                      <li key={idx}>{item.product_name} x{item.quantity} @ {formatCurrency(item.unit_price)}</li>
                    ))}
                  </ul>
                  <p>New Value: <strong>{formatCurrency(viewExchange.new_value)}</strong></p>
                </>
              )}

              <Separator />
              
              {viewExchange.amount_paid > 0 && (
                <p className="text-green-600"><strong>Top-up Collected:</strong> {formatCurrency(viewExchange.amount_paid)} ({viewExchange.payment_method})</p>
              )}
              {viewExchange.refund_given > 0 && (
                <p className="text-red-600"><strong>Refund Given:</strong> {formatCurrency(viewExchange.refund_given)} ({viewExchange.payment_method})</p>
              )}
              {viewExchange.amount_paid === 0 && viewExchange.refund_given === 0 && (
                <p><strong>Even exchange</strong> - no money exchanged</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exchanges;