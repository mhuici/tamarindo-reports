# TamarindoReports - TODO & Pendientes

> Última actualización: 2025-12-27 (Post-Session 12)

## Resumen de Progreso

| Sesión | Descripción | Estado |
|--------|-------------|--------|
| 1 | Foundation (monorepo, Nuxt 4, Tailwind) | ✅ |
| 2 | Database Setup (Docker, Prisma, seed) | ✅ |
| 3 | Auth System (login, register, middleware) | ✅ |
| 4 | Multi-tenant Core (tenant, clients, settings) | ✅ |
| 5 | Integrations (Google Ads, Facebook Ads OAuth) | ✅ |
| 6 | Report Builder (CRUD, widgets) | ✅ |
| 7 | Dashboards (shareable, password protection) | ✅ |
| 8 | AI Insights & PDF (OpenAI, PDF structure) | ✅ |
| 9 | White Label & Polish | ✅ |
| 10 | Metrics Service & Real Data Integration | ✅ |
| 11 | PDF Generation & UI | ✅ |
| 12 | RCA, Forecasting, Narrative Engine (Claude AI) | ✅ |
| 13 | Dashboard Mobile-First | ✅ |
| 14 | API Bridge (Google/Facebook → ProcessedMetric) | 🔄 Pendiente |
| 15 | Preview de Reporte + Logo Upload | 🔄 Pendiente |
| 16 | Error Handling Producción | 🔄 Pendiente |
| 17 | Testing & Polish | 🔄 Pendiente |

---

## Funcionalidades Completas

### Core
- [x] Autenticación JWT con cookies httpOnly
- [x] Registro de usuarios con tenant
- [x] Login/logout
- [x] Middleware global de auth
- [x] Middleware de tenant
- [x] CRUD de clientes
- [x] Settings (perfil, contraseña)

### Integraciones (Estructura Lista)
- [x] OAuth flow Google Ads
- [x] OAuth flow Facebook Ads
- [x] Almacenamiento de tokens encriptados
- [x] UI de conexión/desconexión
- [ ] ⚠️ **Requiere configurar credenciales reales**

### Reportes
- [x] CRUD completo
- [x] Filtros por tipo/estado
- [x] Editor con widgets
- [x] Widgets: Metric, Chart, Table, Text
- [x] AI Insights con OpenAI
- [ ] ⚠️ **Requiere OPENAI_API_KEY para insights reales**

### Dashboards
- [x] CRUD completo
- [x] Links compartibles con slug único
- [x] Protección con contraseña
- [x] Expiración de links
- [x] Vista pública /d/[slug]

### AI & PDF
- [x] Estructura OpenAI client
- [x] Prompts para insights de marketing
- [x] Mock insights para testing
- [x] Estructura PDF generator
- [x] Soporte para servicios externos
- [ ] ⚠️ **Requiere configurar OpenAI/PDF service**

---

## Configuración Pendiente (Crítico)

### Variables de Entorno Requeridas

```bash
# Ya configuradas (desarrollo)
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
ENCRYPTION_KEY="..."

# AI - Claude (Anthropic) - PENDIENTE
ANTHROPIC_API_KEY=        # Para RCA, Forecasting, Narrative Engine
                          # Obtener en: https://console.anthropic.com/settings/keys
                          # Costo estimado: ~$0.08 por reporte completo

# AI - OpenAI (legacy) - Opcional
OPENAI_API_KEY=           # Para AI insights legacy

# Integraciones - Data Real - PENDIENTE
GOOGLE_CLIENT_ID=         # Para Google Ads OAuth
GOOGLE_CLIENT_SECRET=     # Obtener en: https://console.cloud.google.com/apis/credentials
FACEBOOK_APP_ID=          # Para Facebook Ads OAuth
FACEBOOK_APP_SECRET=      # Obtener en: https://developers.facebook.com/apps/

# PDF (ya funciona con Puppeteer local)
PUPPETEER_ENABLED=true    # Habilitado por defecto
```

### Checklist Pre-Producción
- [ ] Agregar créditos a Anthropic API (~$5-10 para testing)
- [ ] Crear proyecto en Google Cloud Console y habilitar Google Ads API
- [ ] Crear app en Facebook Developers y solicitar permisos ads_read
- [ ] Configurar redirect URIs para OAuth en producción

---

## Funcionalidades Pendientes por Módulo

### Integraciones (Prioridad Alta)
- [ ] Probar OAuth con credenciales reales
- [x] Fetch de cuentas de Google Ads (implementado)
- [x] Fetch de cuentas de Facebook Ads (implementado)
- [x] Sync de métricas desde APIs reales
- [x] Almacenamiento de métricas en DB (con cache)

### Reportes
- [x] Conectar widgets a datos reales (via MetricsService)
- [x] Exportar a PDF funcional (Puppeteer)
- [x] Botón de generar/descargar PDF en UI
- [ ] Configuración de widgets (métricas a mostrar)
- [ ] Preview de reporte
- [ ] Programación de reportes automáticos

### AI Insights
- [ ] Probar con API key real
- [ ] Incluir métricas reales en prompts
- [ ] Recomendaciones de widgets

### AI Root Cause Analysis (RCA) - Session 12
- [x] Cliente Claude (Anthropic SDK)
- [x] RCA Agent con análisis de cambios significativos (>10%)
- [x] Endpoint `/api/ai/rca` (single + batch mode)
- [x] Mock fallback cuando no hay API key
- [x] Composable `useRCA()` para frontend
- [x] Componente `WidgetInsight.vue` para mostrar análisis
- [x] Integración en dashboard público `/d/[slug]`
- [ ] Configurar `ANTHROPIC_API_KEY` para usar Claude real

### AI Forecasting (Holt-Winters) - Session 12
- [x] Algoritmo Holt-Winters triple exponential smoothing
- [x] Intervalos de confianza 80% y 95%
- [x] Endpoint `/api/ai/forecast`
- [x] Composable `useForecast()` para frontend
- [x] Componente `ForecastChart.vue` con visualización SVG
- [x] Integración en widgets de gráfico de línea

### AI Narrative Engine - Session 12
- [x] Prompts con identidad "Senior Marketing Strategist"
- [x] Adaptación de tono (professional/casual/technical/bold)
- [x] CORE RULES (no alucinaciones, números humanizados, una sola acción)
- [x] Endpoint `/api/ai/narrative` (single + dashboard mode)
- [x] Motor de narrativas con Claude + mock fallback
- [x] Composable `useNarrative()` para frontend
- [x] Componente `NarrativeCard.vue` con estilos por tipo
- [x] Tipos: executive-summary, widget-insight, recommendation, alert
- [x] Integración en dashboard (resumen, recomendaciones, alertas)
- [ ] Configurar `ANTHROPIC_API_KEY` para usar Claude real

### Dashboard Mobile-First - Session 13
- [x] Componente `MetricCardSwipeable.vue` touch-friendly
- [x] Horizontal scroll con snap para métricas
- [x] Header responsive (compacto en mobile)
- [x] Componente `RecommendationsCard.vue` con prioridades
- [x] Componente `AlertsList.vue` con severidades
- [x] Secciones separadas: Métricas, Tendencias, Alertas, Recomendaciones
- [x] Scrollbar oculto para UX limpia

### PDF
- [x] Puppeteer local funcionando
- [ ] Subir PDFs a R2/S3
- [ ] Template de PDF con estilos

---

## Próximas Sesiones Priorizadas

### Session 14: API Bridge (Google/Facebook → ProcessedMetric)
**Objetivo:** Transformar JSON complejo de APIs a formato simplificado para AI

- [ ] Mapear Google Ads API response → `ProcessedMetric[]`
- [ ] Mapear Facebook Ads API response → `ProcessedMetric[]`
- [ ] Normalizar nombres de métricas (CPC, CTR, ROAS, etc.)
- [ ] Manejar diferentes monedas y formatos
- [ ] Cache de métricas transformadas
- [ ] Tests con datos reales de sandbox

### Session 15: Preview de Reporte + Logo Upload (Prioridad Alta)
**Por qué es crítico:**
> "El usuario de agencia tiene pánico a que el cliente vea algo mal configurado"
> "El logo es lo que hace que el cliente sienta que está pagando por un servicio premium"

- [ ] Preview modal antes de publicar dashboard
- [ ] Vista previa de cómo se verá en mobile
- [ ] Upload de logo a R2/S3
- [ ] Validación de imagen (tamaño, formato)
- [ ] Aplicar logo en header del dashboard
- [ ] Aplicar logo en PDF generado

### Session 16: Error Handling Producción
**Casos críticos a manejar:**

1. **División por cero en RCA**
   - [ ] Métricas con 0 clics o 0 gasto
   - [ ] Validar datos antes de enviar a Claude

2. **Tokens expirados**
   - [ ] Detectar token expirado (401/403)
   - [ ] UI para reconectar integración
   - [ ] Notificación al usuario

3. **Rate limits de APIs**
   - [ ] Anthropic: límites estrictos al inicio
   - [ ] Google/Facebook: quotas diarias
   - [ ] Implementar retry con backoff exponencial
   - [ ] Cola de requests si es necesario

4. **Fallbacks graceful**
   - [ ] Si AI falla → mostrar datos sin narrativa
   - [ ] Si integración falla → mostrar último cache
   - [ ] Mensajes de error user-friendly

### Session 17: Testing & Polish
- [ ] Test E2E: crear cliente → dashboard → compartir
- [ ] Performance: <3s load time
- [ ] Lighthouse score >90
- [ ] Documentación de API
- [ ] Video demo (2 min)

### White Label (Session 9)
- [ ] UI de configuración de branding
- [ ] Upload de logo
- [ ] Personalización de colores
- [ ] Aplicar branding en dashboards públicos

---

## Testing Pendiente

Ver `TESTING.md` para checklist completo.

### Prioridad Alta
- [ ] Probar flujo completo: crear cliente → crear reporte → generar insights
- [ ] Probar dashboard público con contraseña
- [ ] Probar OAuth con credenciales reales

### Prioridad Media
- [ ] Tests de seguridad (XSS, CSRF, SQL injection)
- [ ] Tests de performance con datos grandes

---

## Pre-Producción

- [ ] Configurar todas las variables de entorno
- [ ] Migrar DB a producción (Railway)
- [ ] Configurar dominio y SSL
- [ ] Actualizar redirect URIs de OAuth
- [ ] Configurar almacenamiento de PDFs
- [ ] Configurar monitoreo (Sentry, etc.)
- [ ] Backups de base de datos

---

## Notas Técnicas

### Archivos Clave
- `apps/web/server/utils/auth.ts` - JWT utilities
- `apps/web/composables/` - Estado global (useAuth, useClients, useReports, useDashboards)
- `apps/web/server/api/` - Todos los endpoints
- `packages/db/prisma/schema.prisma` - Modelo de datos

### Comandos de Desarrollo
```bash
# Iniciar desarrollo
docker-compose up -d && pnpm dev

# Base de datos
pnpm db:push    # Aplicar schema
pnpm db:seed    # Datos de demo

# Credenciales de demo
Email: admin@demo.agency
Password: demo123
Tenant: /demo
```
