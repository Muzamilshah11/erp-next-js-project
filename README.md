# ERP Pro — Enterprise Resource Planning System

A modern, full-stack ERP system built with **Next.js 16**, **React 19**, **TypeScript**, and **PostgreSQL (NeonDB)**. Features finance, sales, inventory, and HR management modules with a professional dark-themed UI.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Frontend | React 19, TypeScript, Tailwind CSS 4 |
| UI Kit | shadcn/ui, Framer Motion, Recharts |
| ORM | Prisma 7 |
| Database | PostgreSQL (NeonDB) |
| Auth | JWT (jose) with HTTP-only cookies |
| Styling | Tailwind CSS 4, Dark theme |

## Modules

### Finance
- **Chart of Accounts** — Manage general ledger accounts (Asset, Liability, Equity, Revenue, Expense)
- **Journal Entries** — Record double-entry transactions with debit/credit lines
- **General Ledger** — View transaction history per account with running balance
- **Bank Reconciliation** — Match bank statement entries with ledger records
- **Financial Reports** — Generate Trial Balance, Income Statement, and Balance Sheet

### Sales
- **Customers** — Manage customer relationships and track sales/balances
- **Invoices** — Create and manage sales invoices with status tracking

### Inventory
- **Items** — Track stock levels, reorder thresholds, and inventory valuation

### Human Resources
- **Employees** — Manage employee records, departments, and payroll

### Dashboard
- KPI cards (Revenue, Orders, Inventory Value, Active Customers)
- Revenue trend charts, inventory breakdown, sales analysis

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (or NeonDB account)

### Setup

```bash
# Clone the repository
git clone https://github.com/Muzamilshah11/erp-next-js-project.git
cd erp-next-js-project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Initialize database
npx prisma db push
npx prisma generate

# Start development server
npm run dev
```

Visit **http://localhost:3000** — You'll be prompted to register, then you can access all modules.

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
JWT_SECRET="your-secure-jwt-secret"
```

## Project Structure

```
├── app/                    # Next.js App Router pages & API
│   ├── api/                # REST API routes
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   └── (dashboard)/        # Protected dashboard pages
│       ├── dashboard/      # Main dashboard with KPIs & charts
│       ├── finance/        # Finance module
│       ├── sales/          # Sales module
│       ├── inventory/      # Inventory module
│       ├── hr/             # HR module
│       └── settings/       # System settings
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI components
│   ├── navigation/         # Sidebar & Header
│   ├── dashboard/          # Dashboard widgets
│   └── shared/             # Shared components (DataTable)
├── contexts/               # React contexts (Auth)
├── lib/                    # Utility functions & Prisma client
└── prisma/                 # Database schema & migrations
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get session |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Clear session |

### Finance
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/finance/accounts` | List/Create accounts |
| PUT/DELETE | `/api/finance/accounts/[id]` | Update/Delete account |
| GET/POST | `/api/finance/journal-entries` | List/Create entries |
| PUT/DELETE | `/api/finance/journal-entries/[id]` | Update/Delete entry |
| GET | `/api/finance/ledger?accountId=` | View account ledger |
| GET | `/api/finance/reports?type=` | Generate reports |
| GET/POST | `/api/finance/bank-transactions` | List/Create bank entries |
| PATCH | `/api/finance/bank-transactions/[id]/reconcile` | Toggle reconciled |

### Other Modules
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/hr/employees` | List/Create employees |
| GET/POST | `/api/sales/customers` | List/Create customers |
| GET/POST | `/api/sales/invoices` | List/Create invoices |
| GET/POST | `/api/inventory/items` | List/Create inventory items |
| GET | `/api/dashboard/stats` | Dashboard statistics |

## License

MIT
