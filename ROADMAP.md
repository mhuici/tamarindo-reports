# Tamarindo Reports - Roadmap 2025

> Última actualización: 2026-01-03

## Estado Actual

### Integraciones Activas
- [x] Google Ads (OAuth completo)
- [x] Facebook Ads (OAuth completo)
- [x] Google Analytics 4 (OAuth completo) ✨ NEW
- [ ] TikTok Ads (infraestructura lista, falta API tokens)
- [ ] LinkedIn Ads (schema parcial)

### Features Completados
- [x] Multi-tenant architecture
- [x] OAuth 2.0 flow para integraciones
- [x] 6 tipos de widgets (Metric, Line, Bar, Pie, Table, Text)
- [x] AI Narratives (Claude Sonnet 4)
- [x] AI Insights (GPT-4o-mini)
- [x] Forecasting (Holt-Winters)
- [x] Root Cause Analysis (Claude)
- [x] PDF Export con branding
- [x] Public dashboards con password protection
- [x] White-label completo (logo, colores, fonts)
- [x] Client management
- [x] Role-based access (Owner, Admin, Member, Viewer)
- [x] Dashboard wizard
- [x] Widget configuration panel
- [x] Metrics Explorer (cross-platform data view) ✨ NEW

---

## Comparación con Competencia

| Métrica | Tamarindo | Reporting Ninja | AgencyAnalytics | Databox |
|---------|-----------|-----------------|-----------------|---------|
| Integraciones | 5 | 20+ | 80+ | 130+ |
| AI Features | 4 | 0 | 3 | 1 |
| Templates | 0 | 20+ | 50+ | 300+ |

### Ventajas Competitivas
1. **Root Cause Analysis** - Único en el mercado
2. **AI Narratives con Claude** - Superior a competencia
3. **Forecasting integrado** - Solo AgencyAnalytics lo tiene
4. **Stack moderno** - Nuxt 3, Vue 3, TypeScript

### Gaps Principales
1. Pocas integraciones (5 vs 20-130+)
2. Sin scheduled reports
3. Sin templates prebuilt

---

## Fase 1: Integraciones Críticas
**Objetivo:** Alcanzar paridad con Reporting Ninja en plataformas core

### P1.1 - Google Analytics 4 ✅ COMPLETADO
- [x] OAuth flow para GA4 (connect.get.ts, callback.get.ts)
- [x] Fetch de métricas: sessions, users, pageviews, bounce rate
- [x] GoogleAnalyticsConnector + GoogleAnalyticsAdapter
- [x] Mock connector para demo mode
- [x] Widget de GA4 metrics (compatible con widgets existentes)
- **Estado:** COMPLETADO (2025-01-03)

### P1.2 - Instagram Insights (Orgánico)
- [ ] Usar Facebook Graph API para Instagram Business
- [ ] Métricas: followers, reach, impressions, engagement
- [ ] Posts performance
- [ ] Stories analytics
- **Prioridad:** ALTA
- **Dependencias:** Facebook App con instagram_basic scope

### P1.3 - Completar TikTok Ads
- [ ] Obtener API access de TikTok Business
- [ ] Implementar OAuth flow
- [ ] Sync de campañas y métricas
- **Prioridad:** ALTA
- **Dependencias:** TikTok Business Center approval

### P1.4 - Completar LinkedIn Ads
- [ ] OAuth flow completo
- [ ] Campaign metrics sync
- [ ] Account selection UI
- **Prioridad:** MEDIA
- **Dependencias:** LinkedIn Marketing API access

---

## Fase 2: Automatización de Reportes
**Objetivo:** Equiparar features de scheduling y delivery

### P2.1 - Scheduled Reports
- [ ] Modelo de Schedule en DB (cron expression, timezone)
- [ ] Job runner (node-cron o similar)
- [ ] UI para configurar schedule (daily, weekly, monthly)
- [ ] Preview de próxima ejecución
- **Prioridad:** CRÍTICA

### P2.2 - Email Dispatch
- [ ] Integración con servicio de email (Resend/SendGrid)
- [ ] Templates de email para reportes
- [ ] Adjuntar PDF o link al dashboard
- [ ] Lista de destinatarios por reporte
- **Prioridad:** CRÍTICA

### P2.3 - Templates Prebuilt
- [ ] Template: PPC Performance (Google + Facebook)
- [ ] Template: Social Media Overview
- [ ] Template: Monthly Client Report
- [ ] Template: Campaign Analysis
- [ ] Template: Executive Summary
- [ ] UI para seleccionar template al crear reporte
- **Prioridad:** ALTA

---

## Fase 3: Analytics Avanzados
**Objetivo:** Diferenciación con AI/ML features

### P3.1 - Anomaly Detection
- [ ] Algoritmo de detección (Z-score o IQR)
- [ ] Alertas automáticas por email
- [ ] UI de alertas en dashboard
- [ ] Configuración de thresholds
- **Prioridad:** MEDIA

### P3.2 - Goal Tracking
- [ ] Modelo de Goals en DB
- [ ] UI para definir objetivos por métrica
- [ ] Visualización de progreso vs objetivo
- [ ] Alertas cuando se alcanza/falla objetivo
- **Prioridad:** MEDIA

### P3.3 - Benchmarking Básico
- [ ] Datos de benchmark por industria (manual o API)
- [ ] Comparación de métricas vs industria
- [ ] Widget de benchmark
- **Prioridad:** BAJA

---

## Fase 4: Expansión de Plataformas
**Objetivo:** Ampliar cobertura de integraciones

### P4.1 - YouTube Analytics
- [ ] OAuth con YouTube Data API
- [ ] Métricas: views, watch time, subscribers
- [ ] Channel performance
- **Prioridad:** MEDIA

### P4.2 - Twitter/X Analytics
- [ ] API v2 de Twitter
- [ ] Métricas: impressions, engagement, followers
- [ ] Tweet performance
- **Prioridad:** MEDIA

### P4.3 - Email Marketing
- [ ] Mailchimp integration
- [ ] Métricas: opens, clicks, unsubscribes
- [ ] Campaign performance
- **Prioridad:** BAJA

### P4.4 - Microsoft/Bing Ads
- [ ] Microsoft Advertising API
- [ ] Campaign metrics sync
- **Prioridad:** BAJA

---

## Fase 5: Client Experience
**Objetivo:** Mejorar experiencia de clientes finales

### P5.1 - Client Portal Dedicado
- [ ] Login separado para clientes
- [ ] Vista simplificada de sus reportes
- [ ] Acceso solo a sus dashboards
- [ ] Notificaciones de nuevos reportes
- **Prioridad:** MEDIA

### P5.2 - Mobile App (PWA)
- [ ] Configurar PWA en Nuxt
- [ ] Optimizar vistas para móvil
- [ ] Push notifications
- **Prioridad:** BAJA

---

## Backlog / Ideas Futuras

- [ ] Looker Studio connector
- [ ] Google Sheets add-on
- [ ] API pública para integraciones externas
- [ ] Shopify/eCommerce integrations
- [ ] HubSpot CRM integration
- [ ] Custom calculated metrics
- [ ] A/B test analysis
- [ ] Multi-language reports (EN/ES)
- [ ] Comentarios en reportes
- [ ] Versioning de reportes
- [ ] Bulk operations (exportar múltiples reportes)

---

## Changelog

### 2026-01-03
- Implementación de Metrics Explorer completa
  - Vista cross-platform de métricas (Google Ads, Facebook Ads, GA4)
  - Filtros por plataforma, cliente y rango de fechas
  - KPIs con comparación de período anterior
  - Tabla de breakdown por plataforma
  - Gráfico de tendencia diaria
  - Export a CSV

### 2025-01-03
- Análisis inicial de competencia
- Definición de roadmap v1
- Identificación de gaps vs Reporting Ninja, AgencyAnalytics, Databox

---

## Referencias

- [Reporting Ninja](https://www.reportingninja.com/)
- [AgencyAnalytics](https://agencyanalytics.com/)
- [DashThis](https://dashthis.com/)
- [Databox](https://databox.com/)
