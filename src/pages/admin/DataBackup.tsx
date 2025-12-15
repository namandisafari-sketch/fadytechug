import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Database, Shield, FileJson, AlertTriangle, CheckCircle } from 'lucide-react';

const BACKUP_TABLES = [
  { id: 'products', name: 'Products', description: 'All product catalog data' },
  { id: 'customers', name: 'Customers', description: 'Customer information' },
  { id: 'suppliers', name: 'Suppliers', description: 'Supplier contacts and details' },
  { id: 'sales', name: 'Sales', description: 'Sales transactions' },
  { id: 'sale_items', name: 'Sale Items', description: 'Individual sale line items' },
  { id: 'expenses', name: 'Expenses', description: 'Business expenses' },
  { id: 'purchase_orders', name: 'Purchase Orders', description: 'Supplier orders' },
  { id: 'purchase_order_items', name: 'PO Items', description: 'Purchase order line items' },
  { id: 'inventory_transactions', name: 'Inventory Transactions', description: 'Stock movement history' },
  { id: 'serial_units', name: 'Stock Units', description: 'Individual unit tracking' },
  { id: 'serial_unit_history', name: 'Unit History', description: 'Unit status changes' },
  { id: 'refunds', name: 'Refunds', description: 'Refund records' },
  { id: 'bank_deposits', name: 'Bank Deposits', description: 'Deposit records' },
  { id: 'supplier_payments', name: 'Supplier Payments', description: 'Payments to suppliers' },
  { id: 'inquiries', name: 'Inquiries', description: 'Customer inquiries' },
  { id: 'profiles', name: 'User Profiles', description: 'User account info' },
  { id: 'user_roles', name: 'User Roles', description: 'Role assignments' },
  { id: 'site_settings', name: 'Site Settings', description: 'App configuration' },
];

const DataBackup = () => {
  const { toast } = useToast();
  const [selectedTables, setSelectedTables] = useState<string[]>(BACKUP_TABLES.map(t => t.id));
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backupData, setBackupData] = useState<Record<string, any[]> | null>(null);

  const toggleTable = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(t => t !== tableId)
        : [...prev, tableId]
    );
  };

  const selectAll = () => setSelectedTables(BACKUP_TABLES.map(t => t.id));
  const selectNone = () => setSelectedTables([]);

  const createBackup = async () => {
    if (selectedTables.length === 0) {
      toast({ title: 'Error', description: 'Select at least one table', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setProgress(0);
    const data: Record<string, any[]> = {};

    try {
      for (let i = 0; i < selectedTables.length; i++) {
        const tableName = selectedTables[i];
        setProgress(Math.round(((i + 1) / selectedTables.length) * 100));

        const { data: tableData, error } = await supabase
          .from(tableName as any)
          .select('*')
          .limit(10000);

        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          data[tableName] = [];
        } else {
          data[tableName] = tableData || [];
        }
      }

      setBackupData(data);
      toast({ title: 'Backup Ready', description: 'Click download to save the backup file' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = () => {
    if (!backupData) return;

    const backup = {
      version: '1.0',
      created_at: new Date().toISOString(),
      app: 'Fady Technologies',
      tables: backupData,
      metadata: {
        total_records: Object.values(backupData).reduce((sum, arr) => sum + arr.length, 0),
        tables_count: Object.keys(backupData).length
      }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fady-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Downloaded', description: 'Backup file saved to your device' });
  };

  const totalRecords = backupData 
    ? Object.values(backupData).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Backup</h1>
        <p className="text-muted-foreground">Download a complete backup of your business data</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Table Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Select Data to Backup
                </CardTitle>
                <CardDescription>{selectedTables.length} of {BACKUP_TABLES.length} tables selected</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                <Button variant="outline" size="sm" onClick={selectNone}>Clear</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {BACKUP_TABLES.map(table => (
                <div 
                  key={table.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTables.includes(table.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleTable(table.id)}
                >
                  <Checkbox 
                    checked={selectedTables.includes(table.id)}
                    onCheckedChange={() => toggleTable(table.id)}
                  />
                  <div className="flex-1">
                    <span className="font-medium">{table.name}</span>
                    <p className="text-xs text-muted-foreground">{table.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Backup Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Create Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">Fetching data... {progress}%</p>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg" 
                onClick={createBackup} 
                disabled={loading || selectedTables.length === 0}
              >
                <Database className="h-5 w-5 mr-2" />
                {loading ? 'Creating Backup...' : 'Generate Backup'}
              </Button>

              {backupData && (
                <>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Backup Ready</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {totalRecords.toLocaleString()} records from {Object.keys(backupData).length} tables
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg" 
                    variant="outline"
                    onClick={downloadBackup}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download JSON
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Backups include all selected data up to 10,000 records per table</p>
              <p>• Store backup files securely - they contain sensitive business data</p>
              <p>• Regular backups are recommended weekly or before major changes</p>
              <p>• Backup files can be used to migrate to a self-hosted database</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataBackup;
