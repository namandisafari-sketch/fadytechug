import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, Barcode, ScanLine, Edit2, CalendarIcon, Power } from 'lucide-react';
import fadyLogo from '@/assets/fady-logo.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/currency';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category: string;
  barcode: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface BankSettings {
  bankName: string;
  accountNumber: string;
  accountName: string;
  autoDepositOnClose: boolean;
}

const PointOfSale = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState('0');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannerMode, setScannerMode] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // Credit sale state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // End day state
  const [endDayDialogOpen, setEndDayDialogOpen] = useState(false);
  const [closingShift, setClosingShift] = useState(false);
  const [bankSettings, setBankSettings] = useState<BankSettings | null>(null);
  const [cashRegisterBalance, setCashRegisterBalance] = useState(0);
  const [creditNotes, setCreditNotes] = useState('');
  const [endDayDate, setEndDayDate] = useState<Date | undefined>(undefined);
  
  // Backdate sale state
  const [saleDate, setSaleDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchBankSettings();
    fetchCashRegisterBalance();
  }, []);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .order('name');
    if (data) setCustomers(data);
  };

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

  const fetchCashRegisterBalance = async (forDate?: Date) => {
    const targetDate = forDate || new Date();
    // Use local date string (avoid timezone shifting from toISOString)
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    
    const startTs = `${dateStr}T00:00:00+03:00`;
    const endTs = `${dateStr}T23:59:59+03:00`;

    // Get the day's CASH sales only (credit/card/mobile_money/bank_transfer are not physical drawer cash)
    // NOTE: Use Africa/Kampala day boundaries (+03:00)
    const { data: salesData } = await supabase
      .from('sales')
      .select('total, payment_method')
      .gte('created_at', startTs)
      .lte('created_at', endTs);

    const totalCashSales =
      salesData?.filter((s) => s.payment_method === 'cash').reduce((sum, s) => sum + s.total, 0) || 0;

    // Get CASH credit payments received on this date (these add physical cash to the drawer)
    const { data: creditPaymentsData } = await supabase
      .from('credit_payments')
      .select('amount, payment_method')
      .gte('payment_date', startTs)
      .lte('payment_date', endTs)
      .eq('payment_method', 'cash');

    const totalCashCreditPayments = creditPaymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Get the day's refunds
    const { data: refundsData } = await supabase
      .from('refunds')
      .select('amount')
      .gte('created_at', startTs)
      .lte('created_at', endTs);

    const totalRefunds = refundsData?.reduce((sum, r) => sum + r.amount, 0) || 0;

    // Get the day's expenses from cash register
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('expense_date', dateStr)
      .eq('payment_source', 'cash_register');

    const totalExpenses = expensesData?.reduce((sum, e) => sum + e.amount, 0) || 0;

    // Get the day's supplier payments from cash register
    const { data: supplierPaymentsData } = await supabase
      .from('supplier_payments')
      .select('amount')
      .eq('payment_date', dateStr)
      .eq('payment_source', 'cash_register');

    const totalSupplierPayments = supplierPaymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Get previous day's closing balance (opening balance for target date)
    const previousDay = new Date(targetDate);
    previousDay.setDate(previousDay.getDate() - 1);
    const previousDayStr = format(previousDay, 'yyyy-MM-dd');

    const { data: previousDayRegister } = await supabase
      .from('cash_register')
      .select('closing_balance')
      .eq('date', previousDayStr)
      .maybeSingle();

    const openingBalance = previousDayRegister?.closing_balance || 0;
    
    // Physical cash in drawer for the shift (cash-only):
    // opening_balance + cash_sales + cash_credit_payments - refunds - cash_expenses - cash_supplier_payments
    // NOTE: we do NOT subtract deposits or any historical totals.
    const balance =
      openingBalance + totalCashSales + totalCashCreditPayments - totalRefunds - totalExpenses - totalSupplierPayments;
    setCashRegisterBalance(balance);
  };

  // Auto-focus barcode input when scanner mode is enabled
  useEffect(() => {
    if (scannerMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [scannerMode]);

  // Handle barcode scan (works with USB barcode scanners that act as keyboards)
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    
    // Find product by barcode
    const product = products.find(p => p.barcode === barcode.trim());
    
    if (product) {
      addToCart(product);
      toast({ title: 'Product Added', description: `${product.name} added to cart` });
    } else {
      toast({ 
        title: 'Product Not Found', 
        description: `No product found with barcode: ${barcode}`,
        variant: 'destructive' 
      });
    }
    
    setBarcodeInput('');
  }, [products, toast]);

  // Handle barcode input - triggers on Enter key (USB scanners typically send Enter after barcode)
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeScan(barcodeInput);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .order('name');

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch products', variant: 'destructive' });
    } else {
      setProducts(data || []);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast({ title: 'Warning', description: 'Not enough stock', variant: 'destructive' });
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.product.stock_quantity) {
          toast({ title: 'Warning', description: 'Not enough stock', variant: 'destructive' });
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateCustomPrice = (productId: string, price: string) => {
    const numPrice = parseFloat(price);
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, customPrice: isNaN(numPrice) ? undefined : numPrice }
        : item
    ));
  };

  const getItemPrice = (item: CartItem) => item.customPrice ?? item.product.price;

  const subtotal = cart.reduce((sum, item) => sum + (getItemPrice(item) * item.quantity), 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal - discountAmount;
  const change = (parseFloat(amountPaid) || 0) - total;

  const processSale = async () => {
    if (cart.length === 0) {
      toast({ title: 'Error', description: 'Cart is empty', variant: 'destructive' });
      return;
    }

    // For credit sales, customer must be selected
    if (paymentMethod === 'credit' && !selectedCustomerId) {
      toast({ title: 'Error', description: 'Please select a customer for credit sale', variant: 'destructive' });
      return;
    }

    if (paymentMethod === 'cash' && change < 0) {
      toast({ title: 'Error', description: 'Insufficient payment', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Generate receipt number
      const { data: receiptData } = await supabase.rpc('generate_receipt_number');
      const receiptNumber = receiptData || `RCP-${Date.now()}`;

      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      const actualAmountPaid = paymentMethod === 'credit' ? (parseFloat(amountPaid) || 0) : (parseFloat(amountPaid) || total);

      // Create sale record with optional backdate
      const saleData: any = {
        receipt_number: receiptNumber,
        customer_id: selectedCustomerId || null,
        customer_name: selectedCustomer?.name || customerName || 'Walk In',
        subtotal,
        discount: discountAmount,
        total,
        payment_method: paymentMethod as any,
        amount_paid: actualAmountPaid,
        change_given: paymentMethod === 'cash' ? Math.max(0, change) : 0,
        sold_by: user?.id,
        notes: paymentMethod === 'credit' 
          ? `Credit Sale - ${creditNotes}` 
          : saleDate ? `Backdated sale from ${format(saleDate, 'PPP')}` : null
      };

      // If backdating, override created_at
      if (saleDate) {
        saleData.created_at = saleDate.toISOString();
      }

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: getItemPrice(item),
        total_price: getItemPrice(item) * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // If credit sale, create credit_sales record
      if (paymentMethod === 'credit' && selectedCustomerId) {
        const balance = total - actualAmountPaid;
        const { error: creditError } = await supabase
          .from('credit_sales')
          .insert({
            sale_id: sale.id,
            customer_id: selectedCustomerId,
            total_amount: total,
            amount_paid: actualAmountPaid,
            balance: balance,
            status: balance <= 0 ? 'paid' : actualAmountPaid > 0 ? 'partial' : 'pending',
            notes: creditNotes || null
          });

        if (creditError) throw creditError;

        // Record initial payment if any
        if (actualAmountPaid > 0) {
          const { data: creditSale } = await supabase
            .from('credit_sales')
            .select('id')
            .eq('sale_id', sale.id)
            .single();

          if (creditSale) {
            await supabase.from('credit_payments').insert({
              credit_sale_id: creditSale.id,
              amount: actualAmountPaid,
              payment_method: 'cash',
              received_by: user?.id,
              notes: 'Initial deposit'
            });
          }
        }
      }

      // Update stock and create inventory transactions
      for (const item of cart) {
        const newStock = item.product.stock_quantity - item.quantity;
        
        await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product.id);

        await supabase
          .from('inventory_transactions')
          .insert({
            product_id: item.product.id,
            transaction_type: 'sale',
            quantity: -item.quantity,
            previous_stock: item.product.stock_quantity,
            new_stock: newStock,
            reference_id: sale.id,
            created_by: user?.id
          });
      }

      setLastSale({ ...sale, items: cart, isCredit: paymentMethod === 'credit' });
      setShowReceipt(true);
      
      // Reset
      setCart([]);
      setAmountPaid('');
      setCustomerName('');
      setDiscount('0');
      setSelectedCustomerId('');
      setCreditNotes('');
      setSaleDate(undefined);
      fetchProducts();

      toast({ title: 'Success', description: paymentMethod === 'credit' ? 'Credit sale recorded successfully' : 'Sale completed successfully' });

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const handleEndDay = async () => {
    // Reset to today and refresh the balance before showing dialog
    setEndDayDate(undefined);
    await fetchCashRegisterBalance();
    setEndDayDialogOpen(true);
  };

  const handleEndDayDateChange = async (date: Date | undefined) => {
    setEndDayDate(date);
    await fetchCashRegisterBalance(date);
  };

  const endDay = async () => {
    if (!bankSettings?.bankName) {
      toast({ 
        title: 'Bank not configured', 
        description: 'Please configure your bank account in Settings before closing shift', 
        variant: 'destructive' 
      });
      return;
    }

    if (cashRegisterBalance <= 0) {
      toast({ 
        title: 'Cannot close shift', 
        description: 'No cash balance available to deposit', 
        variant: 'destructive' 
      });
      setEndDayDialogOpen(false);
      return;
    }

    setClosingShift(true);
    try {
      const targetDate = endDayDate || new Date();
      const dateStr = format(targetDate, 'yyyy-MM-dd');
      
      // Create bank deposit for the closing balance
      const { error: depositError } = await supabase
        .from('bank_deposits')
        .insert({
          amount: cashRegisterBalance,
          bank_name: bankSettings.bankName,
          account_number: bankSettings.accountNumber || null,
          deposit_date: dateStr,
          reference_number: `SHIFT-${dateStr}-${Date.now()}`,
          notes: `End of day deposit for ${format(targetDate, 'PPP')}`,
          deposited_by: user?.id
        });

      if (depositError) throw depositError;

      // Get or create cash register entry for the target date
      const { data: existingRegister } = await supabase
        .from('cash_register')
        .select('*')
        .eq('date', dateStr)
        .maybeSingle();

      if (existingRegister) {
        // Update existing register
        await supabase
          .from('cash_register')
          .update({
            total_deposits: (existingRegister.total_deposits || 0) + cashRegisterBalance,
            closing_balance: 0,
            closed_by: user?.id
          })
          .eq('id', existingRegister.id);
      } else {
        // Create new register entry and mark as closed
        const previousDay = new Date(targetDate);
        previousDay.setDate(previousDay.getDate() - 1);
        const previousDayStr = previousDay.toISOString().split('T')[0];

        const { data: previousDayRegister } = await supabase
          .from('cash_register')
          .select('closing_balance')
          .eq('date', previousDayStr)
          .maybeSingle();

        const openingBalance = previousDayRegister?.closing_balance || 0;

        await supabase
          .from('cash_register')
          .insert({
            date: dateStr,
            opening_balance: openingBalance,
            total_sales: 0,
            total_refunds: 0,
            total_expenses: 0,
            total_deposits: cashRegisterBalance,
            closing_balance: 0,
            closed_by: user?.id
          });
      }

      toast({ 
        title: 'Day ended successfully', 
        description: `${formatCurrency(cashRegisterBalance)} deposited to ${bankSettings.bankName} for ${format(targetDate, 'PPP')}` 
      });
      
      setEndDayDialogOpen(false);
      setEndDayDate(undefined);
      setCashRegisterBalance(0);

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setClosingShift(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Point of Sale</h1>
          <p className="text-muted-foreground">Process sales and generate receipts</p>
        </div>
        {bankSettings?.bankName && (
          <Button 
            variant="outline" 
            onClick={handleEndDay}
            className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
          >
            <Power className="h-4 w-4" />
            End Day
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barcode Scanner Section */}
          <Card className={`border-2 ${scannerMode ? 'border-primary bg-primary/5' : 'border-dashed'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={scannerMode ? "default" : "outline"}
                  onClick={() => setScannerMode(!scannerMode)}
                  className="gap-2"
                >
                  <ScanLine className="h-4 w-4" />
                  {scannerMode ? 'Scanner Active' : 'Enable Scanner'}
                </Button>
                
                {scannerMode && (
                  <div className="flex-1 relative">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={barcodeInputRef}
                      placeholder="Scan barcode or type manually..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={handleBarcodeKeyDown}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                )}
                
                {!scannerMode && (
                  <p className="text-sm text-muted-foreground">
                    Click to enable barcode scanner mode. Works with USB barcode scanners.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                  <p className="text-primary font-bold mt-1">{formatCurrency(product.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Stock: {product.stock_quantity}
                    </Badge>
                    {product.barcode && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Barcode className="h-3 w-3" />
                        {product.barcode}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No products available. Add products first.
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Cart is empty</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex flex-col gap-2 p-2 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Original: {formatCurrency(item.product.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.product.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                        <Input
                          type="number"
                          value={item.customPrice ?? item.product.price}
                          onChange={(e) => updateCustomPrice(item.product.id, e.target.value)}
                          className="h-7 text-sm flex-1"
                          placeholder="Custom price"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          = {formatCurrency(getItemPrice(item) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm items-center gap-2">
                  <span>Discount (UGX)</span>
                  <Input 
                    type="number" 
                    value={discount} 
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-28 h-8 text-right"
                  />
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Customer Name (Optional)</Label>
                  <Input 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                  />
                </div>

                {/* Backdate Sale Option */}
                <div>
                  <Label>Sale Date (Optional - for missed sales)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !saleDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {saleDate ? format(saleDate, "PPP") : <span>Today (default)</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={saleDate}
                        onSelect={setSaleDate}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                      {saleDate && (
                        <div className="p-2 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setSaleDate(undefined)}
                          >
                            Clear (use today)
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  {saleDate && (
                    <p className="text-xs text-orange-600 mt-1">
                      This sale will be recorded as {format(saleDate, "PPPP")}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit">Credit (Installments)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentMethod === 'credit' && (
                  <div className="space-y-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div>
                      <Label className="text-orange-600">Select Customer *</Label>
                      <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} {c.phone && `(${c.phone})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Initial Deposit (UGX)</Label>
                      <Input 
                        type="number"
                        value={amountPaid} 
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="0 (optional)"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Balance: {formatCurrency(total - (parseFloat(amountPaid) || 0))}
                      </p>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input 
                        value={creditNotes} 
                        onChange={(e) => setCreditNotes(e.target.value)}
                        placeholder="Payment terms, etc."
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div>
                    <Label>Amount Paid (UGX)</Label>
                    <Input 
                      type="number"
                      value={amountPaid} 
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="0"
                    />
                    {change > 0 && (
                      <p className="text-sm text-green-600 mt-1">Change: {formatCurrency(change)}</p>
                    )}
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={processSale}
                  disabled={loading || cart.length === 0}
                >
                  {loading ? 'Processing...' : `Complete Sale - ${formatCurrency(total)}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Receipt
              <Button size="icon" variant="ghost" onClick={printReceipt}>
                <Printer className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-4 text-sm" id="receipt">
              <div className="flex items-start gap-3 border-b pb-4">
                <img src={fadyLogo} alt="Fady Technologies" className="h-12 w-auto" />
                <div>
                  <h2 className="font-bold text-lg">FADY TECHNOLOGIES</h2>
                  <p className="text-muted-foreground text-xs">Network Equipment Store</p>
                  <p className="text-xs text-muted-foreground mt-1">Receipt #{lastSale.receipt_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(lastSale.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p><strong>Customer:</strong> {lastSale.customer_name}</p>
                <div className="border-t border-b py-2 space-y-1">
                  {lastSale.items.map((item: CartItem) => (
                    <div key={item.product.id} className="flex justify-between">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span>{formatCurrency(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(lastSale.subtotal)}</span>
                </div>
                {lastSale.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(lastSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(lastSale.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid ({lastSale.payment_method.replace('_', ' ')})</span>
                  <span>{formatCurrency(lastSale.amount_paid)}</span>
                </div>
                {lastSale.change_given > 0 && (
                  <div className="flex justify-between">
                    <span>Change</span>
                    <span>{formatCurrency(lastSale.change_given)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center pt-4 border-t space-y-3">
                <QRCodeSVG 
                  value={`${window.location.origin}/admin/sales?receipt=${lastSale.receipt_number}`}
                  size={80}
                  level="M"
                />
                <div className="text-center text-muted-foreground text-xs">
                  <p>Thank you for your purchase!</p>
                  <p>Scan QR for receipt details</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* End Day Dialog */}
      <Dialog open={endDayDialogOpen} onOpenChange={setEndDayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Power className="h-5 w-5 text-orange-600" />
              End Day & Deposit to Bank
            </DialogTitle>
            <DialogDescription>
              This will close the shift for the selected date and deposit the full cash register balance to your bank account.
            </DialogDescription>
          </DialogHeader>
          
          {/* Date picker for custom date */}
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDayDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDayDate ? format(endDayDate, "PPP") : <span>Today</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDayDate}
                  onSelect={handleEndDayDateChange}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
                {endDayDate && (
                  <div className="p-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleEndDayDateChange(undefined)}
                    >
                      Clear (use today)
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-muted-foreground">Amount to deposit</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(cashRegisterBalance)}</p>
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

            {cashRegisterBalance <= 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  No cash balance available to deposit. Make some sales first!
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEndDayDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={endDay} 
              disabled={closingShift || cashRegisterBalance <= 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {closingShift ? 'Processing...' : 'End Day & Deposit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PointOfSale;
