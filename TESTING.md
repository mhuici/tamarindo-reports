# TamarindoReports - Testing Checklist

> Este documento lista las funcionalidades que requieren testing manual y configuración antes de producción.

## Estado General

| Módulo | Unit Tests | Integration | Manual Testing | Producción Ready |
|--------|------------|-------------|----------------|------------------|
| Auth | ❌ | ❌ | ✅ Probado | 🟡 |
| Clients | ❌ | ❌ | ✅ Probado | 🟡 |
| Integrations | ❌ | ❌ | ⚠️ Pendiente | 🔴 |
| Reports | ❌ | ❌ | ⚠️ Pendiente | 🔴 |
| Dashboards | ❌ | ❌ | ⚠️ Pendiente | 🔴 |
| PDF Worker | ❌ | ❌ | ⚠️ Estructura | 🔴 |
| AI Insights | ❌ | ❌ | ⚠️ Pendiente | 🔴 |

---

## 1. Autenticación (Probado ✅)

### Funcional
- [x] Login con email/password
- [x] Registro de nuevo usuario + tenant
- [x] Logout (limpia cookie)
- [x] Middleware auth global (redirige a login)
- [x] Middleware tenant (valida acceso)
- [x] Actualizar perfil
- [x] Cambiar contraseña

### Pendiente de Probar
- [ ] Token expiration y refresh
- [ ] Rate limiting en login
- [ ] Validación de email único en registro
- [ ] Google OAuth login (no implementado aún)

---

## 2. Clientes (Probado ✅)

### Funcional
- [x] Listar clientes del tenant
- [x] Crear cliente nuevo
- [x] Editar cliente
- [x] Eliminar cliente
- [x] Filtro por estado activo/inactivo

### Pendiente de Probar
- [ ] Paginación con muchos clientes (>100)
- [ ] Validación de campos requeridos en formulario
- [ ] Manejo de errores de red

---

## 3. Integraciones OAuth (⚠️ REQUIERE CONFIGURACIÓN)

### Prerrequisitos para Probar

```bash
# Configurar en .env:
GOOGLE_CLIENT_ID=<obtener de Google Cloud Console>
GOOGLE_CLIENT_SECRET=<obtener de Google Cloud Console>
FACEBOOK_APP_ID=<obtener de Meta Developer Portal>
FACEBOOK_APP_SECRET=<obtener de Meta Developer Portal>
```

### Pasos para Configurar Google Ads API
1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear proyecto nuevo o seleccionar existente
3. Habilitar APIs:
   - Google Ads API
   - Google Analytics Data API (opcional)
4. Configurar OAuth consent screen:
   - User Type: External
   - App name, email, logo
   - Scopes: `https://www.googleapis.com/auth/adwords`
5. Crear OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/integrations/google-ads/callback`
     - `https://tudominio.com/api/integrations/google-ads/callback`
6. Copiar Client ID y Client Secret

### Pasos para Configurar Facebook Ads API
1. Ir a [Meta Developer Portal](https://developers.facebook.com)
2. Crear nueva app (tipo Business)
3. Agregar productos:
   - Facebook Login
   - Marketing API
4. Configurar Facebook Login:
   - Valid OAuth Redirect URIs:
     - `http://localhost:3000/api/integrations/facebook-ads/callback`
     - `https://tudominio.com/api/integrations/facebook-ads/callback`
5. Copiar App ID y App Secret
6. Solicitar permisos en App Review:
   - `ads_read`
   - `read_insights`

### Flujos a Probar
- [ ] Conectar Google Ads (OAuth flow completo)
- [ ] Callback de Google guarda tokens encriptados
- [ ] Conectar Facebook Ads (OAuth flow completo)
- [ ] Callback de Facebook guarda tokens encriptados
- [ ] Desconectar integración elimina tokens
- [ ] UI muestra estado correcto (connected/disconnected)
- [ ] Refresh de tokens cuando expiran

---

## 4. Reportes (⚠️ Pendiente Testing Manual)

### Funcional Implementado
- [x] API CRUD completa
- [x] Lista de reportes con filtros
- [x] Crear reporte nuevo
- [x] Editor de reporte
- [x] Agregar/quitar widgets
- [x] Guardar borrador

### Pendiente de Probar
- [ ] Crear reporte seleccionando cliente
- [ ] Filtros por tipo (Monthly, Weekly, Campaign, Custom)
- [ ] Filtros por estado (Draft, Completed, Scheduled)
- [ ] Presets de fecha funcionan correctamente
- [ ] Widgets se guardan y cargan correctamente
- [ ] Cambiar tamaño de widgets
- [ ] Reordenar widgets (mover arriba/abajo)
- [ ] Eliminar reporte
- [ ] Estado "GENERATING" simula generación

### Widgets Pendientes de Testing
- [ ] WidgetMetric muestra valor y tendencia
- [ ] WidgetChart renderiza línea/barra/pie
- [ ] WidgetTable muestra datos tabulares
- [ ] WidgetText permite edición

### Integración Pendiente
- [ ] Widgets conectados a datos reales de integraciones
- [ ] Selector de métricas por fuente de datos

---

## 5. Dashboards (⚠️ Pendiente Testing Manual)

### Funcional Implementado
- [x] API CRUD completa
- [x] Lista de dashboards
- [x] Crear dashboard con modal
- [x] Editor de dashboard
- [x] Vista pública sin autenticación
- [x] Generación de slug único
- [x] Copiar link al portapapeles
- [x] Protección con contraseña
- [x] Soporte de expiración

### Pendiente de Probar
- [ ] Crear dashboard seleccionando cliente
- [ ] Configurar como público/privado
- [ ] Acceder via link público `/d/[slug]`
- [ ] Ingresar contraseña correcta muestra dashboard
- [ ] Ingresar contraseña incorrecta muestra error
- [ ] Dashboard expirado muestra mensaje de error
- [ ] Dashboard privado muestra error 403
- [ ] Copiar link funciona en navegador
- [ ] Widgets se guardan y cargan correctamente
- [ ] Settings modal actualiza nombre/público/contraseña

---

## 6. PDF Worker (⚠️ Estructura Lista)

### Funcional Implementado
- [x] PDF generator service structure
- [x] Generate PDF API endpoint
- [x] PDF status check endpoint
- [x] Mock PDF for testing
- [x] Support for external PDF services

### Pendiente de Probar
- [ ] External PDF service integration (Browserless, etc.)
- [ ] Puppeteer local generation
- [ ] R2/S3 storage upload
- [ ] PDF download from report page

### Configuración Requerida
```bash
# Option 1: External PDF service
PDF_SERVICE_URL=<browserless.io or similar>
PDF_SERVICE_API_KEY=<api key>

# Option 2: Puppeteer
PUPPETEER_ENABLED=true
```

---

## 7. AI Insights (⚠️ Pendiente Testing Manual)

### Funcional Implementado
- [x] OpenAI client configuration
- [x] Insights prompt engineering (Spanish)
- [x] Generate insights API endpoint
- [x] Mock insights for testing without API key
- [x] AI status check endpoint
- [x] UI for generating and displaying insights

### Pendiente de Probar
- [ ] Generar insights con API key real de OpenAI
- [ ] Verificar formato de respuesta con GPT-4o-mini
- [ ] Regenerar insights (sobrescribe anterior)
- [ ] Insights sin datos de métricas (recomendaciones generales)
- [ ] Manejo de errores (rate limit, API key inválida)

### Configuración Requerida
```bash
OPENAI_API_KEY=<obtener de platform.openai.com>
```

### Modelo Utilizado
- GPT-4o-mini ($0.15/1M input tokens, $0.60/1M output tokens)

---

## Pruebas de Seguridad Pendientes

- [ ] SQL Injection en filtros de API
- [ ] XSS en campos de texto (nombre de cliente, reporte)
- [ ] CSRF en formularios
- [ ] Rate limiting en endpoints sensibles
- [ ] Validación de tenant en todas las operaciones
- [ ] Tokens de integración encriptados en DB
- [ ] Contraseñas hasheadas con PBKDF2

---

## Pruebas de Performance Pendientes

- [ ] Carga de lista de reportes (100+ reportes)
- [ ] Carga de lista de clientes (100+ clientes)
- [ ] Tiempo de generación de PDF
- [ ] Memoria usada por Puppeteer

---

## Cómo Ejecutar Tests (Futuro)

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage
```

---

## Checklist Pre-Producción

- [ ] Todas las variables de entorno configuradas
- [ ] Base de datos PostgreSQL en Railway/producción
- [ ] Redis para colas (si aplica)
- [ ] Almacenamiento S3/R2 configurado
- [ ] Dominio y SSL configurados
- [ ] OAuth redirect URIs actualizadas a producción
- [ ] Rate limiting habilitado
- [ ] Logs configurados
- [ ] Monitoreo de errores (Sentry, etc.)
- [ ] Backups de base de datos
