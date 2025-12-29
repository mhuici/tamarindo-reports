# TamarindoReports

> AI-powered marketing analytics platform that transforms raw advertising data into actionable insights and client-ready reports.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Nuxt](https://img.shields.io/badge/Nuxt-3.15-00DC82.svg)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D.svg)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)

## Overview

TamarindoReports is a full-stack SaaS application designed to help marketing agencies deliver value to their clients through automated reporting, AI-generated insights, and interactive dashboards. The platform connects to advertising platforms (Google Ads, Facebook Ads), aggregates performance metrics, and uses AI to generate executive narratives that distill complex data into clear, actionable stories.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Multi-Platform Integration** | OAuth-based connections to Google Ads, Facebook Ads, and Google Analytics |
| **AI-Powered Narratives** | GPT-4 and Claude generate executive summaries and performance insights |
| **Root Cause Analysis** | Automated diagnosis of metric anomalies with actionable recommendations |
| **Interactive Dashboards** | Customizable, client-facing dashboards with real-time data visualization |
| **White-Label Reports** | PDF generation with custom branding per tenant |
| **Multi-Tenant Architecture** | Isolated data and configurations per agency/client |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Nuxt 3)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Dashboards  │  │   Reports   │  │   Settings & Config     │  │
│  │ (Chart.js)  │  │ (PDF Gen)   │  │   (Multi-tenant)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      API Layer (Nitro)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Auth     │  │  Metrics    │  │      Integrations       │  │
│  │   (JWT)     │  │   Sync      │  │  (Google, Facebook)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                       AI Services                               │
│  ┌─────────────────────────┐  ┌───────────────────────────────┐ │
│  │   Narrative Engine      │  │   Root Cause Analysis (RCA)   │ │
│  │   (OpenAI GPT-4)        │  │   (Anthropic Claude)          │ │
│  └─────────────────────────┘  └───────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                        Data Layer                               │
│  ┌─────────────────────────┐  ┌───────────────────────────────┐ │
│  │   PostgreSQL (Prisma)   │  │   Redis (Sessions/Queue)      │ │
│  └─────────────────────────┘  └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **Framework:** Nuxt 3 with Vue 3 Composition API
- **Styling:** Tailwind CSS with custom design system
- **State Management:** Pinia stores
- **Data Visualization:** Chart.js with vue-chartjs
- **Type Safety:** TypeScript with strict mode

### Backend
- **Runtime:** Node.js 20+ with Nitro server
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with OAuth 2.0 (Google, Facebook)
- **PDF Generation:** Puppeteer with headless Chromium
- **File Storage:** Cloudflare R2 (S3-compatible)

### AI/ML
- **Narrative Generation:** OpenAI GPT-4o-mini
- **Root Cause Analysis:** Anthropic Claude 3.5 Sonnet
- **Forecasting:** Holt-Winters exponential smoothing

## Features in Detail

### 1. Data Integration & Metrics Pipeline

The platform implements a canonical metrics schema that normalizes data across different advertising platforms:

```typescript
// Unified metrics regardless of source platform
interface CanonicalMetrics {
  impressions: number
  clicks: number
  spend: number
  conversions: number
  revenue: number
  ctr: number      // Calculated: clicks/impressions
  cpc: number      // Calculated: spend/clicks
  roas: number     // Calculated: revenue/spend
}
```

Platform adapters transform raw API responses into this unified format, enabling cross-platform comparisons and aggregations.

### 2. AI-Powered Insights

#### Narrative Engine
Transforms raw metrics into executive-ready narratives:

```typescript
// Input: Raw performance data
{ spend: 15000, revenue: 45000, roas: 3.0, previousRoas: 2.5 }

// Output: AI-generated narrative
"Campaign performance improved significantly this period, with ROAS
increasing 20% from 2.5x to 3.0x. The $15,000 investment generated
$45,000 in revenue, demonstrating strong return efficiency..."
```

#### Root Cause Analysis (RCA)
When metrics show anomalies, the RCA agent investigates:

- Identifies which metrics deviated from expected ranges
- Analyzes contributing factors (creative fatigue, audience saturation, etc.)
- Provides specific, actionable recommendations
- Prioritizes fixes by potential impact

### 3. Interactive Dashboards

- **Drag-and-drop widget builder** with live preview
- **Public sharing** via unique URLs (no login required for clients)
- **Responsive design** optimized for desktop and mobile
- **Real-time updates** with configurable refresh intervals

### 4. White-Label Capabilities

Each tenant can customize:
- Logo and brand colors
- Report templates
- Email domains
- Dashboard themes

## Project Structure

```
tamarindo-reports/
├── apps/
│   └── web/                    # Main Nuxt application
│       ├── components/         # Vue components
│       ├── composables/        # Reusable composition functions
│       ├── layouts/            # Page layouts
│       ├── middleware/         # Route middleware (auth, etc.)
│       ├── pages/              # File-based routing
│       └── server/
│           ├── api/            # API endpoints
│           └── utils/
│               ├── ai/         # AI service integrations
│               ├── pdf/        # PDF generation
│               └── storage/    # File storage (R2)
├── packages/
│   ├── db/                     # Prisma schema & client
│   ├── types/                  # Shared TypeScript types
│   ├── integrations/           # Platform API adapters
│   └── queue/                  # Background job processing
└── docs/                       # Documentation
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/mhuici/tamarindo-reports.git
cd tamarindo-reports

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
pnpm db:generate
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

### Environment Variables

See `.env.example` for all required variables. Key configurations:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth credentials |
| `FACEBOOK_APP_ID/SECRET` | Facebook OAuth credentials |
| `OPENAI_API_KEY` | OpenAI API key for narratives |
| `ANTHROPIC_API_KEY` | Claude API key for RCA |

## Deployment

The application is configured for deployment on Railway with:

- Multi-stage Docker build optimized for Puppeteer
- Health check endpoint at `/api/health`
- Auto-scaling configuration

See [docs/DEPLOY.md](docs/DEPLOY.md) for detailed deployment instructions.

## Roadmap

### Completed
- [x] Core authentication and multi-tenancy
- [x] Google Ads and Facebook Ads integrations
- [x] AI narrative generation
- [x] Interactive dashboard builder
- [x] PDF report generation
- [x] White-label branding

### In Progress
- [ ] Background job processing with BullMQ
- [ ] Scheduled report delivery
- [ ] Email notifications
- [ ] Advanced forecasting models

### Planned
- [ ] Google Analytics 4 integration
- [ ] LinkedIn Ads integration
- [ ] Custom metric formulas
- [ ] A/B test analysis
- [ ] Budget pacing alerts

## Technical Highlights

### Performance Optimizations
- **Lazy loading** for dashboard widgets
- **Virtual scrolling** for large data tables
- **Memoized computations** for metric calculations
- **Connection pooling** for database queries

### Security
- **Row-level security** via tenant isolation
- **Input validation** with Zod schemas
- **Secure token storage** for OAuth credentials
- **Rate limiting** on API endpoints

### Scalability Considerations
- Designed for horizontal scaling
- Stateless API servers
- Separated worker processes for heavy tasks (PDF generation)
- CDN-ready static assets

## Contributing

This is currently a personal project, but feedback and suggestions are welcome. Please open an issue for any bugs or feature requests.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with Vue, Nuxt, and AI by [@mhuici](https://github.com/mhuici)
