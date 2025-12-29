# TamarindoReports - AI Context

> Quick reference for AI assistants working on this codebase.
> Last updated: 2025-12-29 (Session 17)

## What is this project?

TamarindoReports is a **multi-tenant SaaS** for marketing agencies to create automated reports with AI-powered insights. Key differentiators:
- AI Root Cause Analysis (RCA) - explains metric changes
- AI Forecasting with confidence intervals
- AI Narrative Engine - executive summaries
- Micro-dashboards with shareable links (not just PDFs)
- Mobile-first design
- White-label branding

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Nuxt 4, Vue 3, Tailwind CSS |
| Charts | Chart.js + vue-chartjs |
| Backend | Nuxt Server (Nitro) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Custom JWT + OAuth2 (Google, Facebook) |
| PDF | Puppeteer (local) |
| Cache | Redis |
| AI Primary | Claude (Anthropic) - RCA, Forecasting, Narratives |
| AI Secondary | OpenAI (GPT-4o-mini) - Legacy insights |
| Storage | Cloudflare R2 (S3-compatible) - pending |

## Project Structure

```
tamarindo-reports/
├── apps/
│   └── web/                 # Main Nuxt 4 application
│       ├── pages/           # File-based routing
│       ├── components/      # Vue components
│       │   ├── ai/          # AI components (ForecastChart, NarrativeCard)
│       │   ├── dashboard/   # Dashboard wizard, editor, preview
│       │   ├── mobile/      # Mobile-first components
│       │   ├── reports/     # Report widgets
│       │   └── common/      # Shared components
│       ├── composables/     # Vue composables
│       ├── server/          # API routes (Nitro)
│       │   ├── api/         # REST endpoints
│       │   └── utils/       # Server utilities
│       │       ├── ai/      # Claude, OpenAI, RCA, Forecasting
│       │       ├── metrics/ # MetricsService
│       │       ├── pdf/     # PDF generator
│       │       └── storage/ # R2/S3 storage
│       └── layouts/         # Page layouts
│
├── packages/
│   ├── db/                  # Prisma schema & client
│   └── types/               # Shared TypeScript types
│       └── src/
│           └── canonical-metrics.ts  # Unified metrics schema
│
└── docker-compose.yml       # PostgreSQL + Redis
```

## Key Features

### AI Features
1. **RCA (Root Cause Analysis)** - Analyzes metrics with >10% change
2. **Forecasting** - Holt-Winters algorithm with 80%/95% confidence intervals
3. **Narrative Engine** - Executive summaries, insights, recommendations, alerts
4. **Fallback System** - Mock data when no API key, with `isFallback` flag

### Dashboard Features
1. **Wizard Creation** - 3-step flow (Objective, Metrics, Branding)
2. **Live Preview** - Real-time preview while editing
3. **Public Sharing** - `/d/[slug]` with password protection
4. **Mobile-First** - Swipeable cards, responsive layout

### Metrics System
1. **Canonical Schema** - Unified format for all platforms
2. **Platform Adapters** - Google Ads, Facebook Ads, TikTok Ads
3. **Caching** - 1-hour TTL in database
4. **Comparison** - Previous period calculations

## Key Patterns

### Multi-tenancy
- **Path-based**: `/[tenant]/dashboard`, `/[tenant]/clients`, etc.
- Tenant data isolated by `tenantId` in all queries
- Middleware validates tenant access

### Error Handling
```typescript
// Retry with exponential backoff
import { withRetry, AI_RETRY_OPTIONS } from '~/server/utils/retry'
await withRetry(() => callClaude(), AI_RETRY_OPTIONS)

// Categorize integration errors
import { categorizeIntegrationError } from '~/server/utils/integration-errors'
const error = categorizeIntegrationError(e)
if (error.type === 'token_expired') { /* show reconnect UI */ }
```

### AI Composables
```typescript
// RCA
const { analyze, results, isLoading, isFallback } = useRCA()

// Narratives
const { generate, narrative, isLoading, isFallback } = useNarrative()

// Forecasting
const { forecast, data, isLoading } = useForecast()
```

### Naming Conventions
- Files: `kebab-case` (e.g., `google-ads-connector.ts`)
- Components: `PascalCase` (e.g., `ReportBuilder.vue`)
- Variables/functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`

## API Routes

### AI Endpoints
- `POST /api/ai/rca` - Root Cause Analysis
- `POST /api/ai/forecast` - Time series forecasting
- `POST /api/ai/narrative` - Generate narratives
- `POST /api/ai/insights` - Legacy OpenAI insights

### Core Endpoints
- `GET/POST /api/clients` - Client CRUD
- `GET/POST /api/reports` - Report CRUD
- `GET/POST /api/dashboards` - Dashboard CRUD
- `GET /api/dashboards/public/:slug` - Public dashboard
- `POST /api/metrics/sync` - Sync platform metrics

## Database

Schema in `packages/db/prisma/schema.prisma`. Main models:
- `Tenant` - Agency/organization (with branding JSON)
- `User` - Team members
- `Client` - Agency's clients
- `DataSource` - Connected platforms (Google/Facebook)
- `PlatformAccount` - Ad accounts
- `Metric` - Cached metrics data
- `Report` - Generated reports
- `Dashboard` - Shareable micro-dashboards

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...
JWT_SECRET=...
ENCRYPTION_KEY=...

# AI (at least one)
ANTHROPIC_API_KEY=sk-ant-...  # For RCA, Forecasting, Narratives
OPENAI_API_KEY=sk-...         # For legacy insights

# Integrations (optional for dev)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...

# PDF
PUPPETEER_ENABLED=true
```

## Quick Start

```bash
docker-compose up -d     # Start PostgreSQL + Redis
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

**Demo credentials:**
- Email: `admin@demo.agency`
- Password: `demo123`
- URL: `http://localhost:3000/demo`

## Current Status

See `MODULES_STATUS.md` for detailed implementation progress.
See `TODO.md` for pending tasks.

## Tips for AI Development

1. **Keep files small** - Max 200-300 lines
2. **Explicit types** - No `any`, use proper interfaces
3. **Comments explain "why"** - Not "what"
4. **Use canonical metrics** - Always convert platform data to canonical format
5. **Handle fallbacks** - Always provide mock data when AI fails
6. **Update STATUS.md** - After completing features
