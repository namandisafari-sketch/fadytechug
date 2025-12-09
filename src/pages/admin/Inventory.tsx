import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ClipboardList, Plus, Minus, RefreshCw, AlertTriangle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  category: string;
}

interface InventoryTransaction {
  id: string;
  product_id: string;
  transaction_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes: string | null;
  created_at: string;
  products: { name: string };
}

const Inventory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<string>('adjustment');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, category')
      .order('name');

    if (!error) setProducts(data || []);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*, products(name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error) setTransactions(data || []);
  };

  const handleAdjustment = async () => {
    if (!selectedProduct || !quantity) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const product = products.find(p => p.id === selectedProduct);
      if (!product) throw new Error('Product not found');

      const qty = parseInt(quantity);
      const newStock = adjustmentType === 'damage' || adjustmentType === 'return' 
        ? product.stock_quantity - Math.abs(qty)
        : product.stock_quantity + qty;

      if (newStock < 0) {
        throw new Error('Stock cannot go negative');
      }

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
          quantity: adjustmentType === 'damage' ? -Math.abs(qty) : qty,
          previous_stock: product.stock_quantity,
          new_stock: newStock,
          notes,
          created_by: user?.id
        });

      toast({ title: 'Success', description: 'Inventory adjusted successfully' });
      setDialogOpen(false);
      setSelectedProduct('');
      setQuantity('');
      setNotes('');
      fetchProducts();
      fetchTransactions();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const lowStockProducts = products.filter(p => p.stock_quantity <= 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">Track and adjust stock levels</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Adjust Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Inventory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock_quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Adjustment Type</Label>
                <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adjustment">Adjustment (Add)</SelectItem>
                    <SelectItem value="purchase">Purchase (Add)</SelectItem>
                    <SelectItem value="damage">Damage (Remove)</SelectItem>
                    <SelectItem value="return">Return to Supplier (Remove)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input 
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for adjustment"
                />
              </div>

              <Button onClick={handleAdjustment} disabled={loading} className="w-full">
                {loading ? 'Processing...' : 'Submit Adjustment'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-500 bg-orange-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert ({lowStockProducts.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map(p => (
                <Badge key={p.id} variant="outline" className="border-orange-500 text-orange-600">
                  {p.name}: {p.stock_quantity} left
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Current Stock Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">{product.stock_quantity}</TableCell>
                  <TableCell>
                    <Badge variant={product.stock_quantity <= 5 ? 'destructive' : product.stock_quantity <= 20 ? 'secondary' : 'default'}>
                      {product.stock_quantity <= 5 ? 'Low' : product.stock_quantity <= 20 ? 'Medium' : 'Good'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inventory Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Previous</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{tx.products?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{tx.transaction_type}</Badge>
                  </TableCell>
                  <TableCell className={`text-right ${tx.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                  </TableCell>
                  <TableCell className="text-right">{tx.previous_stock}</TableCell>
                  <TableCell className="text-right">{tx.new_stock}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{tx.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
