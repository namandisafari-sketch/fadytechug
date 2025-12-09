import { useState, useEffect, useRef } from 'react';
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
import { Plus, Package, Edit, Trash2, Search, Upload, X, Image, Barcode, Building2, MapPin, Scale } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/currency';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CATEGORIES = ['Routers', 'Switches', 'Cables', 'Servers', 'Accessories', 'Networking', 'Other'];
const LOCATIONS = ['Warehouse A', 'Warehouse B', 'Store Front', 'Service Center', 'Returns'];
const CONDITIONS = ['new', 'refurbished', 'open_box', 'used_like_new', 'used_good', 'damaged'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

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
  weight_kg: number | null;
  dimensions: string | null;
  created_at: string;
}

const Products = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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
  const [weightKg, setWeightKg] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

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
    setWeightKg('');
    setDimensions('');
    setImageUrl(null);
    setImageFile(null);
    setImagePreview(null);
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
    setWeightKg(product.weight_kg?.toString() || '');
    setDimensions(product.dimensions || '');
    setImageUrl(product.image_url);
    setImagePreview(product.image_url);
    setImageFile(null);
    setDialogOpen(true);
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        title: 'File too large', 
        description: 'Maximum file size is 2MB', 
        variant: 'destructive' 
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ 
        title: 'Invalid file type', 
        description: 'Please upload an image file', 
        variant: 'destructive' 
      });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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

    setLoading(true);

    try {
      const uploadedImageUrl = await uploadImage();

      const productData = {
        name,
        description: description || null,
        category,
        price: parseFloat(price),
        stock_quantity: parseInt(stockQuantity) || 0,
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
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        dimensions: dimensions.trim() || null,
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
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
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
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              
              <div className="max-h-[60vh] overflow-y-auto mt-4">
                <TabsContent value="basic" className="space-y-4 mt-0">
                  {/* Image Upload */}
                  <div>
                    <Label>Product Image (Max 2MB)</Label>
                    <div className="mt-2">
                      {imagePreview ? (
                        <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8" onClick={removeImage}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload image</p>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                    </div>
                  </div>

                  <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Category *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2"><Building2 className="h-4 w-4" />Manufacturer</Label>
                      <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="e.g., Cisco, TP-Link" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Model</Label><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model number" /></div>
                    <div><Label>SKU</Label><Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Stock keeping unit" /></div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2"><Barcode className="h-4 w-4" />Barcode</Label>
                    <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Enter or scan barcode" />
                  </div>

                  <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Selling Price (UGX) *</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                    <div><Label>Unit Cost (UGX)</Label><Input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="Cost per unit" /></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Current Stock</Label><Input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} /></div>
                    <div>
                      <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" />Location</Label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                        <SelectContent>{LOCATIONS.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Reorder Level</Label>
                      <Input type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
                      <p className="text-xs text-muted-foreground mt-1">Alert when stock falls below</p>
                    </div>
                    <div>
                      <Label>Reorder Quantity</Label>
                      <Input type="number" value={reorderQuantity} onChange={(e) => setReorderQuantity(e.target.value)} />
                      <p className="text-xs text-muted-foreground mt-1">Suggested quantity to reorder</p>
                    </div>
                  </div>

                  <div>
                    <Label>Condition</Label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONDITIONS.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Warranty (Months)</Label>
                      <Input type="number" value={warrantyMonths} onChange={(e) => setWarrantyMonths(e.target.value)} placeholder="e.g., 12" />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2"><Scale className="h-4 w-4" />Weight (kg)</Label>
                      <Input type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g., 2.5" />
                    </div>
                  </div>

                  <div>
                    <Label>Dimensions (L x W x H cm)</Label>
                    <Input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="e.g., 30 x 20 x 5" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <Label>Active</Label>
                      <p className="text-xs text-muted-foreground">Product visible on website</p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <Label>Featured</Label>
                      <p className="text-xs text-muted-foreground">Show on homepage</p>
                    </div>
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            
            <Button onClick={saveProduct} disabled={loading || uploading} className="w-full mt-4">
              {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Save Product'}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

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