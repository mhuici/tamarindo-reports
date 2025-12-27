# TamarindoReports - Guía de Escalabilidad

> Documento de referencia para escalar la aplicación según el crecimiento.

## Estado Actual (Desarrollo/MVP)

| Componente | Implementación Actual | Límite Aproximado |
|------------|----------------------|-------------------|
| PDF Generation | Puppeteer local | ~50 PDFs/hora |
| Metrics Sync | Sincrónico on-demand | ~100 clientes |
| Database | PostgreSQL single | ~10k reportes |
| Storage | Filesystem local | Disco disponible |
| Background Jobs | Sin implementar | N/A |

---

## Fase 1: Producción Pequeña (1-50 clientes)

### Qué funciona bien:
- ✅ Puppeteer local para PDFs
- ✅ Sync de métricas on-demand
- ✅ PostgreSQL single instance
- ✅ Storage local o básico

### Recomendaciones:
1. **Hosting**: VPS con 2GB+ RAM (DigitalOcean, Hetzner, Railway)
2. **Database**: PostgreSQL managed (Railway, Supabase, Neon)
3. **PDFs**: Puppeteer local funciona bien
4. **Storage**: Cloudflare R2 para PDFs (económico)

### Variables de entorno sugeridas:
```bash
# Producción básica
NODE_ENV=production
DATABASE_URL=postgresql://...

# Storage (opcional pero recomendado)
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=tamarindo-pdfs
R2_PUBLIC_URL=https://cdn.tudominio.com
```

---

## Fase 2: Crecimiento (50-500 clientes)

### Problemas que aparecerán:
- ⚠️ PDFs bloquean el servidor durante generación
- ⚠️ Sync de métricas toma demasiado tiempo
- ⚠️ Alto consumo de memoria por Puppeteer

### Soluciones:

#### 1. Background Jobs con BullMQ
El proyecto ya tiene BullMQ configurado. Activar para:

```typescript
// apps/web/server/utils/queue/pdf-worker.ts
import { Queue, Worker } from 'bullmq'

const pdfQueue = new Queue('pdf-generation', {
  connection: { host: 'localhost', port: 6379 }
})

// Agregar job en vez de generar directo
await pdfQueue.add('generate', { reportId, userId })

// Worker separado procesa en background
const worker = new Worker('pdf-generation', async (job) => {
  await generateReportPDF(job.data)
}, { connection })
```

#### 2. Servicio de PDF Externo
Cambiar a Browserless.io o similar:

```bash
# En .env
PDF_SERVICE_URL=https://chrome.browserless.io/pdf
PDF_SERVICE_API_KEY=tu-api-key
```

**Costos aproximados:**
| Servicio | Plan | PDFs/mes | Precio |
|----------|------|----------|--------|
| Browserless.io | Starter | 1,000 | $10/mes |
| Browserless.io | Pro | 10,000 | $50/mes |
| PDFShift | Basic | 500 | $9/mes |

#### 3. Sync de Métricas en Background
```typescript
// Cron job cada hora
cron.schedule('0 * * * *', async () => {
  const clients = await getActiveClients()
  for (const client of clients) {
    await metricsQueue.add('sync', { clientId: client.id })
  }
})
```

---

## Fase 3: Escala (500+ clientes)

### Arquitectura recomendada:

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
    │ Web 1   │       │ Web 2   │       │ Web 3   │
    └────┬────┘       └────┬────┘       └────┬────┘
         │                 │                 │
         └────────────────┬┴─────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
         ┌────▼────┐            ┌─────▼─────┐
         │ Redis   │            │ PostgreSQL │
         │ (Queue) │            │ (Primary)  │
         └────┬────┘            └─────┬─────┘
              │                       │
    ┌─────────┼─────────┐            │
    │         │         │            │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐  ┌─────▼─────┐
│Worker1│ │Worker2│ │Worker3│  │ Read      │
│(PDFs) │ │(Sync) │ │(Email)│  │ Replicas  │
└───────┘ └───────┘ └───────┘  └───────────┘
```

### Componentes:

| Componente | Servicio Recomendado | Costo Aproximado |
|------------|---------------------|------------------|
| Web Servers | Railway / Fly.io | $20-50/mes |
| PostgreSQL | Supabase Pro / Neon | $25-50/mes |
| Redis | Upstash / Redis Cloud | $10-20/mes |
| PDF Service | Browserless Pro | $50/mes |
| Storage | Cloudflare R2 | ~$5/mes |
| CDN | Cloudflare | Gratis |
| **Total** | | **~$110-175/mes** |

---

## Migración de PDF: Local → Externo

### Paso 1: Configurar servicio externo
```bash
# .env
PDF_SERVICE_URL=https://chrome.browserless.io/pdf
PDF_SERVICE_API_KEY=your-key
```

### Paso 2: El código ya soporta ambos
```typescript
// generator.ts ya detecta automáticamente:
if (process.env.PDF_SERVICE_URL) {
  return await generateWithExternalService(params) // ← Usa externo
}
return await generateWithPuppeteer(params) // ← Usa local
```

### Paso 3: Probar y desactivar Puppeteer
```bash
# Una vez confirmado que funciona el externo
pnpm remove puppeteer  # Ahorra ~300MB en deploy
```

---

## Migración de Storage: Local → Cloud

### Cloudflare R2 (Recomendado)
```bash
# .env
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=tamarindo-pdfs
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://cdn.tudominio.com
```

### Implementación (pendiente):
```typescript
// apps/web/server/utils/storage/r2.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadPDF(buffer: Buffer, key: string): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
  }))

  return `${process.env.R2_PUBLIC_URL}/${key}`
}
```

---

## Checklist de Producción

### Antes de lanzar:
- [ ] Variables de entorno configuradas
- [ ] Database migrada y backups activos
- [ ] SSL/HTTPS configurado
- [ ] Dominio configurado
- [ ] OAuth redirect URIs actualizados
- [ ] Monitoreo básico (logs)

### Para escalar:
- [ ] BullMQ workers para PDFs
- [ ] BullMQ workers para sync de métricas
- [ ] Storage en R2/S3
- [ ] CDN para assets estáticos
- [ ] Read replicas de DB (si necesario)
- [ ] Rate limiting en APIs

### Monitoreo:
- [ ] Sentry para errores
- [ ] Uptime monitoring (UptimeRobot, BetterStack)
- [ ] Database monitoring
- [ ] Alertas de uso de recursos

---

## Costos Estimados por Fase

| Fase | Clientes | Costo Mensual |
|------|----------|---------------|
| MVP | 1-10 | $0-20 |
| Pequeña | 10-50 | $30-60 |
| Crecimiento | 50-200 | $80-150 |
| Escala | 200-500 | $150-300 |
| Enterprise | 500+ | $300+ |

---

## Recursos

- [BullMQ Docs](https://docs.bullmq.io/)
- [Browserless.io](https://browserless.io/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Railway](https://railway.app/)
- [Supabase](https://supabase.com/)
