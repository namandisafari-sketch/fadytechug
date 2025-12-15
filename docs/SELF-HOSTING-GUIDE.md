# Self-Hosting Guide: Fady Technologies on Linode

This guide walks you through deploying Fady Technologies on your own Linode server with a self-hosted PostgreSQL database.

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
    status TEXT DEFAULT 'pending',
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
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_serial_units_product ON serial_units(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
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
  
  for (const [tableName, records] of Object.entries(backup.tables)) {
    if (records.length === 0) continue;
    
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
```

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Enabled UFW firewall
- [ ] SSL certificate installed
- [ ] Regular backups configured
- [ ] Fail2ban installed for brute-force protection
- [ ] Non-root user for app management
- [ ] Environment variables secured

## Support

For issues specific to this deployment, check:
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Linode documentation: https://www.linode.com/docs/
- Nginx documentation: https://nginx.org/en/docs/

---

*Last updated: 2025-01-15*
