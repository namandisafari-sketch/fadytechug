import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Settings as SettingsIcon, 
  Printer, 
  Receipt, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  Users,
  AlertTriangle,
  Loader2,
  Building2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import type { Json } from '@/integrations/supabase/types';

interface StorageLocation {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface ReceiptSettings {
  [key: string]: string | boolean;
  businessName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  footerMessage: string;
  showLogo: boolean;
  showQrCode: boolean;
  showAddress: boolean;
  showPhone: boolean;
}

interface PrinterSettings {
  [key: string]: string | boolean;
  printerType: string;
  paperWidth: string;
  autoPrint: boolean;
  openCashDrawer: boolean;
}

interface BankSettings {
  [key: string]: string | boolean;
  bankName: string;
  accountNumber: string;
  accountName: string;
  autoDepositOnClose: boolean;
}

const defaultReceiptSettings: ReceiptSettings = {
  businessName: 'FADY TECHNOLOGIES',
  tagline: 'Network Equipment Store',
  address: '',
  phone: '',
  email: '',
  footerMessage: 'Thank you for your purchase!',
  showLogo: true,
  showQrCode: true,
  showAddress: true,
  showPhone: true,
};

const defaultPrinterSettings: PrinterSettings = {
  printerType: 'browser',
  paperWidth: '80',
  autoPrint: false,
  openCashDrawer: false,
};

const defaultBankSettings: BankSettings = {
  bankName: '',
  accountNumber: '',
  accountName: '',
  autoDepositOnClose: true,
};

const Settings = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Receipt Settings
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(defaultReceiptSettings);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(defaultPrinterSettings);
  const [bankSettings, setBankSettings] = useState<BankSettings>(defaultBankSettings);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  
  // Storage Locations
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  
  // Data Deletion
  const [deletingData, setDeletingData] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchLocations();
  }, []);

  const fetchSettings = async () => {
    const { data: receiptData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'receipt_settings')
      .maybeSingle();
    
    if (receiptData?.value) {
      setReceiptSettings({ ...defaultReceiptSettings, ...(receiptData.value as object) });
    }

    const { data: printerData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'printer_settings')
      .maybeSingle();
    
    if (printerData?.value) {
      setPrinterSettings({ ...defaultPrinterSettings, ...(printerData.value as object) });
    }

    const { data: bankData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'bank_settings')
      .maybeSingle();
    
    if (bankData?.value) {
      setBankSettings({ ...defaultBankSettings, ...(bankData.value as object) });
    }
  };

  const fetchLocations = async () => {
    const { data } = await supabase
      .from('storage_locations')
      .select('*')
      .order('name');
    
    if (data) setLocations(data);
  };

  const saveReceiptSettings = async () => {
    setSavingReceipt(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'receipt_settings')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('site_settings')
          .update({ value: receiptSettings as Json, updated_by: user?.id })
          .eq('key', 'receipt_settings');
      } else {
        await supabase
          .from('site_settings')
          .insert([{ key: 'receipt_settings', value: receiptSettings as Json, updated_by: user?.id }]);
      }

      // Save printer settings
      const { data: existingPrinter } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'printer_settings')
        .maybeSingle();

      if (existingPrinter) {
        await supabase
          .from('site_settings')
          .update({ value: printerSettings as Json, updated_by: user?.id })
          .eq('key', 'printer_settings');
      } else {
        await supabase
          .from('site_settings')
          .insert([{ key: 'printer_settings', value: printerSettings as Json, updated_by: user?.id }]);
      }

      toast({ title: 'Success', description: 'Settings saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingReceipt(false);
    }
  };

  const saveBankSettings = async () => {
    setSavingBank(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'bank_settings')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('site_settings')
          .update({ value: bankSettings as Json, updated_by: user?.id })
          .eq('key', 'bank_settings');
      } else {
        await supabase
          .from('site_settings')
          .insert([{ key: 'bank_settings', value: bankSettings as Json, updated_by: user?.id }]);
      }

      toast({ title: 'Success', description: 'Bank settings saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingBank(false);
    }
  };

  const openLocationDialog = (location?: StorageLocation) => {
    if (location) {
      setEditingLocation(location);
      setLocationName(location.name);
      setLocationDescription(location.description || '');
    } else {
      setEditingLocation(null);
      setLocationName('');
      setLocationDescription('');
    }
    setLocationDialogOpen(true);
  };

  const saveLocation = async () => {
    if (!locationName.trim()) {
      toast({ title: 'Error', description: 'Location name is required', variant: 'destructive' });
      return;
    }

    setSavingLocation(true);
    try {
      if (editingLocation) {
        await supabase
          .from('storage_locations')
          .update({ name: locationName, description: locationDescription || null })
          .eq('id', editingLocation.id);
      } else {
        await supabase
          .from('storage_locations')
          .insert({ name: locationName, description: locationDescription || null });
      }

      toast({ title: 'Success', description: `Location ${editingLocation ? 'updated' : 'created'}` });
      setLocationDialogOpen(false);
      fetchLocations();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingLocation(false);
    }
  };

  const toggleLocationActive = async (location: StorageLocation) => {
    await supabase
      .from('storage_locations')
      .update({ is_active: !location.is_active })
      .eq('id', location.id);
    
    fetchLocations();
  };

  const deleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    
    await supabase.from('storage_locations').delete().eq('id', id);
    toast({ title: 'Success', description: 'Location deleted' });
    fetchLocations();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage system settings and configurations</p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="account" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="receipt" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Receipt</span>
          </TabsTrigger>
          <TabsTrigger value="printer" className="gap-2">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Printer</span>
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Bank</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Locations</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="danger" className="gap-2 text-destructive data-[state=active]:text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Danger</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Staff Management
                </CardTitle>
                <CardDescription>Manage staff members and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/admin/staff')}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Staff
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Receipt Layout Tab */}
        <TabsContent value="receipt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Receipt Layout
              </CardTitle>
              <CardDescription>Customize how your receipts look</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input 
                    value={receiptSettings.businessName}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, businessName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input 
                    value={receiptSettings.tagline}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, tagline: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea 
                  value={receiptSettings.address}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, address: e.target.value })}
                  placeholder="Enter business address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    value={receiptSettings.phone}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, phone: e.target.value })}
                    placeholder="+256 XXX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={receiptSettings.email}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, email: e.target.value })}
                    placeholder="info@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Footer Message</Label>
                <Input 
                  value={receiptSettings.footerMessage}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, footerMessage: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <Label>Display Options</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor="showLogo" className="cursor-pointer">Show Logo</Label>
                    <Switch 
                      id="showLogo"
                      checked={receiptSettings.showLogo}
                      onCheckedChange={(checked) => setReceiptSettings({ ...receiptSettings, showLogo: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor="showQrCode" className="cursor-pointer">Show QR Code</Label>
                    <Switch 
                      id="showQrCode"
                      checked={receiptSettings.showQrCode}
                      onCheckedChange={(checked) => setReceiptSettings({ ...receiptSettings, showQrCode: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor="showAddress" className="cursor-pointer">Show Address</Label>
                    <Switch 
                      id="showAddress"
                      checked={receiptSettings.showAddress}
                      onCheckedChange={(checked) => setReceiptSettings({ ...receiptSettings, showAddress: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor="showPhone" className="cursor-pointer">Show Phone</Label>
                    <Switch 
                      id="showPhone"
                      checked={receiptSettings.showPhone}
                      onCheckedChange={(checked) => setReceiptSettings({ ...receiptSettings, showPhone: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Printer Tab */}
        <TabsContent value="printer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Thermal Printer Settings
              </CardTitle>
              <CardDescription>Configure thermal printer for receipt printing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Printer Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      printerSettings.printerType === 'browser' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setPrinterSettings({ ...printerSettings, printerType: 'browser' })}
                  >
                    <p className="font-medium">Browser Print</p>
                    <p className="text-sm text-muted-foreground">Use browser print dialog</p>
                  </div>
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      printerSettings.printerType === 'thermal' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setPrinterSettings({ ...printerSettings, printerType: 'thermal' })}
                  >
                    <p className="font-medium">Thermal Printer</p>
                    <p className="text-sm text-muted-foreground">Direct ESC/POS printing</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Paper Width</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      printerSettings.paperWidth === '58' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setPrinterSettings({ ...printerSettings, paperWidth: '58' })}
                  >
                    <p className="font-medium">58mm</p>
                    <p className="text-sm text-muted-foreground">Compact receipts</p>
                  </div>
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      printerSettings.paperWidth === '80' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setPrinterSettings({ ...printerSettings, paperWidth: '80' })}
                  >
                    <p className="font-medium">80mm</p>
                    <p className="text-sm text-muted-foreground">Standard receipts</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Printer Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="autoPrint" className="cursor-pointer">Auto Print</Label>
                      <p className="text-sm text-muted-foreground">Print automatically after sale</p>
                    </div>
                    <Switch 
                      id="autoPrint"
                      checked={printerSettings.autoPrint}
                      onCheckedChange={(checked) => setPrinterSettings({ ...printerSettings, autoPrint: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="openCashDrawer" className="cursor-pointer">Open Cash Drawer</Label>
                      <p className="text-sm text-muted-foreground">Open drawer after printing</p>
                    </div>
                    <Switch 
                      id="openCashDrawer"
                      checked={printerSettings.openCashDrawer}
                      onCheckedChange={(checked) => setPrinterSettings({ ...printerSettings, openCashDrawer: checked })}
                    />
                  </div>
                </div>
              </div>

              {printerSettings.printerType === 'thermal' && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Thermal Printer Setup</p>
                  <p className="text-sm text-muted-foreground">
                    For direct thermal printing, connect your printer via USB and select it in your browser 
                    print settings. Most ESC/POS compatible printers work with browser printing when using 
                    the correct paper size.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={saveReceiptSettings} disabled={savingReceipt} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {savingReceipt ? 'Saving...' : 'Save All Settings'}
          </Button>
        </TabsContent>

        {/* Bank Settings Tab */}
        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank Account Settings
              </CardTitle>
              <CardDescription>Configure your bank account for automatic deposits when closing shifts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name *</Label>
                  <Input 
                    value={bankSettings.bankName}
                    onChange={(e) => setBankSettings({ ...bankSettings, bankName: e.target.value })}
                    placeholder="e.g., Stanbic Bank, DFCU, Centenary Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input 
                    value={bankSettings.accountNumber}
                    onChange={(e) => setBankSettings({ ...bankSettings, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input 
                  value={bankSettings.accountName}
                  onChange={(e) => setBankSettings({ ...bankSettings, accountName: e.target.value })}
                  placeholder="Account holder name"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                <div>
                  <Label htmlFor="autoDeposit" className="cursor-pointer font-medium">Auto Deposit on Shift Close</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically record a bank deposit when closing a shift. The full cash register balance will be deposited.
                  </p>
                </div>
                <Switch 
                  id="autoDeposit"
                  checked={bankSettings.autoDepositOnClose}
                  onCheckedChange={(checked) => setBankSettings({ ...bankSettings, autoDepositOnClose: checked })}
                />
              </div>

              {!bankSettings.bankName && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Please configure your bank name to enable automatic deposits when closing shifts.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={saveBankSettings} disabled={savingBank} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {savingBank ? 'Saving...' : 'Save Bank Settings'}
          </Button>
        </TabsContent>

        {/* Storage Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Storage Locations
                </CardTitle>
                <CardDescription>Manage inventory storage locations</CardDescription>
              </div>
              <Button onClick={() => openLocationDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map(location => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell className="text-muted-foreground">{location.description || '-'}</TableCell>
                      <TableCell>
                        <Switch 
                          checked={location.is_active}
                          onCheckedChange={() => toggleLocationActive(location)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openLocationDialog(location)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button size="icon" variant="ghost" onClick={() => deleteLocation(location.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {locations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No storage locations defined. Add your first location.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        {isAdmin && (
          <TabsContent value="danger" className="space-y-4">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that will permanently delete data from the system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-destructive rounded-lg bg-destructive/5">
                  <h4 className="font-semibold text-destructive mb-2">Delete All Business Data</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will permanently delete ALL data including: products, sales, customers, expenses, 
                    suppliers, purchase orders, inventory transactions, serial units, refunds, bank deposits, 
                    and inquiries. This action cannot be undone.
                  </p>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                          <p>
                            This action <strong>cannot be undone</strong>. This will permanently delete:
                          </p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>All products and inventory</li>
                            <li>All sales records and receipts</li>
                            <li>All customers and inquiries</li>
                            <li>All suppliers and purchase orders</li>
                            <li>All expenses and bank deposits</li>
                            <li>All serial units and history</li>
                            <li>All refunds</li>
                          </ul>
                          <div className="pt-2">
                            <Label className="text-foreground">
                              Type <strong>DELETE ALL DATA</strong> to confirm:
                            </Label>
                            <Input 
                              className="mt-2"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              placeholder="DELETE ALL DATA"
                            />
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={deleteConfirmText !== 'DELETE ALL DATA' || deletingData}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={async (e) => {
                            e.preventDefault();
                            if (deleteConfirmText !== 'DELETE ALL DATA') return;
                            
                            setDeletingData(true);
                            try {
                              // Delete in order to respect foreign key constraints
                              const tables = [
                                'serial_unit_history',
                                'serial_units',
                                'sale_items',
                                'refunds',
                                'sales',
                                'purchase_order_items',
                                'purchase_orders',
                                'supplier_payments',
                                'inventory_transactions',
                                'bank_deposits',
                                'expenses',
                                'inquiries',
                                'products',
                                'customers',
                                'suppliers',
                              ];

                              for (const table of tables) {
                                const { error } = await supabase.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                                if (error) {
                                  console.error(`Error deleting ${table}:`, error);
                                }
                              }

                              toast({ 
                                title: 'Data Deleted', 
                                description: 'All business data has been permanently deleted' 
                              });
                              setDeleteConfirmText('');
                            } catch (error: any) {
                              toast({ 
                                title: 'Error', 
                                description: error.message, 
                                variant: 'destructive' 
                              });
                            } finally {
                              setDeletingData(false);
                            }
                          }}
                        >
                          {deletingData ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Delete All Data'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add Storage Location'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Location Name *</Label>
              <Input 
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Store Front, Main Warehouse, Shelf A1"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <Button onClick={saveLocation} disabled={savingLocation} className="w-full">
              {savingLocation ? 'Saving...' : (editingLocation ? 'Update Location' : 'Add Location')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
