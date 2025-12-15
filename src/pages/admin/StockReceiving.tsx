import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Package, Scan, Check, PackageCheck, AlertCircle, Truck } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import BarcodeScanner from '@/components/BarcodeScanner';

interface PendingOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    barcode: string | null;
    quantity: number;
    received_quantity: number;
    unit_cost: number;
  }>;
}

interface ReceivingItem {
  item_id: string;
  product_id: string;
  product_name: string;
  barcode: string | null;
  ordered_qty: number;
  received_qty: number;
  receiving_now: number;
  unit_cost: number;
  location: string;
  condition: string;
}

const StockReceiving = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickScanMode, setQuickScanMode] = useState(false);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        id, order_number, supplier_id, total_amount, status, created_at,
        suppliers(name),
        purchase_order_items(id, product_id, quantity, received_quantity, unit_cost, products(name, barcode))
      `)
      .in('status', ['awaiting_delivery', 'partially_received'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      const orders = data.map(order => ({
        id: order.id,
        order_number: order.order_number,
        supplier_id: order.supplier_id,
        supplier_name: order.suppliers?.name || 'Unknown',
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        items: order.purchase_order_items.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name || 'Unknown',
          barcode: item.products?.barcode || null,
          quantity: item.quantity,
          received_quantity: item.received_quantity || 0,
          unit_cost: item.unit_cost
        }))
      }));
      setPendingOrders(orders);
    }
  };

  const selectOrder = (order: PendingOrder) => {
    setSelectedOrder(order);
    setReceivingItems(order.items.map(item => ({
      item_id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      barcode: item.barcode,
      ordered_qty: item.quantity,
      received_qty: item.received_quantity,
      receiving_now: item.quantity - item.received_quantity,
      unit_cost: item.unit_cost,
      location: 'Main Warehouse',
      condition: 'new'
    })));
  };

  const handleBarcodeScan = (barcode: string) => {
    setScannerOpen(false);
    
    // Find item in receiving list by barcode
    const itemIndex = receivingItems.findIndex(item => item.barcode === barcode);
    
    if (itemIndex >= 0) {
      // Increment receiving quantity for this item
      const updated = [...receivingItems];
      const remaining = updated[itemIndex].ordered_qty - updated[itemIndex].received_qty;
      if (updated[itemIndex].receiving_now < remaining) {
        updated[itemIndex].receiving_now += 1;
        setReceivingItems(updated);
        toast({ title: 'Scanned', description: `+1 ${updated[itemIndex].product_name}` });
      } else {
        toast({ title: 'Full', description: 'All ordered units already counted', variant: 'destructive' });
      }
      
      if (quickScanMode) {
        setTimeout(() => setScannerOpen(true), 500);
      }
    } else {
      // Check if barcode belongs to any product in pending orders
      const matchingOrder = pendingOrders.find(o => 
        o.items.some(item => item.barcode === barcode)
      );
      
      if (matchingOrder && !selectedOrder) {
        selectOrder(matchingOrder);
        toast({ title: 'Order Found', description: `Loaded ${matchingOrder.order_number} from ${matchingOrder.supplier_name}` });
      } else {
        toast({ title: 'Not Found', description: 'Barcode not in pending orders', variant: 'destructive' });
      }
    }
  };

  const updateReceivingQty = (index: number, qty: number) => {
    const updated = [...receivingItems];
    const max = updated[index].ordered_qty - updated[index].received_qty;
    updated[index].receiving_now = Math.min(Math.max(0, qty), max);
    setReceivingItems(updated);
  };

  const updateItemField = (index: number, field: 'location' | 'condition', value: string) => {
    const updated = [...receivingItems];
    updated[index][field] = value;
    setReceivingItems(updated);
  };

  const receiveAll = () => {
    setReceivingItems(receivingItems.map(item => ({
      ...item,
      receiving_now: item.ordered_qty - item.received_qty
    })));
  };

  const processReceiving = async () => {
    if (!selectedOrder || !user) return;
    
    const itemsToReceive = receivingItems.filter(item => item.receiving_now > 0);
    if (itemsToReceive.length === 0) {
      toast({ title: 'Error', description: 'No items to receive', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      for (const item of itemsToReceive) {
        // Get current product stock
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (!product) continue;

        const newStock = product.stock_quantity + item.receiving_now;

        // Update product stock
        await supabase
          .from('products')
          .update({ 
            stock_quantity: newStock,
            location: item.location,
            condition: item.condition,
            is_active: item.location === 'Store Front' ? true : undefined
          })
          .eq('id', item.product_id);

        // Create inventory transaction
        await supabase.from('inventory_transactions').insert({
          product_id: item.product_id,
          transaction_type: 'purchase',
          quantity: item.receiving_now,
          previous_stock: product.stock_quantity,
          new_stock: newStock,
          unit_cost: item.unit_cost,
          reference_id: selectedOrder.id,
          notes: `Received from PO: ${selectedOrder.order_number} | Location: ${item.location}`,
          created_by: user.id
        });

        // Update PO item received quantity
        const newReceivedQty = item.received_qty + item.receiving_now;
        await supabase
          .from('purchase_order_items')
          .update({ received_quantity: newReceivedQty })
          .eq('id', item.item_id);
      }

      // Check if all items fully received
      const allReceived = receivingItems.every(item => 
        (item.received_qty + item.receiving_now) >= item.ordered_qty
      );

      const anyReceived = receivingItems.some(item => 
        (item.received_qty + item.receiving_now) > 0
      );

      // Update PO status
      const newStatus = allReceived ? 'received' : (anyReceived ? 'partially_received' : selectedOrder.status);
      await supabase
        .from('purchase_orders')
        .update({ 
          status: newStatus,
          received_at: allReceived ? new Date().toISOString() : null
        })
        .eq('id', selectedOrder.id);

      toast({ 
        title: 'Stock Received', 
        description: `${itemsToReceive.length} items added to inventory` 
      });

      setSelectedOrder(null);
      setReceivingItems([]);
      fetchPendingOrders();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const totalReceiving = receivingItems.reduce((sum, item) => sum + (item.receiving_now * item.unit_cost), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Receiving</h1>
          <p className="text-muted-foreground">Receive incoming shipments and update inventory</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={quickScanMode ? "default" : "outline"} 
            onClick={() => setQuickScanMode(!quickScanMode)}
          >
            <Scan className="h-4 w-4 mr-2" />
            {quickScanMode ? 'Quick Scan: ON' : 'Quick Scan: OFF'}
          </Button>
          <Button onClick={() => setScannerOpen(true)}>
            <Scan className="h-4 w-4 mr-2" />
            Scan Barcode
          </Button>
        </div>
      </div>

      {!selectedOrder ? (
        <>
          {/* Pending Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Pending Shipments ({pendingOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No pending orders to receive</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingOrders.map(order => (
                    <Card key={order.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => selectOrder(order)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono font-bold">{order.order_number}</span>
                          <Badge variant="secondary" className="capitalize">{order.status.replace('_', ' ')}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{order.supplier_name}</p>
                        <p className="text-lg font-bold">{formatCurrency(order.total_amount)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{order.items.length} items</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Scan Instructions */}
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Scan className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Quick Receiving</h3>
              <p className="text-muted-foreground mb-4">
                Scan a product barcode to automatically find and load its purchase order
              </p>
              <Button size="lg" onClick={() => setScannerOpen(true)}>
                <Scan className="h-5 w-5 mr-2" />
                Start Scanning
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Selected Order Header */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">{selectedOrder.order_number}</span>
                    <Badge>{selectedOrder.status}</Badge>
                  </div>
                  <p className="text-muted-foreground">From: {selectedOrder.supplier_name}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setSelectedOrder(null); setReceivingItems([]); }}>
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={receiveAll}>
                    <PackageCheck className="h-4 w-4 mr-2" />
                    Receive All
                  </Button>
                  <Button onClick={() => setScannerOpen(true)}>
                    <Scan className="h-4 w-4 mr-2" />
                    Scan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receiving Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items to Receive</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Ordered</TableHead>
                    <TableHead className="text-center">Already Received</TableHead>
                    <TableHead className="text-center">Receiving Now</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivingItems.map((item, index) => {
                    const remaining = item.ordered_qty - item.received_qty;
                    const isComplete = remaining === 0;
                    return (
                      <TableRow key={item.item_id} className={isComplete ? 'opacity-50' : ''}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{item.product_name}</span>
                            {item.barcode && (
                              <span className="block text-xs text-muted-foreground font-mono">{item.barcode}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.ordered_qty}</TableCell>
                        <TableCell className="text-center">
                          {item.received_qty > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {item.received_qty}
                            </Badge>
                          )}
                          {item.received_qty === 0 && '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            value={item.receiving_now}
                            onChange={(e) => updateReceivingQty(index, parseInt(e.target.value) || 0)}
                            className="w-20 text-center mx-auto"
                            disabled={isComplete}
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={item.location} 
                            onValueChange={(v) => updateItemField(index, 'location', v)}
                            disabled={isComplete}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                              <SelectItem value="Store Front">Store Front</SelectItem>
                              <SelectItem value="Back Room">Back Room</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={item.condition} 
                            onValueChange={(v) => updateItemField(index, 'condition', v)}
                            disabled={isComplete}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="used">Used</SelectItem>
                              <SelectItem value="refurbished">Refurbished</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.receiving_now * item.unit_cost)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <div>
                  <span className="text-muted-foreground">Total Value Being Received:</span>
                  <span className="text-2xl font-bold ml-2">{formatCurrency(totalReceiving)}</span>
                </div>
                <Button size="lg" onClick={processReceiving} disabled={loading || totalReceiving === 0}>
                  <Check className="h-5 w-5 mr-2" />
                  {loading ? 'Processing...' : 'Confirm Receipt'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
};

export default StockReceiving;
