import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Search, Eye, Trash2, Mail, Phone, Building2 } from 'lucide-react';
import { formatUgandaDate } from '@/lib/utils';

interface Inquiry {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_company: string | null;
  message: string | null;
  status: string;
  priority: string | null;
  notes: string | null;
  created_at: string;
  products: { name: string } | null;
}

const STATUS_OPTIONS = ['new', 'in_progress', 'responded', 'closed'];
const PRIORITY_OPTIONS = ['low', 'normal', 'high', 'urgent'];

const Inquiries = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*, products(name)')
      .order('created_at', { ascending: false });

    if (!error) setInquiries(data || []);
  };

  const openViewDialog = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setStatus(inquiry.status);
    setPriority(inquiry.priority || 'normal');
    setNotes(inquiry.notes || '');
    setDialogOpen(true);
  };

  const updateInquiry = async () => {
    if (!selectedInquiry) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status, priority, notes })
        .eq('id', selectedInquiry.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Inquiry updated' });
      setDialogOpen(false);
      fetchInquiries();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm('Delete this inquiry?')) return;
    const { error } = await supabase.from('inquiries').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Inquiry deleted' });
      fetchInquiries();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'in_progress': return 'secondary';
      case 'responded': return 'outline';
      case 'closed': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const filteredInquiries = inquiries.filter(i => {
    const matchesSearch = i.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inquiries</h1>
        <p className="text-muted-foreground">Track and manage customer inquiries</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search inquiries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Inquiries ({inquiries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.map(inquiry => (
                <TableRow key={inquiry.id}>
                  <TableCell>
                    <div className="font-medium">{inquiry.customer_name}</div>
                    <div className="text-sm text-muted-foreground">{inquiry.customer_email}</div>
                  </TableCell>
                  <TableCell>{inquiry.products?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(inquiry.status)} className="capitalize">
                      {inquiry.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPriorityColor(inquiry.priority)}`}>
                      {inquiry.priority || 'normal'}
                    </span>
                  </TableCell>
                  <TableCell>{formatUgandaDate(inquiry.created_at)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => openViewDialog(inquiry)}><Eye className="h-4 w-4" /></Button>
                    {isAdmin && (
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteInquiry(inquiry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredInquiries.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No inquiries found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h3 className="font-semibold">{selectedInquiry.customer_name}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />{selectedInquiry.customer_email}
                </div>
                {selectedInquiry.customer_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />{selectedInquiry.customer_phone}
                  </div>
                )}
                {selectedInquiry.customer_company && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4" />{selectedInquiry.customer_company}
                  </div>
                )}
              </div>

              {selectedInquiry.products?.name && (
                <div>
                  <Label className="text-muted-foreground">Product of Interest</Label>
                  <p className="font-medium">{selectedInquiry.products.name}</p>
                </div>
              )}

              {selectedInquiry.message && (
                <div>
                  <Label className="text-muted-foreground">Message</Label>
                  <p className="p-3 bg-muted rounded">{selectedInquiry.message}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Internal Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this inquiry..." />
              </div>

              <Button onClick={updateInquiry} disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Update Inquiry'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inquiries;