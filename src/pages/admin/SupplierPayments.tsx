import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Banknote, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface Supplier {
  id: string;
  name: string;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
}

interface SupplierPayment {
  id: string;
  supplier_id: string;
  purchase_order_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: string;
  bank_name: string | null;
  reference_number: string | null;
  notes: string | null;
  paid_by: string | null;
  created_at: string;
  supplier?: Supplier;
  purchase_order?: PurchaseOrder;
}

const SupplierPayments = () => {
  const { user, isAdmin } = useAuth();
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedPO, setSelectedPO] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [bankName, setBankName] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchPayments();
    fetchSuppliers();
    fetchPurchaseOrders();
  }, []);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("supplier_payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch payments");
      console.error(error);
    } else {
      // Fetch related data
      const paymentsWithRelations = await Promise.all(
        (data || []).map(async (payment) => {
          const { data: supplier } = await supabase
            .from("suppliers")
            .select("id, name")
            .eq("id", payment.supplier_id)
            .maybeSingle();
          
          let purchaseOrder = null;
          if (payment.purchase_order_id) {
            const { data: po } = await supabase
              .from("purchase_orders")
              .select("id, order_number, total_amount, status")
              .eq("id", payment.purchase_order_id)
              .maybeSingle();
            purchaseOrder = po;
          }

          return {
            ...payment,
            supplier: supplier || undefined,
            purchase_order: purchaseOrder || undefined,
          };
        })
      );
      setPayments(paymentsWithRelations);
    }
    setLoading(false);
  };

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setSuppliers(data);
    }
  };

  const fetchPurchaseOrders = async () => {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("id, order_number, total_amount, status, supplier_id")
      .in("status", ["pending", "ordered"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPurchaseOrders(data);
    }
  };

  const resetForm = () => {
    setSelectedSupplier("");
    setSelectedPO("");
    setAmount("");
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod("bank_transfer");
    setBankName("");
    setReferenceNumber("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!selectedSupplier || !amount || parseFloat(amount) <= 0) {
      toast.error("Please select a supplier and enter a valid amount");
      return;
    }

    const paymentData = {
      supplier_id: selectedSupplier,
      purchase_order_id: selectedPO || null,
      amount: parseFloat(amount),
      payment_date: paymentDate,
      payment_method: paymentMethod,
      bank_name: bankName || null,
      reference_number: referenceNumber || null,
      notes: notes || null,
      paid_by: user?.id,
    };

    const { error } = await supabase
      .from("supplier_payments")
      .insert(paymentData);

    if (error) {
      toast.error("Failed to record payment");
      console.error(error);
    } else {
      toast.success("Payment recorded successfully");
      resetForm();
      setIsDialogOpen(false);
      fetchPayments();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) return;

    const { error } = await supabase
      .from("supplier_payments")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete payment");
      console.error(error);
    } else {
      toast.success("Payment deleted");
      fetchPayments();
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const supplierName = payment.supplier?.name?.toLowerCase() || "";
    const orderNumber = payment.purchase_order?.order_number?.toLowerCase() || "";
    const reference = payment.reference_number?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return supplierName.includes(search) || orderNumber.includes(search) || reference.includes(search);
  });

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      bank_transfer: "default",
      cash: "secondary",
      mobile_money: "outline",
    };
    const labels: Record<string, string> = {
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      mobile_money: "Mobile Money",
    };
    return <Badge variant={variants[method] || "default"}>{labels[method] || method}</Badge>;
  };

  // Filter POs by selected supplier
  const filteredPOs = purchaseOrders.filter(
    (po: any) => !selectedSupplier || po.supplier_id === selectedSupplier
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Supplier Payments</h1>
          <p className="text-muted-foreground mt-1">
            Track payments made to suppliers from bank
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Supplier Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Purchase Order (Optional)</Label>
                <Select value={selectedPO || "none"} onValueChange={(val) => setSelectedPO(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Link to purchase order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {filteredPOs.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.order_number} - {formatCurrency(po.total_amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (UGX) *</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Date *</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === "bank_transfer" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g., Stanbic Bank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference Number</Label>
                    <Input
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Transaction ref"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this payment"
                  rows={2}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full">
                Record Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by supplier, order number, or reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Banknote className="h-4 w-4" />
            <span className="text-sm">Total Payments</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(payments.reduce((sum, p) => sum + Number(p.amount), 0))}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">This Month</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(
              payments
                .filter((p) => {
                  const paymentMonth = new Date(p.payment_date).getMonth();
                  const currentMonth = new Date().getMonth();
                  return paymentMonth === currentMonth;
                })
                .reduce((sum, p) => sum + Number(p.amount), 0)
            )}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="text-sm">Payment Count</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{payments.length}</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Purchase Order</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              {isAdmin && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {payment.supplier?.name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {payment.purchase_order?.order_number || "-"}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>{getPaymentMethodBadge(payment.payment_method)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.reference_number || "-"}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(payment.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SupplierPayments;
