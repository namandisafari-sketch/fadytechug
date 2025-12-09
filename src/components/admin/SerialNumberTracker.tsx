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
  Hash, Search, Plus, History, Package, MapPin, 
  Calendar, Shield, Edit, Trash2, Eye 
} from 'lucide-react';
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
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  sold_date: string | null;
  sale_id: string | null;
  customer_id: string | null;
  notes: string | null;
  created_at: string;
  products?: { name: string; sku: string | null };
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
}

const STATUS_OPTIONS = ['in_stock', 'sold', 'reserved', 'in_repair', 'returned', 'damaged', 'lost'];
const CONDITION_OPTIONS = ['new', 'refurbished', 'open_box', 'used_like_new', 'used_good', 'damaged'];
const LOCATION_OPTIONS = ['Warehouse A', 'Warehouse B', 'Store Front', 'Service Center', 'Returns'];

const SerialNumberTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [serialUnits, setSerialUnits] = useState<SerialUnit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<SerialUnit | null>(null);
  const [history, setHistory] = useState<SerialUnitHistory[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    serial_number: '',
    status: 'in_stock',
    condition: 'new',
    location: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_start_date: '',
    warranty_end_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchSerialUnits();
    fetchProducts();
  }, []);

  const fetchSerialUnits = async () => {
    const { data, error } = await supabase
      .from('serial_units')
      .select('*, products(name, sku)')
      .order('created_at', { ascending: false });

    if (!error) setSerialUnits(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku')
      .order('name');

    if (!error) setProducts(data || []);
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
      serial_number: '',
      status: 'in_stock',
      condition: 'new',
      location: '',
      purchase_date: '',
      purchase_cost: '',
      warranty_start_date: '',
      warranty_end_date: '',
      notes: ''
    });
    setSelectedUnit(null);
  };

  const handleSubmit = async () => {
    if (!formData.product_id || !formData.serial_number) {
      toast({ title: 'Error', description: 'Product and serial number are required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const unitData = {
        product_id: formData.product_id,
        serial_number: formData.serial_number,
        status: formData.status,
        condition: formData.condition || null,
        location: formData.location || null,
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        warranty_start_date: formData.warranty_start_date || null,
        warranty_end_date: formData.warranty_end_date || null,
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

        toast({ title: 'Success', description: 'Serial unit updated' });
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

        toast({ title: 'Success', description: 'Serial unit registered' });
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
      serial_number: unit.serial_number,
      status: unit.status,
      condition: unit.condition || 'new',
      location: unit.location || '',
      purchase_date: unit.purchase_date || '',
      purchase_cost: unit.purchase_cost?.toString() || '',
      warranty_start_date: unit.warranty_start_date || '',
      warranty_end_date: unit.warranty_end_date || '',
      notes: unit.notes || ''
    });
    setDialogOpen(true);
  };

  const handleViewHistory = async (unit: SerialUnit) => {
    setSelectedUnit(unit);
    await fetchHistory(unit.id);
    setHistoryDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this serial unit?')) return;

    const { error } = await supabase.from('serial_units').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Serial unit deleted' });
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

  const getWarrantyStatus = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return <Badge variant="destructive">Expired</Badge>;
    if (daysLeft < 30) return <Badge className="bg-orange-100 text-orange-800">{daysLeft}d left</Badge>;
    return <Badge className="bg-green-100 text-green-800">{Math.floor(daysLeft / 30)}mo left</Badge>;
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
    warrantyExpiring: serialUnits.filter(u => {
      if (!u.warranty_end_date) return false;
      const daysLeft = Math.ceil((new Date(u.warranty_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 && daysLeft < 30;
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
        <Card className={stats.warrantyExpiring > 0 ? 'border-yellow-500' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Warranty Expiring</p>
                <p className="text-xl font-bold text-yellow-600">{stats.warrantyExpiring}</p>
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
              <Hash className="h-5 w-5" />
              Serial Number Tracking
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search serial, product, SKU..."
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
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Add Unit</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedUnit ? 'Edit' : 'Register'} Serial Unit</DialogTitle>
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
                      <Label>Serial Number *</Label>
                      <Input
                        value={formData.serial_number}
                        onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                        placeholder="Enter serial number"
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
                          {LOCATION_OPTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Warranty Start</Label>
                        <Input
                          type="date"
                          value={formData.warranty_start_date}
                          onChange={(e) => setFormData({...formData, warranty_start_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Warranty End</Label>
                        <Input
                          type="date"
                          value={formData.warranty_end_date}
                          onChange={(e) => setFormData({...formData, warranty_end_date: e.target.value})}
                        />
                      </div>
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
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Warranty</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No serial units found
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
                      <TableCell>{getWarrantyStatus(unit.warranty_end_date)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(unit.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
    </div>
  );
};

export default SerialNumberTracker;
