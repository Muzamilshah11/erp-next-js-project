# Sales Module — Complete Implementation Plan

## Goal
Make all 5 Sales sub-modules fully functional with Prisma models, API routes (CRUD + business logic), and polished frontend pages.

## Current State
- **Customers** & **Invoices**: Working with basic CRUD but need fixes
- **Quotations**, **Orders**, **Delivery Notes**: "Coming soon" placeholders only

---

## Step 1: Prisma Schema — 3 New Models

### Quotation
```prisma
model Quotation {
  id         String   @id @default(cuid())
  quoteNo    String   @unique
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  date       DateTime
  validUntil DateTime
  amount     Float
  status     String   @default("draft") // draft, sent, accepted, rejected, converted
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  items      QuotationItem[]
  orders     SalesOrder[]
}
model QuotationItem {
  id           String    @id @default(cuid())
  quotationId  String
  quotation    Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  description  String
  quantity     Int
  price        Float
}
```

### SalesOrder
```prisma
model SalesOrder {
  id            String   @id @default(cuid())
  orderNo       String   @unique
  quotationId   String?
  quotation     Quotation? @relation(fields: [quotationId], references: [id])
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id])
  date          DateTime
  deliveryDate  DateTime?
  amount        Float
  status        String   @default("draft") // draft, confirmed, processing, shipped, delivered, cancelled
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  items         SalesOrderItem[]
  invoices      Invoice[]
  deliveryNotes DeliveryNote[]
}
model SalesOrderItem {
  id          String     @id @default(cuid())
  orderId     String
  order       SalesOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  description String
  quantity    Int
  price       Float
}
```

### Invoice — add optional orderId + cascade on InvoiceItem
- Add `orderId String?` + `order SalesOrder? @relation(...)` to existing Invoice
- Add `onDelete: Cascade` to InvoiceItem → Invoice relation
- Add `onDelete: Cascade` to InvoiceItem.invoiceId

### DeliveryNote
```prisma
model DeliveryNote {
  id         String   @id @default(cuid())
  dnNo       String   @unique
  invoiceId  String?
  invoice    Invoice? @relation(fields: [invoiceId], references: [id])
  orderId    String?
  order      SalesOrder? @relation(fields: [orderId], references: [id])
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  date       DateTime
  status     String   @default("draft") // draft, packed, shipped, delivered
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  items      DeliveryNoteItem[]
}
model DeliveryNoteItem {
  id             String       @id @default(cuid())
  deliveryNoteId String
  deliveryNote   DeliveryNote @relation(fields: [deliveryNoteId], references: [id], onDelete: Cascade)
  description    String
  quantity       Int
  price          Float
}
```

Also update `Invoice` model:
- Add `orderId String?` field + relation to SalesOrder
- Add `onDelete: Cascade` on InvoiceItem → Invoice relation

---

## Step 2: Fix Customers Module

### API (`app/api/sales/customers/`)
- Add `GET /api/sales/customers/[id]` — single customer
- Add input validation (Zod schema for POST/PUT)
- Fix `GET` with try/catch
- Add search query param support (`?q=searchTerm`)

### Frontend (`app/(dashboard)/sales/customers/page.tsx`)
- Add **Edit button** that opens same form pre-filled → calls PUT
- Add **search bar** (filters customers client-side or via API)
- Add **loading skeleton** while fetching
- Add **error toast** on API failure
- Replace `window.confirm` with custom modal

---

## Step 3: Fix Invoices Module

### API (`app/api/sales/invoices/`)
- Add `GET /api/sales/invoices/[id]` — single invoice
- Fix invoice number generation (use transaction to prevent collision)
- Add Zod validation
- Add `orderId` to POST body handling

### Frontend (`app/(dashboard)/sales/invoices/page.tsx`)
- **Customer dropdown** (fetch customers, show name/email, store id)
- **Invoice items form** — dynamic rows with description, quantity, price
- **Amount auto-calculate** from items
- **Mark as Paid / Overdue** action buttons
- Fix **Download button** (wire up or hide if not implemented)

---

## Step 4: Build Quotations Module (Full CRUD)

### API Routes
- `GET /api/sales/quotations` — list all with customer include
- `POST /api/sales/quotations` — create with items
- `GET /api/sales/quotations/[id]` — single with items
- `PUT /api/sales/quotations/[id]` — update
- `DELETE /api/sales/quotations/[id]` — delete (cascade items)
- `POST /api/sales/quotations/[id]/convert-to-order` — creates SalesOrder from quotation

### Frontend (`app/(dashboard)/sales/quotations/page.tsx`)
- DataTable: Quote #, Customer, Date, Valid Until, Amount, Status
- New/Edit form: customer dropdown, date, validUntil, items (qty × price), auto amount
- Actions: Edit, Delete, Convert to Order (for accepted status), Send (mark sent)
- Status badges: draft (gray), sent (blue), accepted (green), rejected (red), converted (purple)

---

## Step 5: Build Orders Module (Full CRUD)

### API Routes
- `GET /api/sales/orders` — list all with customer + quotation include
- `POST /api/sales/orders` — create with items (optional quotationId)
- `GET /api/sales/orders/[id]` — single with relations
- `PUT /api/sales/orders/[id]` — update
- `DELETE /api/sales/orders/[id]` — delete
- `POST /api/sales/orders/[id]/convert-to-invoice` — creates Invoice from order

### Frontend (`app/(dashboard)/sales/orders/page.tsx`)
- DataTable: Order #, Customer, Date, Delivery Date, Amount, Status
- New/Edit form: customer dropdown, date, deliveryDate, optional quotation select, items
- Actions: Edit, Delete, Convert to Invoice
- Status badges: draft, confirmed, processing, shipped, delivered, cancelled

---

## Step 6: Build Delivery Notes Module (Full CRUD)

### API Routes
- `GET /api/sales/delivery-notes` — list all with customer + invoice + order include
- `POST /api/sales/delivery-notes` — create with items (optional invoiceId/orderId)
- `GET /api/sales/delivery-notes/[id]` — single
- `PUT /api/sales/delivery-notes/[id]` — update
- `DELETE /api/sales/delivery-notes/[id]` — delete

### Frontend (`app/(dashboard)/sales/delivery-notes/page.tsx`)
- DataTable: DN #, Customer, Date, Status
- New/Edit form: customer dropdown, date, optional invoice/order select, items
- Actions: Edit, Delete
- Status badges: draft, packed, shipped, delivered

---

## File Change Summary

### Prisma
- `prisma/schema.prisma` — add 6 new models, update 2 existing

### API (new files)
- `app/api/sales/quotations/route.ts`
- `app/api/sales/quotations/[id]/route.ts`
- `app/api/sales/quotations/[id]/convert-to-order/route.ts`
- `app/api/sales/orders/route.ts`
- `app/api/sales/orders/[id]/route.ts`
- `app/api/sales/orders/[id]/convert-to-invoice/route.ts`
- `app/api/sales/delivery-notes/route.ts`
- `app/api/sales/delivery-notes/[id]/route.ts`

### API (modify)
- `app/api/sales/customers/route.ts` — add search, validation
- `app/api/sales/customers/[id]/route.ts` — add GET
- `app/api/sales/invoices/route.ts` — add orderId, fix numbering
- `app/api/sales/invoices/[id]/route.ts` — add GET

### Frontend (replace files)
- `app/(dashboard)/sales/customers/page.tsx` — full rewrite with edit/search
- `app/(dashboard)/sales/invoices/page.tsx` — full rewrite with dropdown/items/lifecycle
- `app/(dashboard)/sales/quotations/page.tsx` — from placeholder to full CRUD
- `app/(dashboard)/sales/orders/page.tsx` — from placeholder to full CRUD
- `app/(dashboard)/sales/delivery-notes/page.tsx` — from placeholder to full CRUD

---

## Order of Implementation
1. Prisma schema changes + `npx prisma db push`
2. Customers fixes (API + frontend)
3. Quotations (API + frontend)
4. Orders (API + frontend)
5. Invoices fixes + orderId link (API + frontend)
6. Delivery Notes (API + frontend)
