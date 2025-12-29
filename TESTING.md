# TamarindoReports - Testing Checklist

> Este documento lista las funcionalidades que requieren testing manual y configuracion antes de produccion.
> Last updated: 2025-12-29 (Session 17)

## Estado General

| Modulo | Unit Tests | Integration | Manual Testing | Produccion Ready |
|--------|------------|-------------|----------------|------------------|
| Auth | - | - | Probado | Ready |
| Clients | - | - | Probado | Ready |
| Integrations | - | - | Estructura | Needs Config |
| Reports | - | - | Probado | Ready |
| Dashboards | - | - | Probado | Ready |
| AI (Claude) | - | - | Probado | Ready |
| AI (OpenAI) | - | - | Probado | Ready |
| PDF | - | - | Probado | Ready |
| Error Handling | - | - | Probado | Ready |

---

## 1. Autenticacion (Probado)

### Funcional
- [x] Login con email/password
- [x] Registro de nuevo usuario + tenant
- [x] Logout (limpia cookie)
- [x] Middleware auth global (redirige a login)
- [x] Middleware tenant (valida acceso)
- [x] Actualizar perfil
- [x] Cambiar password

### Pendiente de Probar
- [ ] Token expiration y refresh
- [ ] Rate limiting en login
- [ ] Validacion de email unico en registro

---

## 2. Clientes (Probado)

### Funcional
- [x] Listar clientes del tenant
- [x] Crear cliente nuevo
- [x] Editar cliente
- [x] Eliminar cliente

### Pendiente de Probar
- [ ] Paginacion con muchos clientes (>100)
- [ ] Validacion de campos requeridos

---

## 3. Integraciones OAuth (Requiere Configuracion)

### Prerrequisitos

```bash
# Configurar en .env:
GOOGLE_CLIENT_ID=<obtener de Google Cloud Console>
GOOGLE_CLIENT_SECRET=<obtener de Google Cloud Console>
FACEBOOK_APP_ID=<obtener de Meta Developer Portal>
FACEBOOK_APP_SECRET=<obtener de Meta Developer Portal>
```

### Flujos a Probar
- [ ] Conectar Google Ads (OAuth flow completo)
- [ ] Callback de Google guarda tokens encriptados
- [ ] Conectar Facebook Ads (OAuth flow completo)
- [ ] Callback de Facebook guarda tokens encriptados
- [ ] Desconectar integracion elimina tokens
- [ ] UI muestra estado correcto (connected/disconnected)
- [ ] Refresh de tokens cuando expiran
- [ ] Error banner cuando token expira

---

## 4. Dashboards (Probado)

### Funcional
- [x] CRUD completo
- [x] Wizard de creacion (3 pasos)
- [x] Live preview durante creacion
- [x] Editor unificado (2 columnas)
- [x] Auto-save con debounce
- [x] Drag-drop para reordenar widgets
- [x] Links publicos `/d/[slug]`
- [x] Password protection
- [x] Link expiration
- [x] Branding aplicado en vista publica

### Pendiente de Probar
- [ ] Dashboard con muchos widgets (>20)
- [ ] Rendimiento del live preview

---

## 5. AI Features (Probado con Mocks)

### RCA (Root Cause Analysis)
- [x] Endpoint `/api/ai/rca` funciona
- [x] Mock fallback cuando no hay API key
- [x] Componente `WidgetInsight.vue` muestra analisis
- [x] Flag `isFallback` se propaga al frontend
- [ ] Probar con ANTHROPIC_API_KEY real

### Forecasting
- [x] Algoritmo Holt-Winters implementado
- [x] Intervalos de confianza 80% y 95%
- [x] Componente `ForecastChart.vue` funciona
- [x] Manejo de datos invalidos (labels de fecha)

### Narrative Engine
- [x] Endpoint `/api/ai/narrative` funciona
- [x] Mock fallback cuando no hay API key
- [x] Componente `NarrativeCard.vue` con estilos
- [x] Tipos: executive-summary, widget-insight, recommendation, alert
- [ ] Probar con ANTHROPIC_API_KEY real

### Configuracion Requerida
```bash
# Para AI real (opcional, hay fallback a mocks)
ANTHROPIC_API_KEY=sk-ant-...  # Obtener en console.anthropic.com
OPENAI_API_KEY=sk-...          # Obtener en platform.openai.com
```

---

## 6. PDF Generation (Probado)

### Funcional
- [x] Puppeteer genera PDF localmente
- [x] Endpoint `/api/pdf/generate` funciona
- [x] Boton de descarga en UI
- [x] Status endpoint `/api/pdf/status`

### Pendiente
- [ ] Subir PDFs a R2/S3
- [ ] Template de PDF con estilos personalizados
- [ ] Branding del tenant en PDF

---

## 7. Error Handling (Probado)

### Funcional
- [x] `withRetry()` con exponential backoff
- [x] Jitter para evitar thundering herd
- [x] `AI_RETRY_OPTIONS` configurado
- [x] `INTEGRATION_RETRY_OPTIONS` configurado
- [x] `categorizeIntegrationError()` detecta token expirado
- [x] `IntegrationErrorBanner.vue` muestra UI de reconexion
- [x] `AIFallbackBadge.vue` indica datos demo
- [x] Fallback graceful para AI (mock data)

---

## 8. Mobile-First UI (Probado)

### Funcional
- [x] `MetricCardSwipeable.vue` con scroll horizontal
- [x] Snap scroll para metricas
- [x] Header responsive (compacto en mobile)
- [x] `RecommendationsCard.vue` con prioridades
- [x] `AlertsList.vue` con severidades
- [x] Scrollbar oculto

### Pendiente de Probar
- [ ] Dispositivos reales (iPhone, Android)
- [ ] Tablets

---

## Pruebas de Seguridad Pendientes

- [ ] SQL Injection en filtros de API
- [ ] XSS en campos de texto
- [ ] CSRF en formularios
- [ ] Rate limiting en endpoints sensibles
- [ ] Validacion de tenant en todas las operaciones
- [ ] Tokens de integracion encriptados en DB
- [ ] Passwords hasheadas con PBKDF2

---

## Pruebas de Performance Pendientes

- [ ] Carga de lista de dashboards (100+ dashboards)
- [ ] Carga de lista de clientes (100+ clientes)
- [ ] Tiempo de generacion de PDF
- [ ] Lighthouse score >90
- [ ] Load time <3s

---

## E2E Tests Pendientes

- [ ] Flujo completo: crear cliente -> crear dashboard -> compartir
- [ ] Flujo: conectar integracion -> sync metricas -> ver en dashboard
- [ ] Flujo: crear dashboard con wizard -> editar -> publicar

---

## Checklist Pre-Produccion

### Variables de Entorno
- [ ] DATABASE_URL (PostgreSQL produccion)
- [ ] JWT_SECRET (secreto fuerte)
- [ ] ENCRYPTION_KEY (32 bytes)
- [ ] ANTHROPIC_API_KEY (para AI)
- [ ] GOOGLE_CLIENT_ID/SECRET (para integraciones)
- [ ] FACEBOOK_APP_ID/SECRET (para integraciones)

### Infraestructura
- [ ] Base de datos PostgreSQL (Railway, Supabase, etc.)
- [ ] Redis para cache/colas
- [ ] Almacenamiento R2/S3 para logos y PDFs
- [ ] Dominio y SSL configurados
- [ ] OAuth redirect URIs actualizadas

### Monitoreo
- [ ] Logs configurados
- [ ] Sentry o similar para errores
- [ ] Backups de base de datos
- [ ] Alertas de uso de AI (costos)

---

## Quick Test Commands

```bash
# Start dev environment
docker-compose up -d && pnpm dev

# Demo credentials
Email: admin@demo.agency
Password: demo123
URL: http://localhost:3000/demo

# Check AI status
curl http://localhost:3000/api/ai/status

# Check PDF status
curl http://localhost:3000/api/pdf/status
```
