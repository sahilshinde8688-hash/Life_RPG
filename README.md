# Life RPG

A gamified personal productivity platform where real‑life goals become RPG‑style quests.

## Tech Stack

- **Frontend** – Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend** – FastAPI, Pydantic, SQLAlchemy, Alembic
- **Database** – Supabase PostgreSQL (local Docker fallback)
- **Auth** – Supabase Auth + JWT
- **AI** – Google Gemini (server‑side only)
- **Testing** – pytest, Vitest, Playwright
- **Deployment** – Vercel (frontend) + Render (backend)

## Quick Start (Docker)

```bash
# Clone repo
git clone <repo-url>
cd life-rpg

# Copy env example and fill in values
cp .env.example .env
# edit .env

# Start services
docker compose up -d

# Install deps
npm install --prefix frontend
pip install -r backend/requirements.txt

# Run migrations
alembic -c backend/alembic.ini upgrade head

# Start dev servers
npm run dev --prefix frontend
uvicorn backend/main:app --reload
```

## Project Structure

```
life-rpg/
├─ frontend/
│  ├─ app/            # Next.js App Router
│  ├─ components/
│  ├─ lib/
│  └─ package.json
├─ backend/
│  ├─ app/
│  │  ├─ api/
│  │  ├─ core/
│  │  └─ models/
│  ├─ alembic/
│  └─ requirements.txt
├─ docs/
├─ tests/
├─ .env.example
├─ docker-compose.yml
└─ README.md
```
