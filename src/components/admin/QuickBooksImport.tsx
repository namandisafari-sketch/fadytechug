import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickBooksImportProps {
  onImportComplete: () => void;
  suppliers: { id: string; name: string }[];
}

interface ParsedProduct {
  name: string;
  description?: string;
  price: number;
  unit_cost?: number;
  stock_quantity: number;
  sku?: string;
  category: string;
  barcode?: string;
}

const QuickBooksImport = ({ onImportComplete, suppliers }: QuickBooksImportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/);
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const mapQuickBooksToProduct = (headers: string[], row: string[]): ParsedProduct | null => {
    const getValue = (possibleNames: string[]): string => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
        if (index !== -1 && row[index]) {
          return row[index].replace(/^"|"$/g, '');
        }
      }
      return '';
    };

    const name = getValue(['item name', 'name', 'item', 'product name', 'description']);
    if (!name) return null;

    const priceStr = getValue(['sales price', 'price', 'rate', 'amount', 'unit price']);
    const costStr = getValue(['cost', 'purchase cost', 'avg cost', 'unit cost']);
    const qtyStr = getValue(['quantity', 'qty', 'on hand', 'quantity on hand', 'stock']);

    return {
      name: name.substring(0, 255),
      description: getValue(['description', 'desc', 'sales description']) || undefined,
      price: parseFloat(priceStr) || 0,
      unit_cost: parseFloat(costStr) || undefined,
      stock_quantity: parseInt(qtyStr) || 0,
      sku: getValue(['sku', 'item number', 'part number', 'upc']) || undefined,
      category: getValue(['type', 'category', 'class']) || 'Uncategorized',
      barcode: getValue(['barcode', 'upc', 'ean']) || undefined,
    };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt') && !file.name.endsWith('.iif')) {
      toast.error("Please upload a CSV, TXT, or IIF file exported from QuickBooks");
      return;
    }

    setIsProcessing(true);
    setImportResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        throw new Error("File appears to be empty or has no data rows");
      }

      const headers = rows[0];
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim()));
      
      console.log("CSV Headers:", headers);
      console.log("Data rows count:", dataRows.length);

      const products: ParsedProduct[] = [];
      const errors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const product = mapQuickBooksToProduct(headers, dataRows[i]);
        if (product) {
          products.push(product);
        } else {
          errors.push(`Row ${i + 2}: Could not parse product data`);
        }
      }

      if (products.length === 0) {
        throw new Error("No valid products found in the file. Make sure the CSV has columns like 'Item Name', 'Sales Price', etc.");
      }

      // Get default supplier (first one) or null
      const defaultSupplierId = suppliers.length > 0 ? suppliers[0].id : null;

      // Insert products into database
      let successCount = 0;
      let failedCount = 0;

      for (const product of products) {
        const { error } = await supabase.from('products').insert({
          name: product.name,
          description: product.description || null,
          price: product.price,
          unit_cost: product.unit_cost || 0,
          stock_quantity: product.stock_quantity,
          sku: product.sku || null,
          category: product.category,
          barcode: product.barcode || null,
          supplier_id: defaultSupplierId,
          is_active: true,
        });

        if (error) {
          failedCount++;
          errors.push(`"${product.name}": ${error.message}`);
          console.error("Insert error:", error);
        } else {
          successCount++;
        }
      }

      setImportResults({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10), // Show max 10 errors
      });

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} products`);
        onImportComplete();
      }

    } catch (error) {
      console.error("Import error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to import products");
      setImportResults({
        success: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Import from QuickBooks
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Products from QuickBooks</DialogTitle>
            <DialogDescription>
              Export your products from QuickBooks Desktop and import them here with one click.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <h4 className="font-medium">How to export from QuickBooks Desktop:</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Open QuickBooks Desktop</li>
                <li>Go to <strong>Reports → Inventory → Inventory Valuation Summary</strong></li>
                <li>Click <strong>Excel → Create New Worksheet</strong></li>
                <li>Save as CSV file</li>
                <li>Upload the CSV file below</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                Or export from Lists → Item List → Excel → Export
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.iif"
              onChange={handleFileSelect}
              className="hidden"
              id="quickbooks-file"
            />

            <Button
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Select QuickBooks Export File
                </>
              )}
            </Button>

            {importResults && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {importResults.success > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">
                    {importResults.success} imported, {importResults.failed} failed
                  </span>
                </div>
                {importResults.errors.length > 0 && (
                  <div className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                    {importResults.errors.map((err, i) => (
                      <p key={i} className="text-destructive text-xs">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickBooksImport;
