import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, ShoppingBag, Search, Eye, Check, Trash2, Package, Barcode } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { formatUgandaDate } from '@/lib/utils';

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  barcode: string | null;
  unit_cost: number | null;
}

interface PurchaseOrderItem {
  product_id: string;
  product_name: string;
  barcode: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  received_at: string | null;
  suppliers: { name: string };
}

interface POWithItems extends PurchaseOrder {
  purchase_order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    received_quantity: number | null;
    products: { name: string; barcode: string | null };
  }>;
}

const STATUS_OPTIONS = ['awaiting_delivery', 'partially_received', 'received', 'cancelled'];

const PurchaseOrders = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<POWithItems | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name)')
      .order('created_at', { ascending: false });

    if (!error) setOrders(data || []);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('id, name').eq('is_active', true).order('name');
    if (data) setSuppliers(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, name, price, stock_quantity, barcode, unit_cost').eq('is_active', true).order('name');
    if (data) setProducts(data);
  };

  const searchByBarcode = () => {
    if (!barcodeSearch.trim()) {
      toast({ title: 'Error', description: 'Please enter a barcode', variant: 'destructive' });
      return;
    }
    
    const product = products.find(p => p.barcode === barcodeSearch.trim());
    if (product) {
      setSelectedProduct(product.id);
      setItemCost((product.unit_cost || 0).toString());
      setItemQuantity('1');
      setBarcodeSearch('');
      toast({ title: 'Product Found', description: product.name });
    } else {
      toast({ title: 'Not Found', description: 'No product matches this barcode', variant: 'destructive' });
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    const product = products.find(p => p.id === productId);
    if (product && product.unit_cost) {
      setItemCost(product.unit_cost.toString());
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.barcode && p.barcode.includes(productSearch))
  );

  const resetForm = () => {
    setSupplierId('');
    setNotes('');
    setOrderItems([]);
    setSelectedProduct('');
    setItemQuantity('');
    setItemCost('');
    setProductSearch('');
    setBarcodeSearch('');
  };

  const addItem = () => {
    if (!selectedProduct || !itemQuantity || !itemCost) {
      toast({ title: 'Error', description: 'Please fill all item fields', variant: 'destructive' });
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const qty = parseInt(itemQuantity);
    const cost = parseFloat(itemCost);

    setOrderItems([...orderItems, {
      product_id: product.id,
      product_name: product.name,
      barcode: product.barcode,
      quantity: qty,
      unit_cost: cost,
      total_cost: qty * cost
    }]);

    setSelectedProduct('');
    setItemQuantity('');
    setItemCost('');
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const createOrder = async () => {
    if (!supplierId || orderItems.length === 0) {
      toast({ title: 'Error', description: 'Please select supplier and add items', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Generate order number
      const { data: orderNumber } = await supabase.rpc('generate_order_number');
      
      const totalAmount = orderItems.reduce((sum, item) => sum + item.total_cost, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          order_number: orderNumber,
          supplier_id: supplierId,
          total_amount: totalAmount,
          notes: notes || null,
          ordered_by: user?.id,
          status: 'awaiting_delivery'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const items = orderItems.map(item => ({
        purchase_order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.total_cost
      }));

      const { error: itemsError } = await supabase.from('purchase_order_items').insert(items);
      if (itemsError) throw itemsError;

      toast({ title: 'Success', description: 'Purchase order created' });
      setDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const viewOrder = async (orderId: string) => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name), purchase_order_items(*, products(name, barcode))')
      .eq('id', orderId)
      .single();

    if (!error && data) {
      setSelectedOrder(data as POWithItems);
      setViewDialogOpen(true);
    }
  };

  const receiveOrder = async () => {
    if (!selectedOrder) return;

    setLoading(true);
    try {
      // Update order status
      await supabase
        .from('purchase_orders')
        .update({ status: 'received', received_at: new Date().toISOString() })
        .eq('id', selectedOrder.id);

      // Update inventory for each item
      for (const item of selectedOrder.purchase_order_items) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          const newStock = product.stock_quantity + item.quantity;
          
          // Update product stock
          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id);

          // Create inventory transaction
          await supabase.from('inventory_transactions').insert({
            product_id: item.product_id,
            transaction_type: 'purchase',
            quantity: item.quantity,
            previous_stock: product.stock_quantity,
            new_stock: newStock,
            unit_cost: item.unit_cost,
            reference_id: selectedOrder.id,
            notes: `Received from PO: ${selectedOrder.order_number}`,
            created_by: user?.id
          });
        }
      }

      toast({ title: 'Success', description: 'Order received and inventory updated' });
      setViewDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (status: string) => {
    if (!selectedOrder) return;

    const { error } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('id', selectedOrder.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Status updated' });
      setViewDialogOpen(false);
      fetchOrders();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'awaiting_delivery': return 'default';
      case 'partially_received': return 'outline';
      case 'received': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'awaiting_delivery': return 'Awaiting Delivery';
      case 'partially_received': return 'Partially Received';
      case 'received': return 'Received';
      case 'cancelled': return 'Cancelled';
      default: return status.replace('_', ' ');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrderItems = orderItems.reduce((sum, item) => sum + item.total_cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage supplier orders and inventory replenishment</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Order</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Supplier *</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Add Items */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Add Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Barcode Search */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={barcodeSearch}
                        onChange={(e) => setBarcodeSearch(e.target.value)}
                        placeholder="Scan or type barcode..."
                        className="pl-10"
                        onKeyDown={(e) => e.key === 'Enter' && searchByBarcode()}
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={searchByBarcode}>
                      Find
                    </Button>
                  </div>

                  {/* Product Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm">Or search by name:</Label>
                    <Input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products..."
                      className="mb-2"
                    />
                    <Select value={selectedProduct} onValueChange={handleProductSelect}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {filteredProducts.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} {p.barcode && <span className="text-muted-foreground">({p.barcode})</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity and Cost */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Quantity</Label>
                      <Input type="number" placeholder="Qty" value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)} />
                    </div>
                    <div>
                      <Label>Unit Cost (UGX)</Label>
                      <Input type="number" placeholder="Unit Cost" value={itemCost} onChange={(e) => setItemCost(e.target.value)} />
                    </div>
                  </div>

                  <Button type="button" variant="outline" onClick={addItem} className="w-full">
                    <Plus className="h-4 w-4 mr-1" />Add Item to Order
                  </Button>
                </CardContent>
              </Card>

              {/* Order Items */}
              {orderItems.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Order Items ({orderItems.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Barcode</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell>
                              {item.barcode ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  <Barcode className="h-3 w-3 mr-1" />
                                  {item.barcode}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unit_cost)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total_cost)}</TableCell>
                            <TableCell>
                              <Button size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} className="font-bold text-right">Total:</TableCell>
                          <TableCell className="font-bold text-right">{formatCurrency(totalOrderItems)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" />
              </div>

              <Button onClick={createOrder} disabled={loading || orderItems.length === 0} className="w-full">
                {loading ? 'Creating...' : 'Create Purchase Order'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Purchase Orders ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">{order.order_number}</TableCell>
                  <TableCell>{order.suppliers?.name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell>{formatUgandaDate(order.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => viewOrder(order.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No orders found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedOrder.suppliers?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(selectedOrder.status)} className="capitalize">
                    {selectedOrder.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p>{formatUgandaDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedOrder.total_amount)}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.purchase_order_items?.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.products?.name}</TableCell>
                      <TableCell>
                        {item.products?.barcode ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            <Barcode className="h-3 w-3 mr-1" />
                            {item.products.barcode}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_cost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total_cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {selectedOrder.notes && (
                <div className="p-3 bg-secondary rounded">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                {selectedOrder.status === 'pending' && (
                  <Button variant="outline" onClick={() => updateOrderStatus('ordered')}>Mark as Ordered</Button>
                )}
                {(selectedOrder.status === 'ordered' || selectedOrder.status === 'pending') && (
                  <Button onClick={receiveOrder} disabled={loading}>
                    <Check className="h-4 w-4 mr-2" />
                    {loading ? 'Processing...' : 'Receive Order & Update Inventory'}
                  </Button>
                )}
                {selectedOrder.status !== 'received' && selectedOrder.status !== 'cancelled' && (
                  <Button variant="destructive" onClick={() => updateOrderStatus('cancelled')}>Cancel</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;