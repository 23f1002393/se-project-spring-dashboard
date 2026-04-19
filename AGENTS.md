# AGENTS.md

## Product Lifecycle Management (PLM) System – Spring Manufacturing

---

## 1. Purpose

This document defines the responsibilities, structure, and interaction patterns of all logical “agents” (modules/services/components) within the PLM system. It serves as a reference for development, maintenance, and future scaling of the platform.

The system is built using:

* **Backend:** Flask + Flask-RESTful + SQLite3
* **Frontend:** React + shadcn/ui
* **Architecture Style:** RESTful, modular monolith (with potential for microservices migration)

---

## 2. System Overview

The system consists of two primary user roles:

* **Customer (External)**
* **Spring Master (Internal Super-User)**

All functionality is handled through modular backend resources and corresponding frontend components.

Agents represent logical service boundaries mapped to:

* API Resources (Flask)
* Frontend Feature Modules (React)
* Data Entities (SQLite)

---

## 3. Agent Classification

### 3.1 Core Business Agents

#### 3.1.1 Enquiry Agent

**Responsibilities:**

* Create and manage customer enquiries
* Store product specifications
* Maintain enquiry lifecycle state

**Backend Mapping:**

* `/api/enquiries`

**Key Operations:**

* POST: Create enquiry
* GET: Retrieve enquiries
* PUT: Update enquiry

---

#### 3.1.2 Feasibility Agent

**Responsibilities:**

* Validate:

  * Material availability
  * Machine capacity
  * Production load
* Provide feasibility decision for quotation

**Backend Mapping:**

* `/api/feasibility`

**Key Operations:**

* POST: Run feasibility check
* GET: Fetch feasibility status

---

#### 3.1.3 Quotation Agent

**Responsibilities:**

* Generate quotations
* Maintain version control
* Handle negotiation revisions
* Convert quotations to orders

**Backend Mapping:**

* `/api/quotations`

**Key Operations:**

* POST: Create quotation
* PUT: Revise quotation
* POST: Convert to order

---

#### 3.1.4 Order Agent

**Responsibilities:**

* Manage confirmed production orders
* Store finalized commercial details

**Backend Mapping:**

* `/api/orders`

---

#### 3.1.5 Production Planning Agent

**Responsibilities:**

* Allocate machines
* Reserve raw materials
* Schedule production
* Set deadlines and detect risks

**Backend Mapping:**

* `/api/production/planning`

---

#### 3.1.6 Production Execution Agent

**Responsibilities:**

* Define workflows for spring types
* Track production stages
* Update real-time progress

**Backend Mapping:**

* `/api/production/execution`

---

#### 3.1.7 Quality Control Agent

**Responsibilities:**

* Record inspection data
* Approve/reject products
* Trigger rework workflows

**Backend Mapping:**

* `/api/quality`

---

#### 3.1.8 Inventory Agent

**Responsibilities:**

* Track raw materials
* Track finished goods
* Maintain stock consistency

**Backend Mapping:**

* `/api/inventory`

---

#### 3.1.9 Invoice Agent

**Responsibilities:**

* Generate invoices post-QC approval
* Handle manual pricing overrides
* Maintain audit logs

**Backend Mapping:**

* `/api/invoices`

---

#### 3.1.10 Delivery Agent

**Responsibilities:**

* Track shipment lifecycle
* Update dispatch and delivery status
* Record customer acceptance/rejection

**Backend Mapping:**

* `/api/delivery`

---

#### 3.1.11 Analytics Agent

**Responsibilities:**

* Generate dashboards:

  * Sales
  * Profit
  * Machine utilization
  * Delays
* Provide aggregated metrics

**Backend Mapping:**

* `/api/analytics`

---

## 4. Supporting Agents

### 4.1 Authentication Agent

**Responsibilities:**

* User authentication
* Role-based access control (RBAC)

**Backend Mapping:**

* `/api/auth`

---

### 4.2 Audit Agent

**Responsibilities:**

* Track:

  * Quotation revisions
  * Pricing overrides
  * QC rejections
* Maintain system logs

---

### 4.3 Notification Agent (Optional / Future)

**Responsibilities:**

* Send alerts:

  * Production delays
  * Order updates
  * Delivery status

---

## 5. Data Flow Between Agents

Typical workflow:

1. Enquiry Agent → creates enquiry
2. Feasibility Agent → validates feasibility
3. Quotation Agent → generates quotation
4. Customer → accepts quotation
5. Order Agent → creates order
6. Planning Agent → schedules production
7. Execution Agent → tracks production
8. QC Agent → validates output
9. Invoice Agent → generates invoice
10. Delivery Agent → tracks shipment
11. Analytics Agent → aggregates insights

---

## 6. Frontend Mapping (React)

Each agent corresponds to a feature module:

* `/enquiries`
* `/quotations`
* `/orders`
* `/production`
* `/quality`
* `/inventory`
* `/invoices`
* `/delivery`
* `/dashboard`

UI built using:

* **shadcn components**
* Role-based views:

  * Customer Dashboard
  * Spring Master Dashboard

---

## 7. Design Principles

* **Modularity:** Each agent is independently maintainable
* **Separation of Concerns:** Business logic isolated per domain
* **Scalability:** Agents can be extracted into microservices
* **Traceability:** Full lifecycle tracking across agents
* **Consistency:** Shared data models across backend and frontend

---

## 8. Error Handling Strategy

* Standard JSON response format:

```json
{
  "status": "error",
  "message": "Description",
  "code": 400
}
```

* Validation at:

  * API level
  * Database constraints

---

## 9. Future Enhancements

* Migration from SQLite → PostgreSQL
* Introduction of async workers (Celery / Redis)
* AI-based demand prediction & anomaly detection
* Integration with ERP/accounting systems

---

## 10. Developer Notes

* Keep API resources thin; move logic into service layers
* Maintain consistent naming conventions across agents
* Ensure idempotency for critical operations (orders, invoices)
* Write unit tests per agent
* Document all endpoints using OpenAPI/Swagger

---

End of Document
