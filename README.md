# Inventory Automation & Consumption Analytics for PCB Manufacturing

Full-stack MVP for automated PCB component inventory deduction, low-stock procurement alerts, and analytics dashboards.

## Tech Stack
- Frontend: React + Vite + Recharts
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: JWT
- File Processing: xlsx + exceljs

## Project Structure
- `/backend` - API, auth, business logic, Excel import/export, Postgres integration
- `/frontend` - Dashboard UI with protected routes and analytics charts
- `/backend/sql/schema.sql` - Database schema
- `/data` - place source Excel files here for seed import

## Required Data Files
Place these files in `/Users/saisandeepshivalkar/Documents/New project/data`:
- `Atomberg Data.xlsm`
- `Bajaj PCB Dec 25 Data.xlsm`

Also supported:
- `.xlsx`
- `.xls`

## Backend Setup
1. Create PostgreSQL DB (example name: `pcb_inventory`).
2. In `/backend`, create `.env` from `.env.example`.
3. Install dependencies:
   - `npm install`
4. Initialize schema:
   - `npm run init-db`
5. Seed admin user:
   - `npm run seed-admin`
6. Optional import seed data from `/data`:
   - `npm run import-seed`
7. Start backend:
   - `npm run dev`

Backend URL: `http://localhost:5000`

## Frontend Setup
1. In `/frontend`, create `.env` from `.env.example`.
2. Install dependencies:
   - `npm install`
3. Start frontend:
   - `npm run dev`

Frontend URL: `http://localhost:5173`

## Default Admin Login
- Email: `admin@pcb.com`
- Password: `admin123`

## Core Features Implemented
1. **Excel Data Integration**
- Upload endpoint: `POST /api/excel/import`
- Parses workbook sheets and auto-detects:
  - components/inventory rows
  - PCB-component mapping rows
  - production rows
- Stores/updates records in PostgreSQL.

2. **Inventory Management**
- CRUD endpoints for components.
- Search/filter by name/part.
- Real-time stock changes after production processing.

3. **PCB-Component Mapping**
- Stores quantity-per-PCB relationships.
- Used by deduction engine on each production entry.

4. **Automatic Stock Deduction**
- Endpoint: `POST /api/production`
- For each production entry:
  - validates stock sufficiency
  - deducts mapped component quantities
  - records inventory transactions
  - blocks negative inventory

5. **Low Stock & Procurement Alerts**
- Trigger when `current_stock < 20% of monthly_required_quantity`.
- Creates/updates open alerts.
- Auto-resolves alerts when stock recovers.

6. **Analytics Dashboard**
- KPI cards: total components, PCB models, open alerts, total production.
- Top consumed components (bar chart).
- Monthly production vs consumption trend (line chart).
- Low-stock list.

7. **Excel Export**
- Endpoint: `GET /api/analytics/export`
- Exports components, transactions, production report workbook.

8. **JWT Authentication**
- Endpoints:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
- Protected APIs for inventory, production, analytics, and import.

## API Overview
- Auth: `/api/auth/*`
- Components: `/api/components/*`
- PCB Models + Mapping: `/api/pcb/*`
- Production + Consumption History: `/api/production/*`
- Analytics + Alerts + Export: `/api/analytics/*`
- Excel Import: `/api/excel/import`

## Demo Flow (Hackathon)
1. Login as admin.
2. Upload Excel files from `Excel Upload` page.
3. View imported components and mappings.
4. Add a production entry in `PCB Production Entry`.
5. Watch stock auto-deduct in `Components` and transactions in `Consumption History`.
6. Open `Dashboard` / `Analytics & Reports` to verify low-stock alerts and charts.

## Notes About Uploaded Files
The two files currently present in this workspace are PDFs:
- `/Users/saisandeepshivalkar/Documents/New project/Atomberg_Data.pdf`
- `/Users/saisandeepshivalkar/Documents/New project/Bajaj_PCB_Dec_25_Data.pdf`

To execute real Excel ingestion, please place the original `.xlsm`/`.xlsx` files in `/data` or upload them from UI.
