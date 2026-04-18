# ApnaGhr Visit Platform - Backend Architecture

## Overview
The backend of the ApnaGhr Visit Platform is built using **FastAPI**, providing a high-performance, asynchronous REST API. It uses **MongoDB** as its NoSQL database, communicating via the `motor` (Motor-AsyncIO) driver. The application relies on **Pydantic** for declarative data validation and settings management.

## Tech Stack
*   **Framework:** FastAPI
*   **Server:** Uvicorn
*   **Database:** MongoDB
*   **ODM/Driver:** Motor (Async IO for MongoDB)
*   **Authentication:** JWT (JSON Web Tokens) & `passlib` for password hashing
*   **Data Validation:** Pydantic
*   **Payment Gateway:** Cashfree, Stripe (via API integrations)
*   **AI/LLM Integrations:** Google GenAI, OpenAI, LiteLLM

## Core Components Structure

### 1. **Server Entry Point** (`server_new.py` / `server.py`)
*   **App Initialization:** Sets up the FastAPI `app` instance with metadata.
*   **Middleware:** Configures CORS and GZip middleware for optimal and secure HTTP transport.
*   **Lifespan & Database Initiation:** Hooks into the application's startup and shutdown life cycles. Upon startup, it connects to MongoDB and creates optimal indexes to ensure fast querying capabilities.
*   **Router Registration:** Pulls in and mounts modular routes categorized by business entities (Auth, Bookings, Advertisements, AI, Sellers, Builders).

### 2. **Models & Schemas** (`models/schemas.py`)
All requests and responses use **Pydantic models**. Key entities include:
*   **User:** Represents admins, customers, and roles. Contains authentication data (hashed passwords) and location tracking.
*   **Property:** Defines real estate metadata, imagery, pricing, and availability.
*   **VisitPackage & VisitBooking:** Core logic data representations handling property visits, timelines, and status updates.
*   **Rider:** Models for delivery/showing agents (applications, bank details, tracking).

### 3. **Routing Modules** (`routes/`)
Routes are segregated by feature allowing scalability:
*   **Auth (`routes/auth.py`):** User registration, JWT issuance, OTP verification.
*   **Builder/Advertising:** specialized endpoints for specific user archetypes to promote properties or projects.
*   **Tracking (`routes/tracking.py`):** Geo-spatial update endpoints heavily used by riders traversing the designated properties.
*   **AI Validation (`routes/ai_validation.py`):** Integrates with external Language Models to do automated screening, data validation, and feedback parsing.

### 4. **Authentication & Security**
*   **JWT Security Bearer:** Standard endpoints are secured via a `Depends(get_current_user)` parameter checking HTTP Bearer tokens. Token signature is verified against `JWT_SECRET`.
*   **Role-Based Access (RBAC):** Users hold different roles (`customer`, `admin`, `rider`, `seller`) which can optionally be enforced at the endpoint/router level.

### 5. **Database Interaction**
All DB calls are completely asynchronous, relying on `motor`. We pass the global `db` variable down to routers using a `set_database(db)` pattern configured at startup (or alternatively via FastApi dependency injection), ensuring strong connection pooling without blockages.

## Running the Application

### Setup (Local)
1. **Virtual Environment:** Use `python -m venv venv` and activate it.
2. **Install Dependencies:** `pip install -r requirements.txt`.
3. **Environment Setup:** Make sure `.env` is configured properly (including `MONGO_URL` and `JWT_SECRET`).

### Start Server
Run the entry point using Uvicorn:
```bash
# Recommended standard start command
uvicorn server_new:app --reload --host 0.0.0.0 --port 8001
```

### Seeding Data
At first startup, the application verifies if core collections are entirely empty. If so, `seed_production.py` is invoked to hydrate the database via predefined structures in `seed_data.json`.

### Steps to start backend
cd backend
.\venv\Scripts\activate
uvicorn server_new:app --host 0.0.0.0 --port 8001
