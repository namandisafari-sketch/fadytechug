# Fady Technologies - Complete User Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Customer-Facing Shop](#customer-facing-shop)
4. [Admin Panel Access](#admin-panel-access)
5. [Dashboard](#dashboard)
6. [Point of Sale (POS)](#point-of-sale-pos)
7. [Products Management](#products-management)
8. [Inventory Management](#inventory-management)
9. [Stock Receiving](#stock-receiving)
10. [Sales Tracking](#sales-tracking)
11. [Customer Management](#customer-management)
12. [Supplier Management](#supplier-management)
13. [Purchase Orders](#purchase-orders)
14. [Expenses Tracking](#expenses-tracking)
15. [Banking & Deposits](#banking--deposits)
16. [Reports](#reports)
17. [Inquiries](#inquiries)
18. [Barcode System](#barcode-system)
19. [Staff Management](#staff-management)
20. [Site Appearance](#site-appearance)
21. [Settings](#settings)
22. [Data Backup](#data-backup)

---

## Overview

Fady Technologies is a complete business management system for a network equipment store. It includes:

- **Customer-facing online shop** - Where customers browse products and make inquiries
- **Admin panel** - For staff and owner to manage all business operations
- **Point of Sale (POS)** - For processing in-store sales
- **Inventory management** - Track stock levels and locations
- **Financial tracking** - Sales, expenses, banking, and reports

**Currency**: All prices are in **UGX (Ugandan Shillings)**

---

## Getting Started

### Accessing the System

1. **Customer Shop**: Visit the main website URL
2. **Admin Panel**: Navigate to `/admin` or click "Admin" link

### Logging In

1. Go to `/auth` or click the login button
2. Enter your email and password
3. Click "Sign In"

**Default Admin Account**:
- Email: `fady@admin.com`
- Password: `Zxcvbn#2`

### User Roles

| Role | Access Level |
|------|-------------|
| **Admin** | Full access to all features |
| **Staff** | Access only to assigned pages |

---

## Customer-Facing Shop

### What Customers See

1. **Homepage** with:
   - Hero banner with business info
   - Product categories
   - Featured products
   - Search functionality

2. **Product Listings**:
   - Browse by category
   - Search by name/keyword
   - View product details

3. **Product Details**:
   - Full description
   - Price (in UGX)
   - Stock availability
   - Inquiry form

### Customer Inquiry Process

1. Customer finds a product they're interested in
2. Clicks "Inquire" or fills the inquiry form
3. Enters: Name, Email, Phone, Message
4. Submits inquiry
5. Staff receives notification in admin panel

---

## Admin Panel Access

### Navigation

The admin panel sidebar includes:

| Section | Purpose |
|---------|---------|
| Dashboard | Overview & quick stats |
| Point of Sale | Process in-store sales |
| Products | Manage product catalog |
| Inventory | Stock management |
| Stock Receiving | Receive supplier shipments |
| Sales | View sales history |
| Customers | Customer database |
| Suppliers | Supplier management |
| Purchase Orders | Order from suppliers |
| Expenses | Track business expenses |
| Banking | Cash register & deposits |
| Reports | Financial reports |
| Inquiries | Customer inquiries |
| Barcodes | Barcode scanning tools |
| Staff Management | Manage staff accounts (Admin only) |
| Site Appearance | Customize website (Admin only) |
| Settings | System settings |
| Data Backup | Export business data (Admin only) |

---

## Dashboard

The dashboard provides:

### Quick Statistics
- Today's sales total
- Number of products
- Active customers
- Pending inquiries

### Recent Activity
- Latest sales transactions
- Recent inquiries
- Low stock alerts

### Quick Actions
- New sale
- Add product
- View reports

---

## Point of Sale (POS)

### Processing a Sale

#### Step 1: Add Products to Cart
**Method A - Manual Search**:
1. Type product name in search box
2. Click product from results
3. Adjust quantity using +/- buttons

**Method B - Barcode Scanning**:
1. Click the barcode scanner icon
2. Allow camera access
3. Scan product barcode
4. Product automatically added to cart

#### Step 2: Review Cart
- View items, quantities, and prices
- Remove items if needed
- Apply discount (optional)

#### Step 3: Select Customer (Optional)
- Search existing customer
- Or add new customer details

#### Step 4: Process Payment

1. **Select Payment Method**:
   - Cash
   - Card
   - Mobile Money
   - Bank Transfer
   - Credit

2. **For Cash Payments**:
   - Enter amount received
   - System calculates change

3. Click "Complete Sale"

#### Step 5: Receipt
- Receipt displays automatically
- Options:
  - Print receipt
  - New sale

### Receipt Contents
- Business logo & info
- Receipt number
- Date/time
- Items purchased
- Payment details
- QR code (links to receipt details)

---

## Products Management

### Adding a New Product

#### Quick Add (Simple)
1. Go to Products page
2. Click "Quick Add Product"
3. Fill in:
   - Product name
   - Category
   - Price
   - Stock quantity
4. Click "Add Product"

#### Full Details (Comprehensive)
1. Click "Add Product" or "Full Details"
2. Fill in all fields:

| Field | Description |
|-------|-------------|
| Name | Product name |
| Category | Product category |
| **Supplier** | **Supplier (required)** |
| Price | Selling price (UGX) |
| Unit Cost | Your cost price |
| Stock Quantity | Current stock |
| SKU | Stock keeping unit code |
| Barcode | Product barcode |
| Manufacturer | Brand/manufacturer |
| Model | Model number |
| Condition | New/Used/Refurbished |
| Location | Storage location |
| Serial Numbers | For tracked items |
| Warranty | Warranty period (months) |
| Reorder Level | Low stock alert threshold |
| Reorder Quantity | Amount to reorder |
| Description | Product description |
| Is Featured | Show on homepage |
| Is Active | Visible to customers |

**Important**: All products must be assigned to a supplier. Products without a supplier cannot be saved.

3. Upload product image (max 200KB)
4. Click "Save"

### Editing Products
1. Find product in list
2. Click "Edit" button
3. Modify fields
4. Click "Save"

### Deleting Products
1. Find product
2. Click "Delete" (Admin only)
3. Confirm deletion

---

## Inventory Management

### Viewing Inventory
- See all products with stock levels
- Filter by category
- Search by name/SKU/barcode
- Low stock items highlighted

### Stock Adjustment

#### Adding Stock
1. Click "Quick Stock Entry"
2. Search for product
3. Enter quantity to add
4. Select location
5. Add notes (optional)
6. Click "Add Stock"

#### Reducing Stock
1. Click "Quick Stock Entry"
2. Toggle to "Remove Stock"
3. Search for product
4. Enter quantity to remove
5. Select reason:
   - Damage
   - Adjustment
   - Return
6. Click "Remove Stock"

### Stock Locations
Products can be stored in different locations:
- Main Warehouse
- Store Front
- Custom locations (set up in Settings)

**Important**: When items are moved to "Store Front", they automatically become visible in the customer shop.

### Serial Number Tracking
For high-value items:
1. Each unit has unique serial number
2. Track status: In Stock, Sold, Reserved, Returned
3. Track location and condition
4. Full history of each unit

---

## Stock Receiving

### When Stock Arrives from Supplier

#### Step 1: Select Purchase Order
1. Go to Stock Receiving
2. Select pending purchase order from dropdown
3. Supplier info auto-fills

#### Step 2: Add Received Items

**Method A - Manual Barcode Entry**:
1. Type the barcode number in the barcode field
2. Click "Search" or press Enter
3. Product is found and ready to add
4. Enter quantity received

**Method B - Camera Barcode Scanning**:
1. Click the camera/scan icon next to barcode field
2. Allow camera access
3. Point camera at product barcode
4. Barcode auto-fills when scanned
5. Enter quantity received

**Method C - Product Search**:
1. Search for product by name
2. Select from results
3. Enter quantity received

#### Step 3: Specify Details
For each item:
- Quantity received
- Location (where to store)
- Condition (New/Used)
- Unit cost (if different from PO)

#### Step 4: Process Receipt
1. Review all items
2. Click "Receive Stock"
3. Inventory automatically updated
4. Purchase order marked as received

---

## Sales Tracking

### Viewing Sales History
1. Go to Sales page
2. View all transactions
3. Filter by:
   - Date range
   - Payment method
   - Staff member

### Sale Details
Click any sale to view:
- Full receipt
- Items sold
- Customer info
- Payment details
- Staff who processed

### Finding a Receipt

**By Receipt Number**:
1. Enter receipt number in search
2. Click search

**By Barcode/QR Code**:
1. Click barcode scanner
2. Scan receipt QR code
3. Receipt details display

### Processing Refunds

#### Full Refund
1. Find the sale
2. Click "Refund"
3. Select "Full Refund"
4. Enter reason
5. Confirm refund

#### Partial Refund
1. Find the sale
2. Click "Refund"
3. Select specific items to refund
4. Enter quantities
5. Enter reason
6. Confirm refund

**Note**: Stock is automatically restored for refunded items.

---

## Customer Management

### Adding a Customer
1. Go to Customers
2. Click "Add Customer"
3. Fill in:
   - Name (required)
   - Email
   - Phone
   - Company
   - Notes
4. Click "Save"

### Editing Customer
1. Find customer in list
2. Click "Edit"
3. Update information
4. Click "Save"

### Customer History
Click customer to view:
- Purchase history
- Total spent
- Inquiries made

---

## Supplier Management

### Adding a Supplier
1. Go to Suppliers
2. Click "Add Supplier"
3. Fill in:
   - Name (required)
   - Contact Person
   - Email
   - Phone
   - Address
   - Notes
4. Click "Save"

### Managing Suppliers
- Edit supplier details
- View payment history
- See purchase orders
- Deactivate inactive suppliers

### Recording Supplier Payments

When you pay a supplier:

1. Go to Suppliers page
2. Click "Record Payment"
3. Fill in:

| Field | Description |
|-------|-------------|
| Supplier | Select supplier |
| Amount | Payment amount (UGX) |
| Payment Method | Cash/Bank Transfer/Mobile Money |
| Payment Source | Cash Register or Bank |
| Bank Name | If bank payment |
| Reference Number | Transaction reference |
| Purchase Order | Link to PO (optional) |
| Notes | Additional info |

4. Click "Record Payment"
5. Receipt is generated with QR code

**Important**: Payment is deducted from specified source (cash register or bank).

---

## Purchase Orders

### Creating a Purchase Order

#### Step 1: Start New Order
1. Go to Purchase Orders
2. Click "New Order"

#### Step 2: Select Supplier
- Choose from dropdown
- Supplier info auto-fills

#### Step 3: Add Items

**Search by Barcode**:
1. Enter product barcode in the barcode search field
2. Click "Search" - product auto-fills if found
3. Enter quantity needed
4. Enter unit cost
5. Click "Add Item"

**Search by Name**:
1. Type product name in the product search field
2. Select product from dropdown
3. Enter quantity and unit cost
4. Click "Add Item"

The items table displays product name, **barcode** (for easy verification), quantity, unit cost, and total.

#### Step 4: Review & Submit
1. Review all items (verify barcodes match physical products)
2. Check total amount
3. Add notes if needed
4. Click "Create Order"

**Note**: New orders start with "Awaiting Delivery" status (supplier already paid).

### Purchase Order Status

| Status | Meaning |
|--------|---------|
| Awaiting Delivery | Paid, waiting for supplier |
| Partially Received | Some items received |
| Received | All items received |
| Cancelled | Order cancelled |

### Receiving Orders
See [Stock Receiving](#stock-receiving) section.

---

## Expenses Tracking

### Recording an Expense

1. Go to Expenses
2. Click "Add Expense"
3. Fill in:

| Field | Description |
|-------|-------------|
| Description | What the expense is for |
| Amount | Expense amount (UGX) |
| Category | Type of expense |
| Payment Method | How it was paid |
| Payment Source | Cash Register or Bank |
| Date | When expense occurred |
| Notes | Additional details |

4. Upload receipt image (optional)
5. Click "Save"

### Expense Categories
- Utilities
- Rent
- Salaries
- Supplies
- Transport
- Marketing
- Maintenance
- Other

### Viewing Expenses
- Filter by date range
- Filter by category
- Filter by payment source
- View totals and breakdown

---

## Banking & Deposits

### Cash Register

#### Daily Operations
1. Go to Banking
2. View today's cash register:
   - Opening balance
   - Total sales (cash)
   - Total expenses (from cash)
   - Current balance

#### Starting a New Day
1. Enter opening balance
2. Confirm previous day's closing

### Recording Bank Deposits

When owner takes cash to the bank:

1. Go to Banking
2. Click "New Deposit"
3. Fill in:
   - Amount deposited
   - Bank name
   - Account number
   - Deposit date
   - Reference number
   - Notes
4. Click "Record Deposit"

**Effect**: Cash register balance is reduced by deposit amount.

### Deposit History
- View all deposits
- Filter by date
- Filter by bank
- Export records

---

## Reports

### Available Reports

#### Income Statement (Profit & Loss)
Shows:
- Total sales revenue
- Cost of goods sold
- Gross profit
- Operating expenses
- Net profit/loss

#### Balance Sheet
Shows:
- Assets (inventory value, cash, bank)
- Liabilities
- Equity

### Generating Reports

1. Go to Reports
2. Select report type
3. Choose date range:
   - Today
   - This Week
   - This Month
   - Custom Range
4. Click "Generate"
5. View or print report

### Report Features
- Detailed breakdown by category
- Comparison with previous period
- Export to PDF
- Print directly

---

## Inquiries

### Viewing Inquiries
1. Go to Inquiries
2. See all customer inquiries
3. Filter by status:
   - New
   - In Progress
   - Responded
   - Closed

### Managing an Inquiry

1. Click on inquiry
2. View details:
   - Customer info
   - Product interested in
   - Message
   - Date received

3. Update status as you handle it
4. Add internal notes
5. Assign to staff member (optional)

### Inquiry Workflow
1. **New**: Just received
2. **In Progress**: Being handled
3. **Responded**: Customer contacted
4. **Closed**: Resolved

---

## Barcode System

### Product Barcodes

#### Scanning in POS
1. Click barcode icon in POS
2. Point camera at barcode
3. Product adds to cart automatically

#### Scanning for Stock
1. In Inventory, click barcode icon
2. Scan product
3. View/adjust stock

### Receipt QR Codes

Every receipt has a QR code that:
- Links to receipt details
- Makes refunds easier
- Helps customer reference purchases

#### Scanning Receipt QR
1. In Sales page, click barcode icon
2. Scan QR code on receipt
3. Receipt details display immediately

---

## Staff Management

**(Admin Only)**

### Adding Staff

1. Go to Staff Management
2. Click "Add Staff"
3. Fill in:
   - Email
   - Password
   - Full Name
   - Role (Admin/Staff)
4. For Staff role, select allowed pages
5. Click "Create User"

### Page Permissions

Staff can be given access to specific pages:

| Page | What They Can Do |
|------|-----------------|
| Dashboard | View overview |
| Point of Sale | Process sales |
| Products | Manage products |
| Inventory | Manage stock |
| Stock Receiving | Receive shipments |
| Sales | View sales history |
| Customers | Manage customers |
| Suppliers | Manage suppliers |
| Purchase Orders | Create/manage POs |
| Expenses | Record expenses |
| Banking | Banking operations |
| Reports | View reports |
| Inquiries | Handle inquiries |
| Barcodes | Use barcode tools |

### Managing Staff
- Edit staff details
- Change permissions
- Deactivate accounts
- Reset passwords

---

## Site Appearance

**(Admin Only)**

### Customizing the Shop

1. Go to Site Appearance
2. Tabs available:
   - Theme
   - Hero Section
   - Categories

### Theme Settings
- Primary color
- Secondary color
- Accent colors
- Font choices

### Hero Section
Edit the main banner:
- Title text
- Subtitle
- Button text
- Background image

### Categories
Manage product categories:
- Add new categories
- Edit category names
- Set display order
- Hide/show categories

---

## Settings

### Account Settings
- Update your profile
- Change password
- Manage preferences

### Receipt Settings
Customize receipt content:

| Setting | Description |
|---------|-------------|
| Business Name | Your business name |
| Address | Business address |
| Phone | Contact number |
| Email | Contact email |
| Tax ID | Tax registration |
| Show Logo | Display logo on receipt |
| Show Tax | Show tax breakdown |
| Footer Message | Custom footer text |

### Printer Settings
Configure printing:

| Setting | Description |
|---------|-------------|
| Printer Type | Browser or Thermal |
| Paper Width | 58mm, 80mm, or A4 |
| Auto Print | Print automatically after sale |
| Open Cash Drawer | Send drawer open command |

### Storage Locations
Manage inventory locations:
1. Add new locations
2. Edit location names
3. Activate/deactivate locations
4. Set as default

---

## Data Backup

**(Admin Only)**

### Creating a Backup

1. Go to Data Backup
2. Select tables to include:
   - Products
   - Customers
   - Sales
   - Expenses
   - Suppliers
   - Purchase Orders
   - Inventory Transactions
   - Serial Units
   - Site Settings
   - And more...

3. Click "Select All" for full backup
4. Click "Create Backup"
5. Wait for process to complete
6. Click "Download Backup"

### Backup File
- Format: JSON
- Filename: `fady-technologies-backup-YYYY-MM-DD.json`
- Contains all selected data
- Store securely for recovery

---

## Quick Reference

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search | Ctrl/Cmd + K |
| New Sale | (from POS) |
| Toggle Theme | Click sun/moon icon |

### Common Workflows

#### Daily Opening
1. Log in
2. Go to Banking
3. Enter opening cash balance
4. Check low stock alerts
5. Review pending inquiries

#### Processing Walk-in Sale
1. Go to POS
2. Scan/search products
3. Add to cart
4. Select payment method
5. Complete sale
6. Print receipt

#### Receiving Supplier Stock
1. Go to Stock Receiving
2. Select purchase order
3. Scan received items
4. Process receipt
5. Verify inventory updated

#### End of Day
1. Review day's sales
2. Count cash register
3. Record any discrepancies
4. Record bank deposit if made
5. Check pending orders

---

## Troubleshooting

### Common Issues

**Can't log in?**
- Check email/password
- Contact admin for password reset

**Product not showing in shop?**
- Check "Is Active" is enabled
- Ensure stock quantity > 0
- Check if in "Store Front" location

**Barcode not scanning?**
- Ensure good lighting
- Hold steady
- Try manual entry

**Receipt not printing?**
- Check printer connection
- Verify printer settings
- Try browser print

**Stock levels incorrect?**
- Check recent transactions
- Review inventory adjustments
- Look for pending stock receipts

---

## Support

For technical support or issues with the system, contact:

**Earn - System Developer**
- Website: [kabejjasystems.store](https://kabejjasystems.store)

---

*Last Updated: December 2024*
*Version: 1.1*

### Version History
- **v1.1** (Dec 2024): Updated product supplier requirement, improved barcode scanning in Stock Receiving and Purchase Orders
- **v1.0** (Dec 2024): Initial release
