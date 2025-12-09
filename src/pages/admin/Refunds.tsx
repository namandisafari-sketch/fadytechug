import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RotateCcw, Search, Plus } from 'lucide-react';

interface Sale {
  id: string;
  receipt_number: string;
  customer_name: string | null;
  total: number;
  created_at: string;
}

interface Refund {
  id: string;
  receipt_number: string;
  reason: string;
  amount: number;
  created_at: string;
  sales: { customer_name: string | null } | null;
}

const Refunds = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptSearch, setReceiptSearch] = useState('');
  const [foundSale, setFoundSale] = useState<Sale | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    const { data, error } = await supabase
      .from('refunds')
      .select('*, sales(customer_name)')
      .order('created_at', { ascending: false });

    if (!error) setRefunds(data || []);
  };

  const searchReceipt = async () => {
    if (!receiptSearch) return;

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('receipt_number', receiptSearch)
      .maybeSingle();

    if (error || !data) {
      toast({ title: 'Not Found', description: 'Receipt not found', variant: 'destructive' });
      setFoundSale(null);
    } else {
      setFoundSale(data);
      setRefundAmount(data.total.toString());
    }
  };

  const processRefund = async () => {
    if (!foundSale || !refundAmount || !reason) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    const amount = parseFloat(refundAmount);
    if (amount <= 0 || amount > foundSale.total) {
      toast({ title: 'Error', description: 'Invalid refund amount', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('refunds')
        .insert({
          sale_id: foundSale.id,
          receipt_number: foundSale.receipt_number,
          reason,
          amount,
          refunded_by: user?.id
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Refund processed successfully' });
      setDialogOpen(false);
      setFoundSale(null);
      setReceiptSearch('');
      setRefundAmount('');
      setReason('');
      fetchRefunds();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredRefunds = refunds.filter(r =>
    r.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Refunds</h1>
          <p className="text-muted-foreground">Process and track customer refunds</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Process Refund
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Refund</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter receipt number"
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                />
                <Button onClick={searchReceipt}>Search</Button>
              </div>

              {foundSale && (
                <Card className="bg-secondary/50">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receipt:</span>
                      <span className="font-mono">{foundSale.receipt_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span>{foundSale.customer_name || 'Walk-in'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{new Date(foundSale.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>${foundSale.total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {foundSale && (
                <>
                  <div>
                    <Label>Refund Amount</Label>
                    <Input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={foundSale.total}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Max: ${foundSale.total.toFixed(2)}</p>
                  </div>

                  <div>
                    <Label>Reason for Refund</Label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Describe the reason for this refund"
                    />
                  </div>

                  <Button onClick={processRefund} disabled={loading} className="w-full">
                    {loading ? 'Processing...' : 'Confirm Refund'}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <RotateCcw className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Refunds</p>
              <p className="text-2xl font-bold text-red-600">${totalRefunds.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by receipt number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Refund History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Receipt #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRefunds.map(refund => (
                <TableRow key={refund.id}>
                  <TableCell>{new Date(refund.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono">{refund.receipt_number}</TableCell>
                  <TableCell>{refund.sales?.customer_name || 'Walk-in'}</TableCell>
                  <TableCell className="max-w-xs truncate">{refund.reason}</TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    -${refund.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredRefunds.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No refunds found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Refunds;
