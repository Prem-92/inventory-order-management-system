# 📦 Enterprise Inventory & Order Management System

A highly polished, production-grade, full-stack enterprise web application designed for active real-time warehouse catalog surveillance, dynamic safety guardrail stock alerts, multi-line order processing invoice generation, and customer profile relations.

Built using **React (Vite) + Tailwind CSS** on the frontend, a high-performance **FastAPI (Python) + PostgreSQL** backend, and orchestrated via **Docker (Docker Compose)**.

---

## 🚀 Live Environment Links
- **Development Preview URL:** [https://ais-dev-pegxwlvnm6vxhltnkwf6af-301648566169.asia-southeast1.run.app](https://ais-dev-pegxwlvnm6vxhltnkwf6af-301648566169.asia-southeast1.run.app)
- **Shared Production Preview URL:** [https://ais-pre-pegxwlvnm6vxhltnkwf6af-301648566169.asia-southeast1.run.app](https://ais-pre-pegxwlvnm6vxhltnkwf6af-301648566169.asia-southeast1.run.app)

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [Architectural Blueprint](#-architectural-blueprint)
3. [Key Features](#-key-features)
4. [Environment Variables](#-environment-variables)
5. [Docker Orchestration Setup](#-docker-orchestration-setup)
6. [Manual Local Development Installation](#-manual-local-development-installation)
7. [Production REST API Endpoints Specification](#-production-rest-api-endpoints-specification)
8. [Target Screenshots Section](#-target-screenshots-section)
9. [Deployment Protocols](#-deployment-protocols)
10. [Roadmap & Future Improvements](#-roadmap--future-improvements)

---

## 🌟 Project Overview

This Inventory & Order Management System acts as an operations control center for modern business workflows. By pairing a high-density, bento-grid dashboard with rigid backend API constraints, the system ensures real-time stock integrity and lightning-fast invoicing operations. 

To support seamless standalone previewing and instant evaluations in any web sandbox, the frontend ships with a **hybrid local-fallback simulation engine powered by `localStorage`**, replicating complete transactional state persistence (such as inventory asset deduction and order rollbacks) when backends are unprovisioned, while being ready to configure with the live production database layer.

---

## 🏗 Architectural Blueprint

```
                     ┌───────────────────────────┐
                     │    React (Vite) Frontend   │
                     │    Port: 3000 | SPA       │
                     └─────────────┬─────────────┘
                                   │
                           HTTP Rest Calls API
                                   │
                     ┌─────────────▼─────────────┐
                     │    FastAPI API Gateway    │
                     │    Port: 8000 | Python    │
                     └─────────────┬─────────────┘
                                   │
                        SQLAlchemy ORM Queries
                                   │
                     ┌─────────────▼─────────────┐
                     │     PostgreSQL Database   │
                     │     Port: 5432 | Volume   │
                     └───────────────────────────┘
```

### 💻 Frontend Architecture
- **React 19 + Vite:** Low latency static-module assets bundle builder.
- **Tailwind CSS:** Fully tailored UI design avoiding generic purple-to-blue gradients; uses a sophisticated, high-contrast Slate/Navy blueprint with generous negative space.
- **Framer Motion (`motion/react`):** Smooth entrance transitions, state changes, and feedback micro-animations.
- **Lucide React:** A consistent, minimalist vector iconography system.

### ⚙️ Backend Architecture
- **FastAPI:** Python 3.11 high-throughput asynchronous API framework.
- **SQLAlchemy:** Fully typed ORM mapping models with constraint enforcement (unique SKU indexing, check constraints).
- **Uvicorn:** Low-overhead production-grade ASGI web server implementation.

---

## ✨ Key Features

- **Operations Intelligence Dashboard:** High-density analytics bento grid featuring total catalog SKU volume tracker, active customer registries, total completed invoice orders, and live gross revenue tracking.
- **Advanced Dynamic Stock Level Alerts:** User-adjustable threshold guardrail selectors (1, 3, 5, 10 units) displaying instant warnings on depleting items accompanied by in-line quick-replenish controls.
- **Department Stock Asset Metrics:** Auto-grouped visual analytics charts showing stock weight distribution across SKU prefix departments (e.g. `MAC`, `DSL`, `PHN`).
- **Dynamic Multi-line Invoicing Engine:** Add, remove, and configure item lines interactively with automatic real-time unit multipliers, validation guards (such as over-ordering checks), and transactional safety.
- **Automated Restock & Refund Logic:** Canceling orders cleanly rolls back the transaction and returns stock allocation quantities instantly.

---

## 🔑 Environment Variables

The application relies on consistent environments configure-ready for both local setups and secure container runtimes. Copy `.env.example` into a root `.env` file before executing:

```bash
# General application keys & hosting paths
GEMINI_API_KEY="your_secure_gemini_api_key"
APP_URL="http://localhost:3000"

# Target docker-compose orchestrations
FRONTEND_PORT=3000
BACKEND_PORT=8000
POSTGRES_EXTERNAL_PORT=5432

# Production database connections
POSTGRES_SERVER=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres_production_user
POSTGRES_PASSWORD=your_highly_secure_db_password_123!
POSTGRES_DB=inventory_db_production
```

---

## 🐳 Docker Orchestration Setup

We provide production-ready `Dockerfile` configurations and a root-level `docker-compose.yml` to launch the entire multi-container service chain in a single execution.

### Prerequisites
- Install **Docker** and **Docker Compose** on your host system.

### Deployment Instructions
1. Clone the repository and navigate to the project directory:
   ```bash
   cd inventory-order-management-system
   ```
2. Populate the environment parameters:
   ```bash
   cp .env.example .env
   ```
3. Spin up the orchestrator network:
   ```bash
   docker-compose up --build
   ```
   *This command compiles the React assets into a lightweight specialized Alpine Node server, sets native C build environments for the Python wheels, configures Postgres, and waits for connection handshakes before opening ports:*
   - **Frontend Dashboard App:** `http://localhost:3000`
   - **Backend OpenAPI Sandbox:** `http://localhost:8000/docs`
   - **Database Ingress:** `localhost:5432`

---

## 🛠 Manual Local Development Installation

If you prefer to run services individually without containers:

### 1. Database Setup (PostgreSQL)
Ensure you have PostgreSQL v16 running locally and create a database corresponding to your `.env` parameters:
```sql
CREATE DATABASE inventory_db_production;
```

### 2. Backend API Setup (FastAPI)
1. Navigate to backend workspace:
   ```bash
   cd backend
   ```
2. Set up a Python Virtual Environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install production requirements:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. Run development live reload server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### 3. Frontend App Setup (React Vite)
1. Navigate to the root directory where `package.json` resides:
   ```bash
   cd ..
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Boot the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the development dashboard at `http://localhost:3000`.

---

## 📋 Production REST API Endpoints Specification

FastAPI automatically parses schemas and delivers a live operations playground at `/docs`. Below is a quick overview of the schema specifications:

| Prefix | Method | Endpoint Path | Authentication | Description |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/health` | None | Service heartbeat diagnostic check |
| **Products** | `GET` | `/api/v1/products/` | Standard / JWT | Fetch entire master SKU catalogs with pagination |
| | `POST` | `/api/v1/products/` | Admin Status | Create new product catalog item with SKU validations |
| | `GET` | `/api/v1/products/{id}` | Standard | Retrieve a single SKU detail and stock quantity |
| | `PUT` | `/api/v1/products/{id}` | Manager Status | Partially update properties (pricing, descriptions, stock) |
| | `DELETE` | `/api/v1/products/{id}` | Super Admin | Safeguard delete item SKU |
| **Customers**| `GET` | `/api/v1/customers/` | Standard | Fetch active customer accounts |
| | `POST` | `/api/v1/customers/` | Standard | Register a new customer with verified email format |
| | `DELETE` | `/api/v1/customers/{id}`| Admin Status | Delete profile and cascading order links |
| **Orders** | `GET` | `/api/v1/orders/` | Standard | Retrieve complete historic business invoices ledger |
| | `POST` | `/api/v1/orders/` | Standard | Process checkout, deduct stocks, save transaction |
| | `DELETE` | `/api/v1/orders/{id}` | Admin Status | Cascade rollback order and replenish stock counts |

---

## 🖼 Target Screenshots Section

> Once deployed, replace the placeholders below with the high-resolution images of your running software.

#### 1. Operations Intelligence Dashboard
*View active stock distributions, live totals, adjustable low safety alert levels, and quick replenishment workflows.*
![Dashboard Panel Placeholder](https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop)

#### 2. Master Product SKU Catalog
*Audit exact SKU codes, real-time items in stock, pricing variables, and add custom entries with deep search capabilities.*
![Catalog View Placeholder](https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop)

#### 3. Checkout Order Creation Terminal
*Process billing checkouts with interactive multi-line builders, dynamic customer link selectors, and total sales recalculators.*
![Checkout Terminal Placeholder](https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop)

---

## ☁️ Deployment Protocols

### Deploying the Complete Stack to Google Cloud Run

To host your dockerized setup on Google Cloud’s highly scalable managed serverless platform:

1. **Verify your Google Cloud Platform SDK:**
   Ensure CLI tools are authenticated:
   ```bash
   gcloud auth login
   gcloud config set project [YOUR_GCP_PROJECT_ID]
   ```
2. **Build and push images with Google Artifact Registry:**
   ```bash
   # Build Backend
   docker build -t gcr.io/[PROJECT_ID]/inventory-backend:latest ./backend
   docker push gcr.io/[PROJECT_ID]/inventory-backend:latest

   # Build Frontend
   docker build -t gcr.io/[PROJECT_ID]/inventory-frontend:latest .
   docker push gcr.io/[PROJECT_ID]/inventory-frontend:latest
   ```
3. **Provision and Deploy Cloud Run Containers:**
   Launch the Backend first:
   ```bash
   gcloud run deploy inventory-backend \
     --image gcr.io/[PROJECT_ID]/inventory-backend:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="POSTGRES_SERVER=[YOUR_CLOUD_SQL_IP],POSTGRES_USER=postgres"
   ```
   Take note of your deployed service URL, configure it in your frontend configuration properties, then deploy the Frontend:
   ```bash
   gcloud run deploy inventory-frontend \
     --image gcr.io/[PROJECT_ID]/inventory-frontend:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

---

## 🔮 Roadmap & Future Improvements

We have targeted the following engineering milestones to elevate the system onto the next scale:
- [ ] **JWT User Session Security:** Add OAuth-backed user log-in portals and Role-Based Access Controls (RBAC) separating warehouse workers from financial managers.
- [ ] **Predictive Inventory Restocking:** Train custom models using historical sales invoice metrics to predict stock out timelines and trigger dynamic supply purchase requests automatically.
- [ ] **PDF Billing Invoices Generation:** Integrate serverless rendering tools to let coordinators download formatted print-ready PDF sales receipts instantly.
- [ ] **WebSocket Data Streams:** Achieve pure real-time active stock synchronization between concurrent terminal screens without needing manual browser clicks or periodic pollings.

---

*Enterprise Inventory & Order Management System. Prepared under corporate specifications.*
