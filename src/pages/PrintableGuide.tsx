import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrintableGuide = () => {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Print controls - hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Press Ctrl+P (or Cmd+P on Mac) to print/save as PDF</span>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Guide
          </Button>
        </div>
      </div>

      {/* Printable content */}
      <div className="max-w-4xl mx-auto p-8 print:p-4 print:max-w-none">
        <style>{`
          @media print {
            body { font-size: 11pt; }
            h1 { font-size: 20pt; page-break-after: avoid; }
            h2 { font-size: 14pt; page-break-after: avoid; margin-top: 16pt; }
            h3 { font-size: 12pt; page-break-after: avoid; }
            table { page-break-inside: avoid; }
            .page-break { page-break-before: always; }
          }
        `}</style>

        {/* Header */}
        <div className="text-center mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold mb-2">Fady Technologies</h1>
          <p className="text-xl text-muted-foreground">Quick Reference Guide for Staff</p>
          <p className="text-sm text-muted-foreground mt-2">Keep this at your workstation for easy reference</p>
        </div>

        {/* Login Section */}
        <Section title="🔐 How to Log In">
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to the website</li>
            <li>Click <strong>"Admin"</strong> or go to /auth</li>
            <li>Enter your email and password</li>
            <li>Click <strong>"Sign In"</strong></li>
          </ol>
        </Section>

        {/* POS Section */}
        <Section title="💳 Making a Sale (Point of Sale)">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Step 1: Find the Product</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Type name:</strong> Search box → Click product</li>
                <li><strong>Scan barcode:</strong> Click camera icon → Point at barcode</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Step 2: Check Cart</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Use +/- to change quantity</li>
                <li>Click X to remove items</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Step 3: Payment</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Choose: Cash, Mobile Money, Card, Bank Transfer, or Credit</li>
                <li>For cash: Enter amount received</li>
                <li>Click <strong>"Complete Sale"</strong></li>
                <li>Print receipt for customer</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Products Section */}
        <Section title="📦 Adding a New Product">
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <strong>Products</strong> in menu</li>
            <li>Click <strong>"Add Product"</strong></li>
            <li>Fill in: Name, Category, <strong>Supplier (required!)</strong>, Price, Stock</li>
            <li>Add photo (optional)</li>
            <li>Click <strong>"Save"</strong></li>
          </ol>
          <div className="bg-muted p-2 rounded mt-2 text-sm">
            ⚠️ <strong>Important:</strong> You MUST choose a supplier. No supplier = cannot save.
          </div>
        </Section>

        <div className="page-break" />

        {/* Inventory Section */}
        <Section title="📊 Managing Stock">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Adding Stock</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click <strong>Inventory</strong></li>
                <li>Click <strong>"Quick Stock Entry"</strong></li>
                <li>Search for product</li>
                <li>Enter quantity to add</li>
                <li>Click <strong>"Add Stock"</strong></li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Removing Stock</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click <strong>Inventory</strong></li>
                <li>Click <strong>"Quick Stock Entry"</strong></li>
                <li>Toggle to <strong>"Remove Stock"</strong></li>
                <li>Search product, enter quantity</li>
                <li>Choose reason (Damage/Adjustment)</li>
              </ol>
            </div>
          </div>
        </Section>

        {/* Stock Receiving */}
        <Section title="📥 Receiving Stock from Supplier">
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <strong>Stock Receiving</strong></li>
            <li>Choose the Purchase Order</li>
            <li>Scan or search each product that arrived</li>
            <li>Enter quantity received</li>
            <li>Choose storage location</li>
            <li>Click <strong>"Receive Stock"</strong></li>
          </ol>
        </Section>

        {/* Customers */}
        <Section title="👥 Customers & Credit Sales">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-1">Adding a Customer</h3>
              <p className="text-sm">Customers → Add Customer → Fill name, phone, email → Save</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Credit Sales (Pay Later)</h3>
              <p className="text-sm">Go to Customers → Click "Credit Sales" tab → See who owes money</p>
              <p className="text-sm">Use date filter to find sales from specific dates</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Recording Payment</h3>
              <p className="text-sm">Find customer → Click "Record Payment" → Enter amount → Save</p>
            </div>
          </div>
        </Section>

        {/* Refunds */}
        <Section title="↩️ Processing Refunds">
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <strong>Sales</strong></li>
            <li>Find the sale</li>
            <li>Click <strong>"Refund"</strong></li>
            <li>Choose full or partial refund</li>
            <li>Enter reason</li>
            <li>Confirm (stock returns automatically)</li>
          </ol>
        </Section>

        <div className="page-break" />

        {/* Suppliers */}
        <Section title="🏭 Paying Suppliers">
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <strong>Suppliers</strong></li>
            <li>Click <strong>"Record Payment"</strong></li>
            <li>Choose supplier</li>
            <li>Enter amount and payment method</li>
            <li>Click <strong>"Record Payment"</strong></li>
          </ol>
        </Section>

        {/* Expenses */}
        <Section title="💸 Recording Expenses">
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <strong>Expenses</strong></li>
            <li>Click <strong>"Add Expense"</strong></li>
            <li>Fill: Description, Amount, Category, Payment Method</li>
            <li>Click <strong>"Save"</strong></li>
          </ol>
          <p className="text-sm mt-2 text-muted-foreground">Categories: Utilities, Rent, Salaries, Supplies, Transport, Marketing, Maintenance, Other</p>
        </Section>

        {/* Banking */}
        <Section title="🏦 Banking & Deposits">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-1">Bank Deposit</h3>
              <p className="text-sm">Banking → New Deposit → Enter amount, bank, date → Record Deposit</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Start New Day</h3>
              <p className="text-sm">Banking → Start New Day → Enter opening balance</p>
            </div>
          </div>
        </Section>

        {/* Quick Reference Table */}
        <Section title="🔑 Quick Reference Table">
          <table className="w-full border-collapse border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Task</th>
                <th className="border p-2 text-left">Where to Go</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-2">Sell something</td><td className="border p-2">Point of Sale</td></tr>
              <tr><td className="border p-2">Add a product</td><td className="border p-2">Products → Add Product</td></tr>
              <tr><td className="border p-2">Check stock levels</td><td className="border p-2">Inventory</td></tr>
              <tr><td className="border p-2">Add more stock</td><td className="border p-2">Inventory → Quick Stock Entry</td></tr>
              <tr><td className="border p-2">Receive from supplier</td><td className="border p-2">Stock Receiving</td></tr>
              <tr><td className="border p-2">View past sales</td><td className="border p-2">Sales</td></tr>
              <tr><td className="border p-2">Process refund</td><td className="border p-2">Sales → Find sale → Refund</td></tr>
              <tr><td className="border p-2">Add customer</td><td className="border p-2">Customers → Add Customer</td></tr>
              <tr><td className="border p-2">See who owes money</td><td className="border p-2">Customers → Credit Sales tab</td></tr>
              <tr><td className="border p-2">Pay supplier</td><td className="border p-2">Suppliers → Record Payment</td></tr>
              <tr><td className="border p-2">Record expense</td><td className="border p-2">Expenses → Add Expense</td></tr>
              <tr><td className="border p-2">Bank deposit</td><td className="border p-2">Banking → New Deposit</td></tr>
              <tr><td className="border p-2">View reports</td><td className="border p-2">Reports</td></tr>
            </tbody>
          </table>
        </Section>

        <div className="page-break" />

        {/* Troubleshooting */}
        <Section title="🆘 Common Problems & Solutions">
          <table className="w-full border-collapse border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Problem</th>
                <th className="border p-2 text-left">Solution</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">Can't save product</td>
                <td className="border p-2">Select a Supplier - it's required</td>
              </tr>
              <tr>
                <td className="border p-2">Product not on website</td>
                <td className="border p-2">Check: Is Active = Yes? Stock greater than 0?</td>
              </tr>
              <tr>
                <td className="border p-2">Barcode scanner not working</td>
                <td className="border p-2">Allow camera access, good lighting, hold steady</td>
              </tr>
              <tr>
                <td className="border p-2">Receipt won't print</td>
                <td className="border p-2">Check printer connection, try Ctrl+P</td>
              </tr>
              <tr>
                <td className="border p-2">Wrong date showing</td>
                <td className="border p-2">System uses Uganda time (EAT) - this is normal</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          <p><strong>Fady Technologies</strong> - Business Management System</p>
          <p>All times shown in Uganda Time (EAT, UTC+3)</p>
          <p className="mt-2">For help, contact your system administrator</p>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-lg font-bold mb-3 border-b pb-1">{title}</h2>
    {children}
  </div>
);

export default PrintableGuide;
