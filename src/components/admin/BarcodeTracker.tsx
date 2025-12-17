import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/currency';
import { 
  Barcode, Search, Plus, History, Package, MapPin, 
  Calendar, Edit, Trash2, Truck, ArrowRightLeft, ScanLine, Camera
} from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';
import { format } from 'date-fns';

interface SerialUnit {
  id: string;
  product_id: string;
  serial_number: string;
  status: string;
  condition: string | null;
  location: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  supplier_id: string | null;
  sold_date: string | null;
  sale_id: string | null;
  customer_id: string | null;
  notes: string | null;
  created_at: string;
  products?: { name: string; sku: string | null };
  suppliers?: { name: string };
}

interface SerialUnitHistory {
  id: string;
  serial_unit_id: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  previous_location: string | null;
  new_location: string | null;
  notes: string | null;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
}

interface Supplier {
  id: string;
  name: string;
}

const STATUS_OPTIONS = ['in_stock', 'sold', 'reserved', 'in_repair', 'returned', 'damaged', 'lost'];
const CONDITION_OPTIONS = ['new', 'refurbished', 'open_box', 'used_like_new', 'used_good', 'damaged'];

interface StorageLocation {
  id: string;
  name: string;
  is_active: boolean;
}

const BarcodeTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [serialUnits, setSerialUnits] = useState<SerialUnit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<SerialUnit | null>(null);
  const [history, setHistory] = useState<SerialUnitHistory[]>([]);
  const [transferLocation, setTransferLocation] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    barcode: '',
    status: 'in_stock',
    condition: 'new',
    location: '',
    purchase_date: '',
    purchase_cost: '',
    supplier_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchSerialUnits();
    fetchProducts();
    fetchSuppliers();
    fetchLocations();
    cleanupOldSoldUnits();
  }, []);

  const fetchLocations = async () => {
    const { data } = await supabase
      .from('storage_locations')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (data) setLocations(data);
  };

  const fetchSerialUnits = async () => {
    const { data, error } = await supabase
      .from('serial_units')
      .select('*, products(name, sku), suppliers(name)')
      .order('created_at', { ascending: false });

    if (!error) setSerialUnits(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, barcode')
      .order('name');

    if (!error) setProducts(data || []);
  };

  // Lookup product by scanned barcode
  const handleBarcodeScan = async (code: string) => {
    // Find product by barcode
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, sku, barcode')
      .eq('barcode', code)
      .single();

    if (error || !product) {
      toast({ 
        title: 'Product Not Found', 
        description: `No product found with barcode: ${code}. You may need to add the barcode to the product first.`, 
        variant: 'destructive' 
      });
      return;
    }

    // Open quick add dialog with scanned product
    setScannedProduct(product);
    setQuantity(1);
    setQuickAddOpen(true);
    toast({ title: 'Product Found', description: `${product.name} - Ready to register stock` });
  };

  // Quick add multiple units of scanned product
  const handleQuickAddStock = async () => {
    if (!scannedProduct || quantity < 1) return;

    setLoading(true);
    try {
      const unitsToCreate = [];
      for (let i = 0; i < quantity; i++) {
        unitsToCreate.push({
          product_id: scannedProduct.id,
          serial_number: scannedProduct.barcode || `${scannedProduct.sku || 'UNIT'}-${Date.now()}-${i}`,
          status: formData.status,
          condition: formData.condition || 'new',
          location: formData.location || null,
          purchase_date: formData.purchase_date || null,
          purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
          supplier_id: formData.supplier_id || null,
          notes: `Quick added via barcode scan (${quantity} units)`
        });
      }

      const { data, error } = await supabase
        .from('serial_units')
        .insert(unitsToCreate)
        .select();

      if (error) throw error;

      // Log history for each unit
      if (data) {
        const historyEntries = data.map(unit => ({
          serial_unit_id: unit.id,
          action: 'created',
          new_status: formData.status,
          new_location: formData.location || null,
          notes: `Stock registered via barcode scan`,
          performed_by: user?.id
        }));
        await supabase.from('serial_unit_history').insert(historyEntries);
      }

      toast({ 
        title: 'Stock Registered', 
        description: `${quantity} unit(s) of ${scannedProduct.name} added to inventory` 
      });

      setQuickAddOpen(false);
      setScannedProduct(null);
      setQuantity(1);
      resetForm();
      fetchSerialUnits();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (!error) setSuppliers(data || []);
  };

  // Auto-delete sold units older than 4 days
  const cleanupOldSoldUnits = async () => {
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    const cutoffDate = fourDaysAgo.toISOString().split('T')[0];

    const { error } = await supabase
      .from('serial_units')
      .delete()
      .eq('status', 'sold')
      .lt('sold_date', cutoffDate);

    if (error) {
      console.error('Error cleaning up old sold units:', error);
    }
  };

  const fetchHistory = async (unitId: string) => {
    const { data, error } = await supabase
      .from('serial_unit_history')
      .select('*')
      .eq('serial_unit_id', unitId)
      .order('created_at', { ascending: false });

    if (!error) setHistory(data || []);
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      barcode: '',
      status: 'in_stock',
      condition: 'new',
      location: '',
      purchase_date: '',
      purchase_cost: '',
      supplier_id: '',
      notes: ''
    });
    setSelectedUnit(null);
  };

  const handleSubmit = async () => {
    if (!formData.product_id || !formData.barcode) {
      toast({ title: 'Error', description: 'Product and barcode are required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const unitData = {
        product_id: formData.product_id,
        serial_number: formData.barcode,
        status: formData.status,
        condition: formData.condition || null,
        location: formData.location || null,
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        supplier_id: formData.supplier_id || null,
        notes: formData.notes || null
      };

      if (selectedUnit) {
        // Update existing
        const { error } = await supabase
          .from('serial_units')
          .update(unitData)
          .eq('id', selectedUnit.id);

        if (error) throw error;

        // Log history if status or location changed
        if (selectedUnit.status !== formData.status || selectedUnit.location !== formData.location) {
          await supabase.from('serial_unit_history').insert({
            serial_unit_id: selectedUnit.id,
            action: 'updated',
            previous_status: selectedUnit.status,
            new_status: formData.status,
            previous_location: selectedUnit.location,
            new_location: formData.location || null,
            notes: formData.notes,
            performed_by: user?.id
          });
        }

        toast({ title: 'Success', description: 'Stock unit updated' });
      } else {
        // Create new
        const { data, error } = await supabase
          .from('serial_units')
          .insert(unitData)
          .select()
          .single();

        if (error) throw error;

        // Log creation
        await supabase.from('serial_unit_history').insert({
          serial_unit_id: data.id,
          action: 'created',
          new_status: formData.status,
          new_location: formData.location || null,
          notes: 'Unit registered',
          performed_by: user?.id
        });

        toast({ title: 'Success', description: 'Stock unit registered' });
      }

      setDialogOpen(false);
      resetForm();
      fetchSerialUnits();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (unit: SerialUnit) => {
    setSelectedUnit(unit);
    setFormData({
      product_id: unit.product_id,
      barcode: unit.serial_number,
      status: unit.status,
      condition: unit.condition || 'new',
      location: unit.location || '',
      purchase_date: unit.purchase_date || '',
      purchase_cost: unit.purchase_cost?.toString() || '',
      supplier_id: unit.supplier_id || '',
      notes: unit.notes || ''
    });
    setDialogOpen(true);
  };

  const handleViewHistory = async (unit: SerialUnit) => {
    setSelectedUnit(unit);
    await fetchHistory(unit.id);
    setHistoryDialogOpen(true);
  };

  const handleOpenTransfer = (unit: SerialUnit) => {
    setSelectedUnit(unit);
    setTransferLocation(unit.location || '');
    setTransferDialogOpen(true);
  };

  const handleQuickTransfer = async () => {
    if (!selectedUnit || !transferLocation) {
      toast({ title: 'Error', description: 'Please select a location', variant: 'destructive' });
      return;
    }

    if (transferLocation === selectedUnit.location) {
      toast({ title: 'Info', description: 'Unit is already at this location' });
      setTransferDialogOpen(false);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('serial_units')
        .update({ location: transferLocation })
        .eq('id', selectedUnit.id);

      if (error) throw error;

      // Log the transfer in history
      await supabase.from('serial_unit_history').insert({
        serial_unit_id: selectedUnit.id,
        action: 'transferred',
        previous_location: selectedUnit.location,
        new_location: transferLocation,
        previous_status: selectedUnit.status,
        new_status: selectedUnit.status,
        notes: `Transferred from ${selectedUnit.location || 'unassigned'} to ${transferLocation}`,
        performed_by: user?.id
      });

      // Auto-show product when transferred to Store/Shop location
      const isStoreLocation = transferLocation.toLowerCase().includes('store') || 
                              transferLocation.toLowerCase().includes('shop');
      if (isStoreLocation) {
        await supabase
          .from('products')
          .update({ is_active: true })
          .eq('id', selectedUnit.product_id);
        
        toast({ 
          title: 'Success', 
          description: `Unit transferred to ${transferLocation}. Product is now visible to customers.` 
        });
      } else {
        toast({ title: 'Success', description: `Unit transferred to ${transferLocation}` });
      }
      
      setTransferDialogOpen(false);
      setTransferLocation('');
      setSelectedUnit(null);
      fetchSerialUnits();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock unit?')) return;

    const { error } = await supabase.from('serial_units').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Stock unit deleted' });
      fetchSerialUnits();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      in_stock: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      sold: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      reserved: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      in_repair: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      returned: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      damaged: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      lost: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return <Badge className={variants[status] || variants.in_stock}>{status.replace('_', ' ')}</Badge>;
  };


  const filteredUnits = serialUnits.filter(unit => {
    const matchesSearch = 
      unit.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.products?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || unit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: serialUnits.length,
    inStock: serialUnits.filter(u => u.status === 'in_stock').length,
    sold: serialUnits.filter(u => u.status === 'sold').length,
    inRepair: serialUnits.filter(u => u.status === 'in_repair').length,
    totalValue: serialUnits.reduce((sum, u) => sum + (u.purchase_cost || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Barcode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Units</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Stock</p>
                <p className="text-xl font-bold text-green-600">{stats.inStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sold</p>
                <p className="text-xl font-bold text-blue-600">{stats.sold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Repair</p>
                <p className="text-xl font-bold text-orange-600">{stats.inRepair}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Package className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              Barcode Tracking
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search barcode, product, SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full md:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setScannerOpen(true)}>
                <ScanLine className="h-4 w-4 mr-2" />Scan
              </Button>
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Add Unit</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedUnit ? 'Edit' : 'Register'} Stock Unit</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Product *</Label>
                      <Select value={formData.product_id} onValueChange={(v) => setFormData({...formData, product_id: v})}>
                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {products.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} {p.sku && `(${p.sku})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Barcode *</Label>
                      <Input
                        value={formData.barcode}
                        onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                        placeholder="Enter or scan barcode"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Status</Label>
                        <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Condition</Label>
                        <Select value={formData.condition} onValueChange={(v) => setFormData({...formData, condition: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONDITION_OPTIONS.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Location</Label>
                      <Select value={formData.location} onValueChange={(v) => setFormData({...formData, location: v})}>
                        <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                        <SelectContent>
                          {locations.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Purchase Date</Label>
                        <Input
                          type="date"
                          value={formData.purchase_date}
                          onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Purchase Cost (UGX)</Label>
                        <Input
                          type="number"
                          value={formData.purchase_cost}
                          onChange={(e) => setFormData({...formData, purchase_cost: e.target.value})}
                          placeholder="Cost"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Supplier</Label>
                      <Select value={formData.supplier_id} onValueChange={(v) => setFormData({...formData, supplier_id: v})}>
                        <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                        <SelectContent>
                          {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="Additional notes..."
                      />
                    </div>

                    <Button onClick={handleSubmit} disabled={loading} className="w-full">
                      {loading ? 'Saving...' : selectedUnit ? 'Update Unit' : 'Register Unit'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No stock units found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUnits.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-mono font-medium">{unit.serial_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{unit.products?.name}</p>
                          {unit.products?.sku && <p className="text-xs text-muted-foreground">{unit.products.sku}</p>}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(unit.status)}</TableCell>
                      <TableCell>
                        {unit.location ? (
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />{unit.location}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{unit.suppliers?.name || '-'}</TableCell>
                      <TableCell>{unit.purchase_cost ? formatCurrency(unit.purchase_cost) : '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(unit.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenTransfer(unit)} title="Quick Transfer">
                            <ArrowRightLeft className="h-4 w-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleViewHistory(unit)}>
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(unit)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(unit.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={(open) => { setTransferDialogOpen(open); if (!open) { setTransferLocation(''); setSelectedUnit(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Quick Transfer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{selectedUnit?.products?.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{selectedUnit?.serial_number}</p>
              {selectedUnit?.location && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current: <span className="font-medium">{selectedUnit.location}</span>
                </p>
              )}
            </div>
            
            <div>
              <Label>Transfer To</Label>
              <Select value={transferLocation} onValueChange={setTransferLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.name} disabled={loc.name === selectedUnit?.location}>
                      {loc.name} {loc.name === selectedUnit?.location && '(current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleQuickTransfer} disabled={loading || !transferLocation} className="w-full">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              {loading ? 'Transferring...' : 'Transfer Unit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              History: {selectedUnit?.serial_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No history records</p>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="capitalize">{h.action}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(h.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    {(h.previous_status || h.new_status) && (
                      <p className="text-sm">
                        Status: <span className="text-muted-foreground">{h.previous_status || 'none'}</span>
                        {' → '}
                        <span className="font-medium">{h.new_status}</span>
                      </p>
                    )}
                    {(h.previous_location || h.new_location) && (
                      <p className="text-sm">
                        Location: <span className="text-muted-foreground">{h.previous_location || 'none'}</span>
                        {' → '}
                        <span className="font-medium">{h.new_location || 'none'}</span>
                      </p>
                    )}
                    {h.notes && <p className="text-sm text-muted-foreground">{h.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Dialog */}
      <BarcodeScanner 
        open={scannerOpen} 
        onClose={() => setScannerOpen(false)} 
        onScan={handleBarcodeScan}
      />

      {/* Quick Add Stock Dialog */}
      <Dialog open={quickAddOpen} onOpenChange={(open) => { setQuickAddOpen(open); if (!open) { setScannedProduct(null); setQuantity(1); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Quick Stock Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {scannedProduct && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="font-semibold text-lg">{scannedProduct.name}</p>
                <p className="text-sm text-muted-foreground">
                  Barcode: <span className="font-mono">{scannedProduct.barcode}</span>
                </p>
                {scannedProduct.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {scannedProduct.sku}</p>
                )}
              </div>
            )}

            <div>
              <Label>Quantity to Add</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center text-xl font-bold w-24"
                  min={1}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={formData.condition} onValueChange={(v) => setFormData({...formData, condition: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPTIONS.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <Select value={formData.location} onValueChange={(v) => setFormData({...formData, location: v})}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Supplier</Label>
              <Select value={formData.supplier_id} onValueChange={(v) => setFormData({...formData, supplier_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Unit Cost (UGX)</Label>
                <Input
                  type="number"
                  value={formData.purchase_cost}
                  onChange={(e) => setFormData({...formData, purchase_cost: e.target.value})}
                  placeholder="Cost per unit"
                />
              </div>
            </div>

            <Button onClick={handleQuickAddStock} disabled={loading} className="w-full" size="lg">
              <Package className="h-4 w-4 mr-2" />
              {loading ? 'Adding...' : `Add ${quantity} Unit${quantity > 1 ? 's' : ''} to Stock`}
            </Button>

            <Button variant="outline" onClick={() => setScannerOpen(true)} className="w-full">
              <ScanLine className="h-4 w-4 mr-2" />
              Scan Another Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BarcodeTracker;
