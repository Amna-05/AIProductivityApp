# ELEVATE Frontend

Next.js 15 frontend for the ELEVATE task management application.

## Tech Stack

- **Next.js 15.5** - React framework with App Router
- **React 19.1** - UI library
- **TypeScript 5.0** - Type safety
- **Tailwind CSS 4.0** - Styling
- **TanStack Query 5.90** - Server state management
- **Zustand 5.0** - Client state management
- **React Hook Form 7.69** - Form handling
- **Zod 4.2** - Schema validation
- **shadcn/ui** - UI components
- **Recharts 3.6** - Analytics charts

## Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev        # http://localhost:3000

# Production build
npm run build
npm run start

# Linting
npm run lint
```

## Environment Variables

Create `.env.local`:

```bash
# Local development
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Production (set in Vercel dashboard)
# NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app/api/v1
```

## Project Structure

```text
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Public routes (login, register)
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/        # Protected routes
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   ├── priority-matrix/
│   │   ├── categories/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── admin/
│   ├── globals.css         # Global styles + theme
│   └── layout.tsx          # Root layout
├── components/
│   ├── ai/                 # AI task parser dialog
│   ├── layout/             # Sidebar, headers
│   ├── tasks/              # Task cards, forms, filters
│   ├── analytics/          # Charts, stats
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── api/                # API client + endpoints
│   │   ├── client.ts       # Axios with token refresh
│   │   ├── auth.ts
│   │   ├── tasks.ts
│   │   └── analytics.ts
│   ├── store/              # Zustand stores
│   │   └── authStore.ts
│   └── utils/              # Helpers
└── public/                 # Static assets
```

## Key Features

### Authentication

- JWT with httpOnly cookies
- Automatic token refresh on 401
- Protected route middleware
- Zustand auth store

### Task Management

- CRUD with optimistic updates
- Priority Matrix (Eisenhower)
- Categories & tags
- Advanced filtering
- Due date picker

### AI Features

- Natural language task parsing
- Voice input (Web Speech API)
- Groq LLaMA 3.3 70B integration

### Analytics

- Completion trends
- Category performance
- Priority distribution
- Recharts visualizations

## Deployment

### Vercel (Recommended)

1. Import project from GitHub
2. Set root directory to `frontend`
3. Add environment variable:

   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
   ```

4. Deploy

### Manual Build

```bash
npm run build
npm run start
```

## Development Notes

- Uses App Router (not Pages Router)
- Route groups: `(auth)` for public, `(dashboard)` for protected
- API client auto-handles token refresh
- TanStack Query for caching and mutations
- Zustand for auth state persistence
