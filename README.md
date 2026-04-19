# Spring Manufacturing PLM System

Product Lifecycle Management (PLM) platform for small-scale spring manufacturing, built as a modular monolith with a Flask REST API and a React dashboard client.

This README is aligned to the requirements defined in `client/SRS.md` and the architecture/agent boundaries documented in `AGENTS.md`.

## 1. What This System Does

The platform digitizes the end-to-end spring order lifecycle:

1. Enquiry creation and updates
2. Feasibility checks (material + machine availability)
3. Quotation generation, revision, acceptance/rejection
4. Order creation and lifecycle tracking
5. Production task planning and execution updates
6. Quality inspection and QC result recording
7. Invoice generation and payment updates
8. Shipment dispatch and customer delivery confirmation
9. Analytics dashboards (financials, production, raw-material forecasting)

## 2. Tech Stack

- Backend: Flask, Flask-RESTful, SQLAlchemy (SQLite), Flasgger (Swagger)
- Frontend: React 19, TypeScript, Vite, Redux Toolkit, shadcn/ui, Tailwind CSS
- Testing: Pytest (API-focused backend tests)

## 3. Repository Structure

```text
se-project-spring-dashboard/
	client/      # React + Vite frontend
	server/      # Flask API, models, resources, tests
	AGENTS.md    # logical module/agent boundaries
	README.md
```

## 4. Core Functional Coverage (SRS Traceability)

Status legend:
- Implemented: present in API and/or UI
- Partial: basic support exists, but not full end-to-end/business-complete behavior yet

### 4.1 Customer Requirements (SRS 3.1)

| SRS Requirement | Status | Implementation Notes |
|---|---|---|
| View quotations, pricing, timelines | Implemented | Enquiry/quotation views in customer dashboard + quotation APIs |
| Accept/reject quotations | Implemented | Quotation accept/reject flows exposed via API and UI actions |
| Confirm orders from accepted quotations | Implemented | Accepted quotation creates order (`/api/v1/quotations/<id>/accept`) |
| View order details and commitments | Implemented | Orders list/detail APIs and dashboard tables |
| Real-time delivery tracking | Partial | Shipment status tracking exists; polling/refresh based updates (not websocket real-time) |
| Accept/reject delivered goods + feedback | Implemented | Delivery endpoint supports status and customer feedback |

### 4.2 Spring Master Requirements (SRS 3.2)

| SRS Requirement | Status | Implementation Notes |
|---|---|---|
| Enquiry management | Implemented | Create, list, update enquiries |
| Feasibility validation | Implemented | Material/machine feasibility checks and status updates |
| Quotation generation/versioning/convert to order | Implemented | Quote create, revise (version increment), accept to order |
| Production planning | Implemented | Task scheduling, material reservation, machine list + maintenance status |
| Production execution | Partial | Task status workflow exists; advanced dynamic workflow customization is limited |
| Quality control + rejection reason | Implemented | QC report capture, approve/reject with rejection reason |
| Inventory management | Implemented | Materials, machines, finished goods summary endpoints |
| Invoice generation + override + audit | Implemented | Manual override and audit logging support |
| Delivery management | Implemented | Dispatch + delivery acceptance/rejection updates |
| Analytics/reporting dashboards | Implemented | Financial, production, and forecasting endpoints wired to dashboard |

### 4.3 Non-Functional Requirements (SRS 4.x)

| NFR | Current State |
|---|---|
| Performance | Suitable for small deployments; no formal latency benchmarking included |
| Scalability | SQLite + modular monolith; migration path to PostgreSQL noted in docs |
| Reliability/Data consistency | Relational model with transactional commits; targeted tests for key flows |
| Security | Role-based route guards in UI, session-backed auth endpoints in API |
| Maintainability | Modular resource files and action layers; clear agent boundaries in AGENTS.md |
| Auditability | Audit logs for key business events (quotation revisions, QC, invoice override) |

## 5. Backend API Modules

Base URL: `http://localhost:5000/api/v1`

- Auth: `/auth/register`, `/auth/login`, `/auth/logout`
- Enquiries: `/enquiries`, `/enquiries/<enquiry_id>`
- Feasibility: `/feasibility`
- Quotations: `/enquiries/<enquiry_id>/quotations`, `/quotations/<quote_id>/revise`, `/quotations/<quote_id>/accept`
- Orders: `/orders`, `/orders/<order_id>`
- Materials/Machines: `/materials`, `/machines`, `/machines/maintenance`, `/machines/<machine_id>/maintenance`
- Inventory: `/inventory`
- Production Tasks/QC: `/tasks`, `/tasks/<task_id>/status`, `/tasks/<task_id>/quality`
- Invoicing: `/orders/<order_id>/invoice`, `/invoices/<invoice_id>/pay`
- Shipment/Delivery: `/orders/<order_id>/shipment`, `/shipments`, `/shipments/<shipment_id>/delivery`
- Analytics: `/analytics/financials`, `/analytics/production`, `/analytics/raw-material-forecast`

Swagger UI: `http://localhost:5000/apidocs`

## 6. Local Setup

## 6.1 Prerequisites

- Python 3.11+ recommended
- Node.js 20+ and npm
- Git

## 6.2 Clone Repository

```bash
git clone https://github.com/23f1002393/se-project-spring-dashboard.git
cd se-project-spring-dashboard
```

## 6.3 Backend Setup (Flask)

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Backend runs at: `http://localhost:5000`

### Optional: Seed sample data

Stop the running backend first, then:

```bash
cd server
source .venv/bin/activate
python seed.py
python app.py
```

### Optional environment variables

- `SECRET_KEY` (recommended for session security)
- `MANAGER_EMAIL` (used by seed script)
- `MANAGER_PASSWORD` (used by seed script)

## 6.4 Frontend Setup (React)

```bash
cd client
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Production build

```bash
cd client
npm run build
```

## 7. Authentication and Roles

Supported roles:
- `manager` (Spring Master)
- `customer`

Route-level protection is implemented in the frontend for role-specific dashboards:
- Manager dashboard: `/manager`
- Customer dashboard: `/customer`

When using seeded data, default users include one manager and two customers.

## 8. Testing

Backend test suite:

```bash
cd server
source .venv/bin/activate
pytest -v
```

Test coverage includes enquiry, quotation, orders, tasks, quality/invoicing, shipment, analytics, forecasting, inventory, and audit flows.

## 9. Typical End-to-End Workflow

1. Customer creates enquiry
2. Manager runs feasibility check
3. Manager creates/revises quotation
4. Customer accepts quotation
5. System creates order
6. Manager schedules production task(s)
7. Manager updates execution status and submits QC report
8. System/manager generates invoice
9. Manager dispatches shipment
10. Customer confirms acceptance or rejection with feedback

## 10. Known Boundaries

- Database is SQLite by default (suitable for small-scale deployment)
- Some advanced enterprise workflows are simplified in this version
- Delivery/task updates are request-driven (no websocket event streaming)

## 11. Documentation References

- Product and module boundaries: `AGENTS.md`
- Requirements baseline: `client/SRS.md`
- API schema/docs source: `server/swagger.yaml`

## 12. Roadmap Alignment

The current codebase already aligns with the SRS roadmap in key areas (workflow traceability, analytics, auditability, modularity). Next evolution targets include:

- PostgreSQL migration
- Asynchronous workers for heavier workflows
- Real-time notifications
- External ERP/accounting integrations
