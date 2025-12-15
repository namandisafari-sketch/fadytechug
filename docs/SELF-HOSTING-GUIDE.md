# Self-Hosting Guide: Fady Technologies on Linode

This guide walks you through deploying Fady Technologies on your own Linode server with a self-hosted PostgreSQL database.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Server Setup](#step-1-set-up-your-linode-server)
4. [Install Required Software](#step-2-install-required-software)
5. [Configure PostgreSQL](#step-3-configure-postgresql)
6. [Deploy the Application](#step-4-deploy-the-application)
7. [Configure Nginx](#step-5-configure-nginx)
8. [SSL Certificate](#step-6-ssl-certificate-https)
9. [Firewall Configuration](#step-7-firewall-configuration)
10. [Import Your Data](#step-8-import-your-data)
11. [Database Backups](#step-9-database-backups-automated)
12. [Modifying for Self-Hosting](#step-10-modifying-the-app-for-self-hosting)
13. [File Storage](#step-11-file-storage-setup)
14. [Troubleshooting](#troubleshooting)
15. [Security Checklist](#security-checklist)

---

## Prerequisites

- A Linode account (or any VPS provider)
- Domain name (optional but recommended)
- Basic command line knowledge
- Node.js 18+ familiarity

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Linode VPS                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Nginx     │  │  Node.js    │  │    PostgreSQL       │  │
│  │  (Reverse   │→ │  (Vite      │→ │    (Database)       │  │
│  │   Proxy)    │  │   Build)    │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                          ↓                                   │
│                   ┌─────────────┐                            │
│                   │   Local     │                            │
│                   │   Storage   │                            │
│                   │  (uploads)  │                            │
│                   └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Set Up Your Linode Server

### 1.1 Create a Linode Instance

1. Log into Linode Dashboard
2. Create a new Linode:
   - **Image**: Ubuntu 22.04 LTS
   - **Region**: Choose closest to your users
   - **Plan**: Shared CPU - Linode 4GB (recommended minimum)
   - **Label**: fady-technologies
   - **Root Password**: Set a strong password

### 1.2 Initial Server Setup

SSH into your server:

```bash
ssh root@your_server_ip
```

Update the system:

```bash
apt update && apt upgrade -y
```

Create a non-root user:

```bash
adduser fadytech
usermod -aG sudo fadytech
su - fadytech
```

## Step 2: Install Required Software

### 2.1 Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x
```

### 2.2 Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.3 Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.4 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## Step 3: Configure PostgreSQL

### 3.1 Create Database and User

```bash
sudo -u postgres psql
```

In PostgreSQL shell:

```sql
-- Create database
CREATE DATABASE fady_technologies;

-- Create user with password
CREATE USER fady_admin WITH ENCRYPTED PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE fady_technologies TO fady_admin;

-- Connect to the database
\c fady_technologies

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO fady_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fady_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fady_admin;

\q
```

### 3.2 Configure PostgreSQL for Remote Access (Optional)

Edit `/etc/postgresql/14/main/postgresql.conf`:

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Find and modify:

```
listen_addresses = 'localhost'  # Keep as localhost for security
```

### 3.3 Import Your Database Schema

Create the schema file `/home/fadytech/schema.sql`:

```sql
-- Users and Authentication
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    page_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    unit_cost NUMERIC DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    sku TEXT,
    barcode TEXT,
    manufacturer TEXT,
    model TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    location TEXT,
    condition TEXT DEFAULT 'new',
    reorder_level INTEGER DEFAULT 5,
    reorder_quantity INTEGER DEFAULT 10,
    warranty_months INTEGER,
    weight_kg NUMERIC,
    dimensions TEXT,
    serial_numbers TEXT[],
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT,
    subtotal NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    amount_paid NUMERIC DEFAULT 0,
    change_given NUMERIC DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    sold_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    status TEXT DEFAULT 'awaiting_delivery',
    total_amount NUMERIC DEFAULT 0,
    notes TEXT,
    ordered_by UUID REFERENCES profiles(id),
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC NOT NULL,
    total_cost NUMERIC NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Payments
CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    amount NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'bank_transfer',
    payment_source TEXT DEFAULT 'bank',
    bank_name TEXT,
    reference_number TEXT,
    payment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    paid_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    transaction_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    unit_cost NUMERIC,
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS serial_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    serial_number TEXT NOT NULL,
    status TEXT DEFAULT 'in_stock',
    condition TEXT DEFAULT 'new',
    location TEXT,
    supplier_id UUID REFERENCES suppliers(id),
    purchase_date DATE,
    purchase_cost NUMERIC,
    customer_id UUID REFERENCES customers(id),
    sale_id UUID REFERENCES sales(id),
    sold_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS serial_unit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_unit_id UUID NOT NULL REFERENCES serial_units(id),
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    previous_location TEXT,
    new_location TEXT,
    notes TEXT,
    performed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage Locations
CREATE TABLE IF NOT EXISTS storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash',
    payment_source TEXT DEFAULT 'cash_register',
    receipt_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banking
CREATE TABLE IF NOT EXISTS bank_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC NOT NULL,
    deposit_date DATE NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT,
    reference_number TEXT,
    notes TEXT,
    deposited_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    opening_balance NUMERIC DEFAULT 0,
    total_sales NUMERIC DEFAULT 0,
    total_expenses NUMERIC DEFAULT 0,
    total_refunds NUMERIC DEFAULT 0,
    total_deposits NUMERIC DEFAULT 0,
    closing_balance NUMERIC DEFAULT 0,
    closed_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id),
    receipt_number TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    items_returned JSONB,
    refunded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB DEFAULT '{}',
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_company TEXT,
    product_id UUID REFERENCES products(id),
    message TEXT,
    status TEXT DEFAULT 'new',
    priority TEXT DEFAULT 'normal',
    notes TEXT,
    assigned_to UUID REFERENCES profiles(id),
    customer_id UUID REFERENCES customers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_receipt_number ON sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_serial_units_product ON serial_units(product_id);
CREATE INDEX IF NOT EXISTS idx_serial_units_serial_number ON serial_units(serial_number);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id);

-- Helper Functions
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  receipt_num TEXT;
  today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM sales
  WHERE DATE(created_at) = CURRENT_DATE;
  
  receipt_num := 'RCP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0');
  RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_num TEXT;
  today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM purchase_orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  order_num := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;
```

Import the schema:

```bash
sudo -u postgres psql -d fady_technologies -f /home/fadytech/schema.sql
```

## Step 4: Deploy the Application

### 4.1 Clone and Build

```bash
cd /home/fadytech
git clone https://github.com/your-repo/fady-technologies.git
cd fady-technologies
npm install
```

### 4.2 Configure Environment

Create `.env` file:

```bash
nano .env
```

Add your configuration:

```env
# Database Connection
DATABASE_URL=postgresql://fady_admin:your_secure_password_here@localhost:5432/fady_technologies

# App Configuration
VITE_APP_NAME="Fady Technologies"
VITE_APP_URL="https://your-domain.com"

# File Storage
VITE_UPLOAD_DIR="/home/fadytech/uploads"
VITE_MAX_FILE_SIZE=200000

# For authentication (if using external auth service)
# VITE_AUTH_SECRET=your_auth_secret
```

### 4.3 Build the Application

```bash
npm run build
```

### 4.4 Set Up PM2

```bash
pm2 start npm --name "fady-tech" -- run preview
pm2 save
pm2 startup
```

## Step 5: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/fady-technologies
```

Add the configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Max upload size (for product images)
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:4173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files
    location /uploads {
        alias /home/fadytech/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/fady-technologies /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: SSL Certificate (HTTPS)

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 7: Firewall Configuration

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Step 8: Import Your Data

### 8.1 From Lovable Backup

1. Download your backup JSON from the Data Backup page in admin panel
2. Transfer to server:

```bash
scp fady-backup-2025-01-15.json fadytech@your_server_ip:/home/fadytech/
```

3. Create import script `/home/fadytech/import-backup.js`:

```javascript
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function importBackup(filePath) {
  const backup = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Import order matters due to foreign key constraints
  const tableOrder = [
    'profiles',
    'user_roles',
    'page_permissions',
    'storage_locations',
    'suppliers',
    'customers',
    'products',
    'sales',
    'sale_items',
    'purchase_orders',
    'purchase_order_items',
    'supplier_payments',
    'inventory_transactions',
    'serial_units',
    'serial_unit_history',
    'expenses',
    'bank_deposits',
    'cash_register',
    'refunds',
    'site_settings',
    'inquiries'
  ];
  
  for (const tableName of tableOrder) {
    const records = backup.tables[tableName];
    if (!records || records.length === 0) continue;
    
    console.log(`Importing ${records.length} records into ${tableName}...`);
    
    for (const record of records) {
      const columns = Object.keys(record);
      const values = Object.values(record);
      const placeholders = values.map((_, i) => `$${i + 1}`);
      
      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        ON CONFLICT DO NOTHING
      `;
      
      try {
        await pool.query(query, values);
      } catch (err) {
        console.error(`Error in ${tableName}:`, err.message);
      }
    }
  }
  
  console.log('Import complete!');
  pool.end();
}

importBackup(process.argv[2]);
```

4. Run the import:

```bash
npm install pg
node import-backup.js fady-backup-2025-01-15.json
```

## Step 9: Database Backups (Automated)

Create backup script `/home/fadytech/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/fadytech/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="fady_technologies_$DATE.sql"

mkdir -p $BACKUP_DIR
pg_dump -U fady_admin fady_technologies > "$BACKUP_DIR/$FILENAME"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup created: $FILENAME"
```

Make it executable and schedule:

```bash
chmod +x /home/fadytech/backup.sh
crontab -e
# Add: 0 2 * * * /home/fadytech/backup.sh
```

## Step 10: Modifying the App for Self-Hosting

### 10.1 Replace Supabase Client

Create `src/lib/db.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: import.meta.env.VITE_DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const db = {
  from: (table: string) => ({
    select: async (columns = '*') => {
      const result = await query(`SELECT ${columns} FROM ${table}`);
      return { data: result.rows, error: null };
    },
    insert: async (data: any) => {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`);
      const result = await query(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
        values
      );
      return { data: result.rows[0], error: null };
    },
    update: async (data: any) => ({
      eq: async (column: string, value: any) => {
        const updates = Object.entries(data).map(([k, v], i) => `${k} = $${i + 1}`);
        const values = [...Object.values(data), value];
        const result = await query(
          `UPDATE ${table} SET ${updates.join(', ')} WHERE ${column} = $${values.length} RETURNING *`,
          values
        );
        return { data: result.rows, error: null };
      }
    }),
    delete: async () => ({
      eq: async (column: string, value: any) => {
        const result = await query(`DELETE FROM ${table} WHERE ${column} = $1`, [value]);
        return { data: result.rows, error: null };
      }
    })
  })
};
```

### 10.2 Authentication Options

For self-hosted authentication, consider:

1. **Passport.js** with local strategy
2. **Auth.js** (formerly NextAuth)
3. **Lucia Auth** - lightweight auth library
4. **Custom JWT implementation**

## Step 11: File Storage Setup

### 11.1 Create Upload Directory

```bash
mkdir -p /home/fadytech/uploads/products
chmod 755 /home/fadytech/uploads
```

### 11.2 Local File Upload Handler

Create an Express endpoint or similar for file uploads:

```javascript
// server/upload.js
const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: '/home/fadytech/uploads/products',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, `${uniqueName}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 }, // 200KB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const publicUrl = `${process.env.VITE_APP_URL}/uploads/products/${req.file.filename}`;
  res.json({ url: publicUrl });
});

module.exports = router;
```

---

## System Features Reference

### Core Features

| Feature | Description |
|---------|-------------|
| Point of Sale | Process in-store sales with barcode scanning |
| Products | Full product catalog management |
| Inventory | Stock tracking with serial numbers |
| Sales | Complete sales history and receipts |
| Customers | Customer database management |
| Suppliers | Supplier and payment tracking |
| Purchase Orders | Order and receive stock |
| Expenses | Business expense tracking |
| Banking | Cash register and bank deposits |
| Reports | Financial reports and analytics |

### Image Handling

The application includes automatic image compression:
- **Maximum size**: 200KB per image
- **Auto-compression**: Images larger than 200KB are automatically compressed
- **Supported formats**: JPG, PNG, WebP, GIF
- **Output format**: Compressed images are converted to JPEG for optimal size

### Receipt & Barcode Features

- QR codes on receipts link to receipt details
- Barcode scanning for products in POS
- Receipt barcode scanning for quick lookup

### Thermal Printer Support

Configure in Settings → Printer:
- Browser printing (standard)
- Thermal printer support (58mm, 80mm paper)
- Auto-print after sale
- Cash drawer opening command

### Storage Locations

Manage inventory locations in Settings → Locations:
- Create custom storage locations
- Track stock across multiple locations
- "Store Front" location auto-publishes products

---

## Troubleshooting

### Common Issues

1. **Connection refused to PostgreSQL**
   - Check if PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify connection string in `.env`

2. **502 Bad Gateway**
   - Check if Node.js app is running: `pm2 status`
   - Check logs: `pm2 logs fady-tech`

3. **Permission denied**
   - Ensure proper file ownership: `chown -R fadytech:fadytech /home/fadytech`

4. **Images not uploading**
   - Check upload directory permissions
   - Verify Nginx client_max_body_size
   - Check disk space: `df -h`

5. **Receipt not printing**
   - Verify browser print settings
   - For thermal printers, check USB/serial connection
   - Test with browser print first

### Useful Commands

```bash
# View app logs
pm2 logs fady-tech

# Restart app
pm2 restart fady-tech

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check disk space
df -h

# Check memory usage
free -m

# Monitor system resources
htop
```

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Enabled UFW firewall
- [ ] SSL certificate installed
- [ ] Regular backups configured
- [ ] Fail2ban installed for brute-force protection
- [ ] Non-root user for app management
- [ ] Environment variables secured
- [ ] Upload directory properly secured
- [ ] Database user has minimal required privileges
- [ ] Nginx security headers configured

## Support

For issues specific to this deployment, check:
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Linode documentation: https://www.linode.com/docs/
- Nginx documentation: https://nginx.org/en/docs/

For system-specific help:
- Developer contact: [kabejjasystems.store](https://kabejjasystems.store)

---

*Last updated: December 2024*
*System Version: 1.0*
