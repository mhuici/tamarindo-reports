# TamarindoReports - AI Context

> Quick reference for AI assistants working on this codebase.

## What is this project?

TamarindoReports is a **multi-tenant SaaS** for marketing agencies to create automated reports with AI-powered insights. Similar to ReportingNinja but with:
- Micro-dashboards with shareable links (not just PDFs)
- AI insights using OpenAI
- Better UX and Latam-first support

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Nuxt 4, Vue 3, Tailwind CSS, Tremor.so |
| Charts | Chart.js + vue-chartjs |
| Backend | Nuxt Server (Nitro) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Custom (JWT) + OAuth2 (Google, Facebook) |
| PDF | Puppeteer in separate worker |
| Queue | BullMQ + Redis |
| AI | OpenAI API (GPT-4o-mini) |
| Storage | Cloudflare R2 (S3-compatible) |

## Project Structure

```
tamarindo-reports/
├── apps/
│   ├── web/                 # Main Nuxt 4 application
│   │   ├── pages/           # File-based routing
│   │   ├── components/      # Vue components
│   │   ├── composables/     # Vue composables
│   │   ├── server/          # API routes (Nitro)
│   │   └── layouts/         # Page layouts
│   └── pdf-worker/          # Puppeteer PDF service
│
├── packages/
│   ├── db/                  # Prisma schema & client
│   ├── types/               # Shared TypeScript types
│   ├── integrations/        # Google/Facebook connectors
│   ├── ai/                  # OpenAI integration
│   └── queue/               # BullMQ jobs
│
└── docs/                    # Documentation
```

## Key Patterns

### Multi-tenancy
- **Path-based**: `/[tenant]/dashboard`, `/[tenant]/clients`, etc.
- Tenant data isolated by `tenantId` in all queries
- Middleware validates tenant access

### Data Connectors
All integrations implement `DataConnector` interface:
```typescript
interface DataConnector {
  id: string
  displayName: string
  getAuthUrl(tenantId, redirectUri): Promise<string>
  handleCallback(code, tenantId): Promise<OAuthTokens>
  getAccounts(accessToken): Promise<Account[]>
  getMetrics(accessToken, accountId, dateRange, metrics): Promise<NormalizedMetrics>
}
```

### Naming Conventions
- Files: `kebab-case` (e.g., `google-ads-connector.ts`)
- Components: `PascalCase` (e.g., `ReportBuilder.vue`)
- Variables/functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`

### API Routes
Located in `apps/web/server/api/`:
- `GET /api/tenants/:tenantId` - Get tenant
- `GET /api/clients` - List clients (tenant from session)
- `POST /api/reports` - Create report
- `GET /api/integrations/:type/auth` - Start OAuth flow

## Common Tasks

### Add a new page
1. Create file in `apps/web/pages/[tenant]/`
2. Set `definePageMeta({ layout: 'dashboard' })`
3. Page auto-registers via file-based routing

### Add a new integration
1. Copy `packages/integrations/src/_template/`
2. Implement `DataConnector` interface
3. Register in `packages/integrations/src/index.ts`
4. Add OAuth callback route in `apps/web/server/api/integrations/`

### Add a new widget type
1. Create component in `apps/web/components/reports/widgets/`
2. Add type to `packages/types/src/index.ts`
3. Register in widget factory

### Run development
```bash
pnpm install           # Install dependencies
pnpm db:generate       # Generate Prisma client
pnpm dev               # Start dev server
```

## Database

Schema in `packages/db/prisma/schema.prisma`. Main models:
- `Tenant` - Agency/organization
- `User` - Team members
- `Client` - Agency's clients
- `DataSource` - Connected platforms (Google/Facebook)
- `Report` - Generated reports
- `Dashboard` - Shareable micro-dashboards

Run migrations:
```bash
pnpm db:migrate        # Create migration
pnpm db:push           # Push without migration
```

## Environment Variables

See `.env.example` for required variables:
- `DATABASE_URL` - PostgreSQL connection
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth
- `FACEBOOK_APP_ID/SECRET` - Facebook OAuth
- `OPENAI_API_KEY` - AI insights
- `REDIS_URL` - Job queue

## Current Status

See `MODULES_STATUS.md` for implementation progress.

## Tips for AI Development

1. **Keep files small** - Max 200-300 lines
2. **Explicit types** - No `any`, use proper interfaces
3. **Comments explain "why"** - Not "what"
4. **Test as documentation** - Descriptive test names
5. **Update STATUS.md** - After completing features
