# 🍽️ KitchenPOS — Full-Stack Order Management System

A complete kitchen order queue system built with Django REST Framework + React, satisfying all PIT requirements.

---

## ✅ PIT Requirements Checklist

| # | Requirement | Status | Implementation |
|---|---|---|---|
| 1 | Web & Mobile API Communication | ✅ | DRF REST API — consumed by React web app; same API works for mobile |
| 2 | CRUD Operations | ✅ | Orders, Products, Customers, Users — full CRUD |
| 3 | Authentication System | ✅ | JWT login/register with djangorestframework-simplejwt |
| 4 | Email Activation / Verification | ✅ | Verification email sent on register; `/verify/<token>/` endpoint |
| 5 | Input Validations | ✅ | DRF serializer validation (backend) + form validation (frontend) |
| 6 | Chatbot Integration | ✅ | Ollama (llama3.2) chatbot with live order context |
| 7 | Role-Based Access Control | ✅ | Admin / Staff / Customer roles with protected routes & endpoints |
| 8 | Dashboard & Profile | ✅ | Stats dashboard with charts + full profile with avatar upload |
| 9 | File / Image Upload | ✅ | Product images + user avatars via Django MEDIA_ROOT |
| 10 | Responsive UI | ✅ | Tailwind CSS responsive layout |

---

## 🏗️ Tech Stack

**Backend**
- Django 4.2 + Django REST Framework
- JWT Authentication (djangorestframework-simplejwt)
- SQLite (swap to PostgreSQL for production)
- Pillow (image uploads)

**Frontend**
- React 18 + Vite
- Tailwind CSS
- React Router DOM
- Axios (with JWT refresh interceptor)
- Recharts (dashboard charts)
- React Hot Toast

**Chatbot**
- Ollama (local LLM — llama3.2)
- Contextual: reads live order counts from the database

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python seed.py             # Creates demo data
python manage.py runserver
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Ollama Chatbot Setup

```bash
# Install Ollama from https://ollama.com
ollama serve            # Start Ollama server
ollama pull llama3.2    # Download model (~2GB)
```

The chatbot works without Ollama too — it falls back to a helpful message showing current queue stats.

---

## 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@kitchen.com | admin123 |
| Staff | staff@kitchen.com | staff123 |

---

## 📱 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register/` | Public | Register + sends verification email |
| POST | `/api/auth/login/` | Public | Returns JWT tokens |
| POST | `/api/auth/refresh/` | Public | Refresh access token |
| GET | `/api/auth/verify/<token>/` | Public | Verify email |
| GET/PATCH | `/api/profile/` | Any role | User profile |
| GET | `/api/dashboard/stats/` | Staff/Admin | Dashboard metrics |
| GET | `/api/track/<ticket>/` | Public | Track order by ticket |
| POST | `/api/chatbot/` | Public | Ollama chatbot |
| CRUD | `/api/orders/` | Staff/Admin | Order management |
| PATCH | `/api/orders/<id>/update_status/` | Staff/Admin | Update order status |
| CRUD | `/api/products/` | Read: All, Write: Staff/Admin | Product management |
| CRUD | `/api/customers/` | Staff/Admin | Customer management |
| CRUD | `/api/users/` | Admin only | User management |
| PATCH | `/api/users/<id>/set_role/` | Admin only | Change user role |

---

## 🤖 Chatbot Features

KitchenBot uses Ollama (llama3.2) locally. It:
- Knows current pending/ready order counts
- Can look up specific orders by 4-digit ticket number
- Answers general kitchen/menu questions
- Falls back gracefully if Ollama is offline

**Example queries:**
- "How many orders are pending?"
- "What's the status of ticket 1234?"
- "What's on the menu?"

---

## 📂 Project Structure

```
kitchen-system/
├── backend/
│   ├── api/
│   │   ├── models.py       # User, Product, Customer, Order, OrderItem
│   │   ├── serializers.py  # DRF serializers with validation
│   │   ├── views.py        # All API views + chatbot
│   │   └── urls.py         # API routes
│   ├── core/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── seed.py             # Demo data seeder
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/axios.js        # Axios + JWT interceptor
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── Layout.jsx      # Sidebar navigation
│       │   └── Chatbot.jsx     # Ollama chatbot widget
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx   # Stats + charts
│           ├── Orders.jsx      # CRUD + status updates
│           ├── Queue.jsx       # Live kitchen queue
│           ├── Products.jsx    # CRUD + image upload
│           ├── Customers.jsx   # CRUD
│           ├── Profile.jsx     # Avatar + profile edit
│           ├── Users.jsx       # Admin role management
│           └── TrackOrder.jsx  # Public order tracking
├── start.sh
└── README.md
```

---

## 👨‍💻 Authors

Built for PIT (Practical Integrative Technology) — academic use.
