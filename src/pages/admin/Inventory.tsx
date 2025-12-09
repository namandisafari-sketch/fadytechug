import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  ClipboardList, RefreshCw, AlertTriangle, Search, Package, 
  MapPin, Barcode, TrendingDown, TrendingUp, Filter, Download,
  Box, Warehouse, History, Settings
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  category: string;
  price: number;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  barcode: string | null;
  model: string | null;
  manufacturer: string | null;
  sku: string | null;
  reorder_level: number | null;
  reorder_quantity: number | null;
  location: string | null;
  condition: string | null;
  serial_numbers: string[] | null;
  warranty_months: number | null;
  unit_cost: number | null;
  weight_kg: number | null;
  dimensions: string | null;
}

interface InventoryTransaction {
  id: string;
  product_id: string;
  transaction_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes: string | null;
  unit_cost: number | null;
  created_at: string;
  products: { name: string };
}

const CATEGORIES = ['Routers', 'Switches', 'Cables', 'Servers', 'Accessories', 'Networking', 'Other'];
const LOCATIONS = ['Warehouse A', 'Warehouse B', 'Store Front', 'Service Center', 'Returns'];
const CONDITIONS = ['New', 'Refurbished', 'Open Box', 'Used - Like New', 'Used - Good', 'Damaged'];

const Inventory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<string>('adjustment');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [serialNumbers, setSerialNumbers] = useState('');
  const [condition, setCondition] = useState('New');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  
  // Settings
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [reorderThreshold, setReorderThreshold] = useState(10);

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (!error) setProducts(data || []);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*, products(name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error) setTransactions(data || []);
  };

  const resetForm = () => {
    setSelectedProduct('');
    setQuantity('');
    setUnitCost('');
    setNotes('');
    setLocation('');
    setSerialNumbers('');
    setCondition('New');
    setAdjustmentType('adjustment');
  };

  const handleAdjustment = async () => {
    if (!selectedProduct || !quantity) {
      toast({ title: 'Error', description: 'Please select product and enter quantity', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const product = products.find(p => p.id === selectedProduct);
      if (!product) throw new Error('Product not found');

      const qty = parseInt(quantity);
      const isRemoval = adjustmentType === 'damage' || adjustmentType === 'return';
      const newStock = isRemoval 
        ? product.stock_quantity - Math.abs(qty)
        : product.stock_quantity + qty;

      if (newStock < 0) {
        throw new Error('Stock cannot go negative');
      }

      // Build notes with additional info
      const fullNotes = [
        notes,
        location ? `Location: ${location}` : '',
        condition !== 'New' ? `Condition: ${condition}` : '',
        serialNumbers ? `S/N: ${serialNumbers}` : ''
      ].filter(Boolean).join(' | ');

      // Update product stock
      await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', selectedProduct);

      // Create transaction record
      await supabase
        .from('inventory_transactions')
        .insert({
          product_id: selectedProduct,
          transaction_type: adjustmentType as any,
          quantity: isRemoval ? -Math.abs(qty) : qty,
          previous_stock: product.stock_quantity,
          new_stock: newStock,
          unit_cost: unitCost ? parseFloat(unitCost) : null,
          notes: fullNotes || null,
          created_by: user?.id
        });

      toast({ title: 'Success', description: 'Inventory adjusted successfully' });
      setDialogOpen(false);
      resetForm();
      fetchProducts();
      fetchTransactions();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStock = stockFilter === 'all' 
      || (stockFilter === 'low' && p.stock_quantity <= lowStockThreshold)
      || (stockFilter === 'reorder' && p.stock_quantity <= reorderThreshold && p.stock_quantity > lowStockThreshold)
      || (stockFilter === 'good' && p.stock_quantity > reorderThreshold)
      || (stockFilter === 'out' && p.stock_quantity === 0);
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Stats
  const lowStockProducts = products.filter(p => p.stock_quantity <= lowStockThreshold && p.stock_quantity > 0);
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0);
  const reorderProducts = products.filter(p => p.stock_quantity <= reorderThreshold && p.stock_quantity > lowStockThreshold);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
  const totalItems = products.reduce((sum, p) => sum + p.stock_quantity, 0);

  const exportInventory = () => {
    const csv = [
      ['Product', 'Category', 'Stock', 'Price', 'Value', 'Status'].join(','),
      ...filteredProducts.map(p => [
        `"${p.name}"`,
        p.category,
        p.stock_quantity,
        p.price,
        p.price * p.stock_quantity,
        p.stock_quantity <= lowStockThreshold ? 'Low' : p.stock_quantity <= reorderThreshold ? 'Reorder' : 'Good'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">Track, adjust, and manage network equipment stock</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportInventory}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><RefreshCw className="h-4 w-4 mr-2" />Stock Adjustment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Stock Adjustment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Product *</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{p.name}</span>
                            <Badge variant="outline" className="ml-2">Stock: {p.stock_quantity}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Adjustment Type *</Label>
                  <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adjustment">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />Adjustment (Add)
                        </div>
                      </SelectItem>
                      <SelectItem value="purchase">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-600" />Purchase Received
                        </div>
                      </SelectItem>
                      <SelectItem value="damage">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />Damage/Loss (Remove)
                        </div>
                      </SelectItem>
                      <SelectItem value="return">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-orange-600" />Return to Supplier
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity *</Label>
                    <Input 
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter quantity"
                      min={1}
                    />
                  </div>
                  <div>
                    <Label>Unit Cost (UGX)</Label>
                    <Input 
                      type="number"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="Cost per unit"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Location</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Condition</Label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Serial Numbers</Label>
                  <Textarea 
                    value={serialNumbers}
                    onChange={(e) => setSerialNumbers(e.target.value)}
                    placeholder="Enter serial numbers (one per line or comma-separated)"
                    className="h-20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">For tracking individual units</p>
                </div>

                <div>
                  <Label>Notes / Reason</Label>
                  <Textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reason for adjustment, supplier info, etc."
                  />
                </div>

                <Button onClick={handleAdjustment} disabled={loading} className="w-full">
                  {loading ? 'Processing...' : 'Submit Adjustment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Box className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold">{totalItems.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Warehouse className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inventory Value</p>
                <p className="text-xl font-bold">{formatCurrency(totalInventoryValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={outOfStockProducts.length > 0 ? 'border-red-500' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Out of Stock</p>
                <p className="text-xl font-bold text-red-600">{outOfStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={lowStockProducts.length > 0 ? 'border-orange-500' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Low Stock</p>
                <p className="text-xl font-bold text-orange-600">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Need Reorder</p>
                <p className="text-xl font-bold text-yellow-600">{reorderProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <Card className="border-orange-500 bg-orange-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {outOfStockProducts.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">Out of Stock ({outOfStockProducts.length})</p>
                <div className="flex flex-wrap gap-2">
                  {outOfStockProducts.map(p => (
                    <Badge key={p.id} variant="destructive">{p.name}</Badge>
                  ))}
                </div>
              </div>
            )}
            {lowStockProducts.length > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-600 mb-2">Low Stock ({lowStockProducts.length})</p>
                <div className="flex flex-wrap gap-2">
                  {lowStockProducts.map(p => (
                    <Badge key={p.id} variant="outline" className="border-orange-500 text-orange-600">
                      {p.name}: {p.stock_quantity} left
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock" className="gap-2">
            <ClipboardList className="h-4 w-4" />Stock Levels
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />Transaction History
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />Settings
          </TabsTrigger>
        </TabsList>

        {/* Stock Levels Tab */}
        <TabsContent value="stock" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="reorder">Needs Reorder</SelectItem>
                <SelectItem value="good">Good Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Stock Levels ({filteredProducts.length} products)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU / Model</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Reorder Level</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Stock Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(product => {
                      const reorderLevel = product.reorder_level ?? lowStockThreshold;
                      const isLow = product.stock_quantity <= (product.reorder_level ?? lowStockThreshold);
                      const needsReorder = product.stock_quantity <= (product.reorder_quantity ?? reorderThreshold) && !isLow;
                      const isOut = product.stock_quantity === 0;
                      const stockValue = (product.unit_cost ?? product.price) * product.stock_quantity;
                      
                      return (
                        <TableRow key={product.id} className={isOut ? 'bg-red-50 dark:bg-red-950/20' : isLow ? 'bg-orange-50 dark:bg-orange-950/20' : ''}>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">{product.category}</Badge>
                              {product.barcode && (
                                <Badge variant="secondary" className="text-xs font-mono gap-1">
                                  <Barcode className="h-3 w-3" />{product.barcode}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {product.sku && <div className="font-mono">{product.sku}</div>}
                              {product.model && <div className="text-muted-foreground text-xs">{product.model}</div>}
                              {!product.sku && !product.model && <span className="text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.manufacturer || <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            {product.location ? (
                              <Badge variant="outline" className="gap-1">
                                <MapPin className="h-3 w-3" />{product.location}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.condition ? (
                              <Badge variant={product.condition === 'new' ? 'default' : 'secondary'} className="capitalize">
                                {product.condition}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            <span className={isOut ? 'text-red-600' : isLow ? 'text-orange-600' : ''}>
                              {product.stock_quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {reorderLevel}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.unit_cost ? formatCurrency(product.unit_cost) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(stockValue)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isOut ? 'destructive' : isLow ? 'secondary' : needsReorder ? 'outline' : 'default'}>
                              {isOut ? 'Out of Stock' : isLow ? 'Low' : needsReorder ? 'Reorder' : 'Good'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                          No products found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Transactions (Last 100)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Before</TableHead>
                    <TableHead className="text-right">After</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">
                        <div>{new Date(tx.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{tx.products?.name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`capitalize ${
                            tx.transaction_type === 'purchase' ? 'border-blue-500 text-blue-600' :
                            tx.transaction_type === 'damage' ? 'border-red-500 text-red-600' :
                            tx.transaction_type === 'return' ? 'border-orange-500 text-orange-600' :
                            'border-green-500 text-green-600'
                          }`}
                        >
                          {tx.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-mono font-medium ${tx.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono">{tx.previous_stock}</TableCell>
                      <TableCell className="text-right font-mono">{tx.new_stock}</TableCell>
                      <TableCell className="text-right">
                        {tx.unit_cost ? formatCurrency(tx.unit_cost) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {tx.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
              <CardDescription>Configure stock level thresholds and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Low Stock Threshold</Label>
                  <Input 
                    type="number" 
                    value={lowStockThreshold} 
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Products with stock at or below this level will be marked as "Low Stock"
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Reorder Threshold</Label>
                  <Input 
                    type="number" 
                    value={reorderThreshold} 
                    onChange={(e) => setReorderThreshold(parseInt(e.target.value) || 10)}
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Products with stock at or below this level will be flagged for reorder
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Storage Locations</h4>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map(loc => (
                    <Badge key={loc} variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />{loc}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Product Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map(cond => (
                    <Badge key={cond} variant="outline">
                      <Barcode className="h-3 w-3 mr-1" />{cond}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;