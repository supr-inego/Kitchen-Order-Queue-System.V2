# KitchenPOS Unified System

KitchenPOS is split into three independent deployable modules that share one backend API and one database.

```text
kitchen-system/
├── backend-api/     # Django REST API, database owner, Railway target
├── frontend-web/    # React + Vite web app, Vercel target
└── mobile-app/      # Expo React Native app, Android APK target
```

## Architecture Rules

- `backend-api` is the single source of truth for authentication, validation, roles, orders, products, customers, queue state, and chatbot data.
- `frontend-web` and `mobile-app` never connect to the database directly.
- Web and mobile both call the same REST API and receive the same validation and business rules.
- Each module has its own dependencies and env files so it can be moved into a separate repository later.

## Local Development

### Backend API

```bash
cd backend-api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python seed.py
python manage.py runserver
```

### Web Frontend

```bash
cd frontend-web
copy .env.example .env
npm install
npm run dev
```

### Mobile App

```bash
cd mobile-app
copy .env.example .env
npm install
npm run start
```

For Android emulator local API access, set:

```text
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
```

For a physical phone, use your computer LAN IP:

```text
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000/api
```

## Deployment

### Backend API on Railway

Deploy `backend-api` as the Railway service root.

Required Railway variables:

```text
DJANGO_SECRET_KEY=your-production-secret
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=your-api.up.railway.app
DATABASE_URL=railway-postgres-url
FRONTEND_URL=https://your-web-app.vercel.app
CORS_ALLOW_ALL_ORIGINS=false
CORS_ALLOWED_ORIGINS=https://your-web-app.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-web-app.vercel.app
```

Railway uses `backend-api/railway.json` and `backend-api/Procfile`.

### Web on Vercel

Deploy `frontend-web` as the Vercel project root.

Required Vercel variable:

```text
VITE_API_BASE_URL=https://your-api.up.railway.app/api
```

### Android APK with Expo

Build from `mobile-app`.

```bash
npm install -g eas-cli
eas login
EXPO_PUBLIC_API_BASE_URL=https://your-api.up.railway.app/api npm run build:apk
```

The mobile app is portable: move the entire `mobile-app` folder anywhere, install dependencies, set `EXPO_PUBLIC_API_BASE_URL`, and it will use the same backend API.

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@kitchen.com | admin123 |
| Staff | staff@kitchen.com | staff123 |

Run `python seed.py` inside `backend-api` to create demo data.
