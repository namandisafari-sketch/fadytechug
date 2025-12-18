import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Plus, Package, Edit, Trash2, Search, Upload, X, Image, Barcode, Building2, MapPin, Scale, Zap, Check, Loader2 } from 'lucide-react';
import QuickBooksImport from '@/components/admin/QuickBooksImport';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/currency';
import { compressImage, formatFileSize } from '@/lib/imageCompression';


const CATEGORIES = ['Routers', 'Switches', 'Cables', 'Servers', 'Accessories', 'Networking', 'Other'];
const CONDITIONS = ['new', 'refurbished', 'open_box', 'used_like_new', 'used_good', 'damaged'];
const MAX_FILE_SIZE = 200 * 1024; // 200KB

interface Supplier {
  id: string;
  name: string;
}

interface StorageLocation {
  id: string;
  name: string;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  image_url: string | null;
  barcode: string | null;
  model: string | null;
  manufacturer: string | null;
  sku: string | null;
  reorder_level: number | null;
  reorder_quantity: number | null;
  location: string | null;
  condition: string | null;
  warranty_months: number | null;
  unit_cost: number | null;
  supplier_id: string | null;
  created_at: string;
}

const Products = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickNameRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Quick Add state
  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickStock, setQuickStock] = useState('1');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState(false);

  // Multi-location stock distribution
  const [locationStocks, setLocationStocks] = useState<Record<string, number>>({});
  const [quickLocationStocks, setQuickLocationStocks] = useState<Record<string, number>>({});

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [model, setModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [sku, setSku] = useState('');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [reorderQuantity, setReorderQuantity] = useState('10');
  const [location, setLocation] = useState('');
  const [condition, setCondition] = useState('new');
  const [warrantyMonths, setWarrantyMonths] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    const { data } = await supabase
      .from('storage_locations')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (data) setLocations(data);
  };

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (!error) setSuppliers(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (!error) setProducts(data || []);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setCategory('');
    setPrice('');
    setStockQuantity('');
    setIsActive(true);
    setIsFeatured(false);
    setBarcode('');
    setModel('');
    setManufacturer('');
    setSku('');
    setReorderLevel('5');
    setReorderQuantity('10');
    setLocation('');
    setCondition('new');
    setWarrantyMonths('');
    setUnitCost('');
    setSupplierId('');
    setImageUrl(null);
    setImageFile(null);
    setImagePreview(null);
    setLocationStocks({});
  };

  const resetQuickForm = () => {
    setQuickName('');
    setQuickCategory('');
    setQuickPrice('');
    setQuickStock('1');
    setQuickLocationStocks({});
  };

  const updateLocationStock = (locationName: string, qty: number) => {
    setLocationStocks(prev => {
      if (qty <= 0) {
        const { [locationName]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [locationName]: qty };
    });
  };

  const updateQuickLocationStock = (locationName: string, qty: number) => {
    setQuickLocationStocks(prev => {
      if (qty <= 0) {
        const { [locationName]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [locationName]: qty };
    });
  };

  const getTotalLocationStock = () => Object.values(locationStocks).reduce((sum, qty) => sum + qty, 0);
  const getTotalQuickLocationStock = () => Object.values(quickLocationStocks).reduce((sum, qty) => sum + qty, 0);

  const handleQuickAdd = async () => {
    if (!quickName.trim()) {
      toast({ title: 'Error', description: 'Product name is required', variant: 'destructive' });
      quickNameRef.current?.focus();
      return;
    }
    if (!quickCategory) {
      toast({ title: 'Error', description: 'Please select a category', variant: 'destructive' });
      return;
    }
    if (!quickPrice || parseFloat(quickPrice) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid price', variant: 'destructive' });
      return;
    }

    const hasLocationDistribution = Object.keys(quickLocationStocks).length > 0;
    const totalStock = hasLocationDistribution ? getTotalQuickLocationStock() : (parseInt(quickStock) || 1);

    setQuickLoading(true);

    try {
      const { data: productData, error } = await supabase.from('products').insert({
        name: quickName.trim(),
        category: quickCategory,
        price: parseFloat(quickPrice),
        stock_quantity: totalStock,
        is_active: true,
        condition: 'new',
        created_by: user?.id
      }).select().single();

      if (error) throw error;

      // Create inventory transactions for each location if distributed
      if (hasLocationDistribution && productData) {
        const transactions = Object.entries(quickLocationStocks).map(([loc, qty]) => ({
          product_id: productData.id,
          transaction_type: 'purchase' as const,
          quantity: qty,
          previous_stock: 0,
          new_stock: qty,
          notes: `Initial stock at ${loc}`,
          created_by: user?.id
        }));

        await supabase.from('inventory_transactions').insert(transactions);

        // Create stock transfer records for tracking location
        for (const [loc, qty] of Object.entries(quickLocationStocks)) {
          await supabase.from('stock_transfers').insert({
            product_id: productData.id,
            from_location: 'Supplier',
            to_location: loc,
            quantity: qty,
            notes: 'Initial stock distribution',
            transferred_by: user?.id
          });
        }
      }

      // Show success animation
      setQuickSuccess(true);
      setTimeout(() => setQuickSuccess(false), 1500);

      toast({ title: 'Product Added!', description: `${quickName} has been added to inventory` });
      
      resetQuickForm();
      fetchProducts();
      quickNameRef.current?.focus();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setQuickLoading(false);
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setCategory(product.category);
    setPrice(product.price.toString());
    setStockQuantity(product.stock_quantity.toString());
    setIsActive(product.is_active);
    setIsFeatured(product.is_featured);
    setBarcode(product.barcode || '');
    setModel(product.model || '');
    setManufacturer(product.manufacturer || '');
    setSku(product.sku || '');
    setReorderLevel((product.reorder_level ?? 5).toString());
    setReorderQuantity((product.reorder_quantity ?? 10).toString());
    setLocation(product.location || '');
    setCondition(product.condition || 'new');
    setWarrantyMonths(product.warranty_months?.toString() || '');
    setUnitCost(product.unit_cost?.toString() || '');
    setSupplierId(product.supplier_id || '');
    setImageUrl(product.image_url);
    setImagePreview(product.image_url);
    setImageFile(null);
    setDialogOpen(true);
  };


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ 
        title: 'Invalid file type', 
        description: 'Please upload an image file', 
        variant: 'destructive' 
      });
      return;
    }

    // Check if compression is needed
    if (file.size > MAX_FILE_SIZE) {
      setUploading(true);
      toast({ 
        title: 'Compressing image...', 
        description: `Original size: ${formatFileSize(file.size)}` 
      });

      try {
        const result = await compressImage(file);
        
        if (result.wasCompressed) {
          toast({ 
            title: 'Image compressed', 
            description: `Reduced from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.compressedSize)}` 
          });
        }

        setImageFile(result.file);
        setImagePreview(URL.createObjectURL(result.file));
      } catch (error: any) {
        toast({ 
          title: 'Compression failed', 
          description: error.message, 
          variant: 'destructive' 
        });
      } finally {
        setUploading(false);
      }
    } else {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({ 
        title: 'Upload failed', 
        description: error.message, 
        variant: 'destructive' 
      });
      return imageUrl;
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveProduct = async () => {
    if (!name || !category || !price) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    const hasLocationDistribution = Object.keys(locationStocks).length > 0;
    const totalStock = hasLocationDistribution ? getTotalLocationStock() : (parseInt(stockQuantity) || 0);

    setLoading(true);

    try {
      const uploadedImageUrl = await uploadImage();

      const productData = {
        name,
        description: description || null,
        category,
        price: parseFloat(price),
        stock_quantity: totalStock,
        is_active: isActive,
        is_featured: isFeatured,
        barcode: barcode.trim() || null,
        model: model.trim() || null,
        manufacturer: manufacturer.trim() || null,
        sku: sku.trim() || null,
        reorder_level: parseInt(reorderLevel) || 5,
        reorder_quantity: parseInt(reorderQuantity) || 10,
        location: location || null,
        condition: condition || 'new',
        warranty_months: warrantyMonths ? parseInt(warrantyMonths) : null,
        unit_cost: unitCost ? parseFloat(unitCost) : null,
        supplier_id: supplierId || null,
        image_url: uploadedImageUrl,
        created_by: user?.id
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        const { data: newProduct, error } = await supabase.from('products').insert(productData).select().single();
        if (error) throw error;

        // Create inventory transactions and stock transfers for each location if distributed
        if (hasLocationDistribution && newProduct) {
          const transactions = Object.entries(locationStocks).map(([loc, qty]) => ({
            product_id: newProduct.id,
            transaction_type: 'purchase' as const,
            quantity: qty,
            previous_stock: 0,
            new_stock: qty,
            notes: `Initial stock at ${loc}`,
            unit_cost: unitCost ? parseFloat(unitCost) : null,
            created_by: user?.id
          }));

          await supabase.from('inventory_transactions').insert(transactions);

          // Create stock transfer records for tracking location
          for (const [loc, qty] of Object.entries(locationStocks)) {
            await supabase.from('stock_transfers').insert({
              product_id: newProduct.id,
              from_location: 'Supplier',
              to_location: loc,
              quantity: qty,
              notes: 'Initial stock distribution',
              transferred_by: user?.id
            });
          }
        }

        toast({ title: 'Success', description: 'Product added' });
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Product deleted' });
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <QuickBooksImport onImportComplete={fetchProducts} suppliers={suppliers} />
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Full Details</Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            
            <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-2">
              {/* Row 1: Image + Name/Category */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  {imagePreview ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={removeImage}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div onClick={() => !uploading && fileInputRef.current?.click()} className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
                      {uploading ? (
                        <>
                          <Loader2 className="h-6 w-6 text-muted-foreground mb-1 animate-spin" />
                          <p className="text-xs text-muted-foreground">Compressing...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground">Add Image</p>
                          <p className="text-[10px] text-muted-foreground">Auto-compress if &gt;200KB</p>
                        </>
                      )}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={uploading} />
                </div>
                <div className="col-span-2 space-y-3">
                  <div>
                    <Label className="text-base font-bold">Product Name *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-base" placeholder="e.g., TP-Link Router" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Category *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Manufacturer</Label>
                      <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Cisco, TP-Link..." className="h-10" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Price & Stock - Most Important */}
              <div className="grid grid-cols-4 gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div>
                  <Label className="text-base font-bold">Price (UGX) *</Label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-11 text-lg font-semibold" placeholder="150000" />
                </div>
                <div>
                  <Label>Cost (UGX)</Label>
                  <Input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="h-11" placeholder="120000" />
                </div>
                <div>
                  <Label className="text-base font-bold">Total Stock</Label>
                  <Input 
                    type="number" 
                    value={Object.keys(locationStocks).length > 0 ? getTotalLocationStock() : stockQuantity} 
                    onChange={(e) => {
                      if (Object.keys(locationStocks).length === 0) {
                        setStockQuantity(e.target.value);
                      }
                    }}
                    disabled={Object.keys(locationStocks).length > 0}
                    className="h-11 text-lg font-semibold" 
                    placeholder="10" 
                  />
                </div>
                <div>
                  <Label>Condition</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location Distribution - Distribute Stock */}
              {!editingProduct && locations.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <Label className="text-sm font-bold flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4" />
                    Distribute Stock by Location
                    {Object.keys(locationStocks).length > 0 && (
                      <Badge variant="secondary" className="ml-2">Total: {getTotalLocationStock()}</Badge>
                    )}
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {locations.map(loc => (
                      <div key={loc.id} className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={locationStocks[loc.name] || ''}
                          onChange={(e) => updateLocationStock(loc.name, parseInt(e.target.value) || 0)}
                          className="h-9 w-20"
                        />
                        <span className="text-sm truncate">{loc.name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter quantities per location to distribute stock. Leave empty to use total stock without distribution.
                  </p>
                </div>
              )}

              {/* Row 3: Identifiers */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Model</Label>
                  <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="TL-WR840N" />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-001" />
                </div>
                <div>
                  <Label>Barcode</Label>
                  <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan or type" />
                </div>
                <div>
                  <Label>Location</Label>
                  <Select value={location || "none"} onValueChange={(val) => setLocation(val === "none" ? "" : val)}>
                    <SelectTrigger><SelectValue placeholder="Where?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      {locations.map(loc => <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Supplier & Reorder */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="font-bold">Supplier *</Label>
                  <Select value={supplierId || "none"} onValueChange={(val) => setSupplierId(val === "none" ? "" : val)}>
                    <SelectTrigger><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not assigned</SelectItem>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reorder Level</Label>
                  <Input type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} placeholder="5" />
                </div>
                <div>
                  <Label>Reorder Qty</Label>
                  <Input type="number" value={reorderQuantity} onChange={(e) => setReorderQuantity(e.target.value)} placeholder="10" />
                </div>
                <div>
                  <Label>Warranty (Months)</Label>
                  <Input type="number" value={warrantyMonths} onChange={(e) => setWarrantyMonths(e.target.value)} placeholder="12" />
                </div>
              </div>

              {/* Row 5: Description & Toggles */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Product description..." className="h-20" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <Label className="text-sm">Active</Label>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <Label className="text-sm">Featured</Label>
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                  </div>
                </div>
              </div>
            </div>
            
            <Button onClick={saveProduct} disabled={loading || uploading} className="w-full h-12 text-lg font-bold mt-4">
              {uploading ? 'Uploading...' : loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* QUICK ADD PRODUCT - Simple and Fast */}
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-6 w-6 text-primary" />
            Quick Add Product
          </CardTitle>
          <CardDescription className="text-base">
            Add new products fast! Just fill in the basics and click Add.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 items-end transition-all ${quickSuccess ? 'opacity-50' : ''}`}>
            {/* Product Name */}
            <div className="md:col-span-2">
              <Label className="text-base font-bold">Product Name *</Label>
              <Input
                ref={quickNameRef}
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="e.g., TP-Link Router TL-WR840N"
                className="h-12 text-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-base font-bold">Category *</Label>
              <Select value={quickCategory} onValueChange={setQuickCategory}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-base">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div>
              <Label className="text-base font-bold">Price (UGX) *</Label>
              <Input
                type="number"
                value={quickPrice}
                onChange={(e) => setQuickPrice(e.target.value)}
                placeholder="150000"
                className="h-12 text-lg"
                min="0"
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              />
            </div>

            {/* Stock & Add Button */}
            <div className="flex gap-2">
              <div className="w-20">
                <Label className="text-base font-bold">Stock</Label>
                <Input
                  type="number"
                  value={Object.keys(quickLocationStocks).length > 0 ? getTotalQuickLocationStock() : quickStock}
                  onChange={(e) => {
                    if (Object.keys(quickLocationStocks).length === 0) {
                      setQuickStock(e.target.value);
                    }
                  }}
                  disabled={Object.keys(quickLocationStocks).length > 0}
                  className="h-12 text-lg text-center"
                  min="0"
                />
              </div>
              <div className="flex-1">
                <Label className="text-base invisible">Add</Label>
                <Button
                  onClick={handleQuickAdd}
                  disabled={quickLoading}
                  className={`h-12 w-full text-lg font-bold ${quickSuccess ? 'bg-green-600' : ''}`}
                >
                  {quickSuccess ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Added!
                    </>
                  ) : quickLoading ? (
                    'Adding...'
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Add Location Distribution */}
          {locations.length > 0 && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
              <Label className="text-sm font-bold flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                Distribute Stock by Location (Optional)
                {Object.keys(quickLocationStocks).length > 0 && (
                  <Badge variant="secondary">Total: {getTotalQuickLocationStock()}</Badge>
                )}
              </Label>
              <div className="flex flex-wrap gap-3">
                {locations.map(loc => (
                  <div key={loc.id} className="flex items-center gap-2 bg-background p-2 rounded border">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={quickLocationStocks[loc.name] || ''}
                      onChange={(e) => updateQuickLocationStock(loc.name, parseInt(e.target.value) || 0)}
                      className="h-8 w-16 text-center"
                    />
                    <span className="text-sm">{loc.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-3">
            Need to add more details? Use the "Full Details" button above to add images, barcodes, manufacturer info, and more.
          </p>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Products ({products.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {product.barcode ? (
                      <Badge variant="outline" className="gap-1 font-mono text-xs">
                        <Barcode className="h-3 w-3" />
                        {product.barcode}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                  <TableCell className="text-right">{product.stock_quantity}</TableCell>
                  <TableCell><Badge variant={product.is_active ? 'default' : 'secondary'}>{product.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(product)}><Edit className="h-4 w-4" /></Button>
                    {isAdmin && <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No products found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
