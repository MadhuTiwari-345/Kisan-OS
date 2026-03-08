# Smart Agri Supply Chain Platform

AI-powered farmer platform connecting farmers, mandis, logistics providers, and advisory services through a multilingual frontend and a FastAPI backend.

## What is implemented

- Next.js farmer/admin frontend in `hackathonmadhu-main`
- FastAPI backend in `kisan-os/backend`
- Real auth with JWT-backed farmer/admin login
- 22 scheduled Indian farmer languages in the frontend and backend language catalog
- Advisory, market, voice, logistics, and disease-detection API surfaces aligned to the frontend client
- Offline caching and queued request support in the frontend hooks
- Seeded market, mandi, advisory, and admin reference data for local development

## Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, Framer Motion
- Backend: FastAPI, SQLModel, SQLAlchemy async, JWT auth
- Database: PostgreSQL-ready schema with local SQLite fallback for development bootstrap
- Offline: IndexedDB-backed caching and request queue

## Core routes

- `/login`
- `/dashboard`
- `/market`
- `/marketplace`
- `/logistics`
- `/advisory`
- `/admin`

## API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `GET /api/voice/languages`
- `POST /api/voice/stt`
- `POST /api/voice/translate`
- `POST /api/voice/tts`
- `POST /api/voice/query`
- `POST /api/advisory/query`
- `GET /api/advisory/history`
- `POST /api/advisory/recommend-crop`
- `POST /api/ai/disease-detect`
- `GET /api/market/prices`
- `GET /api/market/compare`
- `GET /api/market/best-mandi`
- `POST /api/logistics/request`
- `GET /api/logistics/status/{id}`
- `GET /api/logistics/history`
- `POST /api/logistics/milk-run/optimize`
- `GET /api/logistics/quote`

## Local development

1. Frontend

```bash
cd hackathonmadhu-main
npm install
npm run dev
```

2. Backend

```bash
cd kisan-os/backend
pip install -r requirements.txt
python main.py
```

Frontend runs at `http://localhost:3000`.

Backend runs at `http://localhost:8000`.

## Default local credentials

- Admin: `admin@kisan-os.in` / `admin123`
- Buyer: `buyer@kisan-os.in` / `buyer123`

Create farmer accounts through the `/login` registration flow.
