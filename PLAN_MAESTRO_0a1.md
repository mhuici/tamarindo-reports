# PLAN MAESTRO DE EJECUCIÓN: TamarindoReports 0→1

## VISIÓN GENERAL DEL PLAN

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DE MÓDULOS                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FASE 1: DIFERENCIACIÓN VISIBLE (Semana 1-2)                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │  Módulo 1   │───▶│  Módulo 2   │───▶│  Módulo 3   │             │
│  │ Insight     │    │ Resumen     │    │ Landing     │             │
│  │ Button      │    │ Ejecutivo   │    │ Competitiva │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│       ▼                                                             │
│  FASE 2: RETENCIÓN PROACTIVA (Semana 3-4)                          │
│  ┌─────────────┐    ┌─────────────┐                                │
│  │  Módulo 4   │───▶│  Módulo 5   │                                │
│  │ Alertas     │    │ Onboarding  │                                │
│  │ Inteligentes│    │ Guiado      │                                │
│  └─────────────┘    └─────────────┘                                │
│       ▼                                                             │
│  FASE 3: VALIDACIÓN COMERCIAL (Semana 5-6)                         │
│  ┌─────────────┐    ┌─────────────┐                                │
│  │  Módulo 6   │───▶│  Módulo 7   │                                │
│  │ Pricing &   │    │ Beta        │                                │
│  │ Trials      │    │ Launch      │                                │
│  └─────────────┘    └─────────────┘                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## DOLOR → MÓDULO: MATRIZ DE IMPACTO

| Dolor del Usuario | Módulo que lo resuelve | Impacto |
|-------------------|------------------------|---------|
| "Cliente pregunta POR QUÉ bajó y no sé qué responder" | **Módulo 1**: Insight Button | 🔥🔥🔥 |
| "Paso 30 min escribiendo resumen para cada cliente" | **Módulo 2**: Resumen Ejecutivo | 🔥🔥🔥 |
| "No sé si este SaaS es confiable o desaparecerá" | **Módulo 3**: Landing Competitiva | 🔥🔥 |
| "Me entero de problemas cuando el cliente me reclama" | **Módulo 4**: Alertas Inteligentes | 🔥🔥🔥 |
| "Setup de nueva herramienta toma semanas" | **Módulo 5**: Onboarding Guiado | 🔥🔥 |
| "No sé cuánto cuesta hasta que hablo con ventas" | **Módulo 6**: Pricing Transparente | 🔥🔥 |

---

# FASE 1: DIFERENCIACIÓN VISIBLE

## MÓDULO 1: INSIGHT BUTTON ("¿Por qué?")

### Contexto Estratégico
Este es el **Factor X** que ningún competidor tiene. Supermetrics muestra números. AgencyAnalytics muestra gráficas. Tú vas a mostrar **inteligencia**.

### Objetivo
Validar que el RCA existente puede exponerse en UI de forma que el usuario perciba valor inmediato en <5 segundos.

### Especificación Técnica

**UI Target:**
```
┌──────────────────────────────────────────────┐
│  ROAS                                        │
│  ┌────────────────────────────────────────┐  │
│  │        2.3x         │  ↓ 15%           │  │
│  │                     │  vs prev period  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [🔍 ¿Por qué cambió?]  ← NUEVO BOTÓN       │
│                                              │
└──────────────────────────────────────────────┘
          │
          ▼ (click)
┌──────────────────────────────────────────────┐
│  📊 Análisis de Causa                        │
│  ─────────────────────────────────────────── │
│  Tu ROAS bajó porque:                        │
│                                              │
│  • CTR cayó 18% (2.1% → 1.7%)               │
│  • CPC subió 12% ($0.45 → $0.50)            │
│  • Conversiones estables (sin cambio)       │
│                                              │
│  💡 Causa probable:                          │
│  Fatiga de audiencia. El mismo público ha    │
│  visto tus anuncios 4.2x en promedio.       │
│                                              │
│  ✅ Acción recomendada:                      │
│  Expande tu audiencia o rota creativos.     │
│                                              │
│  [Copiar análisis]  [Cerrar]                │
└──────────────────────────────────────────────┘
```

**Factor X Técnico:**
1. **Latencia <3s**: El RCA debe sentirse instantáneo. Implementar streaming de respuesta Claude.
2. **Contexto automático**: El botón NO pide información extra. Ya sabe qué métrica, qué período, qué cliente.
3. **Copy-paste ready**: El análisis está escrito para pegarlo directo en email al cliente.

**Arquitectura:**
```
MetricWidget.vue
    │
    ├── [Click "¿Por qué?"]
    │         │
    │         ▼
    │   useRCA.ts (composable existente)
    │         │
    │         ▼
    │   POST /api/ai/rca
    │         │
    │         ├── Streaming response (SSE)
    │         │
    │         ▼
    │   InsightModal.vue (NUEVO)
    │         │
    │         └── Renderiza análisis progresivamente
    │
    └── [Copiar] → Clipboard API
```

### Prompt de Acción

```
Módulo 1: Implementar el "Insight Button" en los widgets de métricas.

Contexto:
- Ya existe useRCA.ts y el endpoint /api/ai/rca
- Necesito exponer esto en la UI de widgets

Tareas:
1. Crear componente InsightModal.vue que muestre el análisis RCA
2. Añadir botón "¿Por qué cambió?" en MetricWidget.vue (o equivalente)
3. Implementar streaming SSE para que la respuesta aparezca progresivamente
4. Añadir botón "Copiar análisis" con formato listo para email
5. Manejar estados: loading, error, sin datos suficientes

Requisitos UX:
- El modal debe abrir en <200ms
- La respuesta debe empezar a aparecer en <1s (streaming)
- El texto debe estar formateado para copiar directo a email del cliente
```

### Entregable Esperado
- `InsightModal.vue` - Componente modal con análisis RCA
- `MetricWidget.vue` modificado - Con botón "¿Por qué?"
- Endpoint modificado para SSE streaming (si no existe)
- Demo funcional en dashboard existente

### Criterio de Éxito
- [ ] Usuario puede hacer click en cualquier métrica con cambio >5%
- [ ] Análisis aparece en <3 segundos
- [ ] Texto copiado es usable sin edición en email profesional

---

## MÓDULO 2: RESUMEN EJECUTIVO 1-CLICK

### Contexto Estratégico
El usuario de agencia pasa 30-60 minutos POR CLIENTE escribiendo el email semanal. Este módulo reduce eso a 30 segundos.

### Objetivo
Generar documento de 1 página listo para enviar al cliente, combinando métricas + RCA + recomendaciones.

### Especificación Técnica

**Output Target:**
```markdown
# Resumen Semanal: [Nombre Cliente]
**Período:** 6-12 Enero 2026

## 📊 Métricas Clave
| Métrica | Esta semana | Anterior | Cambio |
|---------|-------------|----------|--------|
| Spend   | $4,250      | $3,800   | +12%   |
| ROAS    | 2.3x        | 2.8x     | -18%   |
| Conv.   | 142         | 128      | +11%   |

## 🔍 Análisis
Tu ROAS bajó esta semana principalmente por aumento en CPC
(+22%). Esto coincide con mayor competencia en el segmento
25-34 años durante período post-navideño.

## ✅ Recomendación
Reducir bid en audiencia 25-34 temporalmente y redistribuir
budget hacia 35-44 donde CPC se mantiene estable.

## 📈 Próxima Semana
Proyección de spend: $4,500 | ROAS esperado: 2.5x

---
*Generado por TamarindoReports • [fecha]*
```

**Factor X Técnico:**
1. **Tono configurable**: Formal para corporativos, casual para startups
2. **Idioma automático**: Detecta idioma del tenant (ya tienes `settings.language`)
3. **Formato dual**: Markdown (para email) + PDF (para adjuntar)

**Arquitectura:**
```
Dashboard/Report View
    │
    ├── [Click "Generar Resumen"]
    │         │
    │         ▼
    │   ExecutiveSummaryModal.vue (NUEVO)
    │         │
    │         ├── Paso 1: Seleccionar métricas (pre-seleccionadas)
    │         ├── Paso 2: Elegir tono (professional/casual/technical)
    │         ├── Paso 3: Preview + edición ligera
    │         │
    │         ▼
    │   POST /api/ai/executive-summary (NUEVO)
    │         │
    │         ├── Llama narrative engine
    │         ├── Llama RCA para métrica con mayor cambio
    │         ├── Llama forecast para proyección
    │         │
    │         ▼
    │   Retorna: { markdown, pdf_url }
    │
    └── [Copiar MD] / [Descargar PDF] / [Enviar por email]
```

### Prompt de Acción

```
Módulo 2: Implementar "Resumen Ejecutivo 1-Click"

Contexto:
- Ya existen: narrative-engine.ts, rca-agent.ts, forecast.ts
- Necesito combinarlos en un solo output ejecutivo

Tareas:
1. Crear endpoint POST /api/ai/executive-summary que:
   - Reciba: clientId, dateRange, selectedMetrics[], tone, language
   - Llame al narrative engine para resumen
   - Llame a RCA para la métrica con mayor cambio negativo
   - Llame a forecast para proyección
   - Retorne markdown estructurado

2. Crear ExecutiveSummaryModal.vue con:
   - Selector de métricas a incluir (checkbox)
   - Selector de tono (3 opciones)
   - Preview en vivo del markdown
   - Botones: Copiar | Descargar PDF | Enviar email

3. Añadir botón "📄 Resumen Ejecutivo" en:
   - Vista de cliente individual
   - Vista de dashboard
   - Vista de reporte
```

### Entregable Esperado
- `POST /api/ai/executive-summary` - Endpoint combinado
- `ExecutiveSummaryModal.vue` - UI completa
- Template PDF con branding
- Botón integrado en 3 vistas

### Criterio de Éxito
- [ ] Resumen generado en <10 segundos
- [ ] Texto markdown funciona sin edición en email
- [ ] PDF tiene branding del tenant aplicado
- [ ] Usuario puede enviar directo desde modal (opcional)

---

## MÓDULO 3: LANDING PAGE COMPETITIVA

### Contexto Estratégico
Tu landing actual dice "Marketing Reports Made Easy". Eso dice TODO EL MUNDO. Necesitas una landing que en 5 segundos comunique por qué eres diferente.

### Objetivo
Rediseñar landing para comunicar UVP ("Te dice POR QUÉ, no solo QUÉ") y generar confianza.

### Especificación Técnica

**Estructura de Landing:**
```
┌─────────────────────────────────────────────────────────────────┐
│ HERO SECTION                                                    │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ "Deja de explicar QUÉ pasó.                                    │
│  Muestra POR QUÉ pasó."                                        │
│                                                                 │
│ El único software de reportes con análisis de causa            │
│ automático. Tu cliente entiende sin que tú expliques.          │
│                                                                 │
│ [Ver demo interactivo]  [Empezar gratis - 14 días]             │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │  [DEMO INTERACTIVO]                                      │    │
│ │  Widget con métrica real + botón "¿Por qué?"            │    │
│ │  Usuario puede hacer click y ver RCA en vivo            │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ PROBLEMA/SOLUCIÓN                                               │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ ❌ Otros dashboards          ✅ TamarindoReports               │
│ "Tu ROAS bajó 15%"           "Tu ROAS bajó 15% porque          │
│                               tu CTR cayó por fatiga           │
│                               de audiencia. Rota creativos."   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ FEATURES (3 principales)                                        │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ [🔍 Análisis de Causa]  [📄 Resumen 1-Click]  [⚠️ Alertas]    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ COMPARACIÓN VS COMPETENCIA                                      │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ |                    | Supermetrics | AgencyAn. | Tamarindo |  │
│ | Análisis de causa  |      ❌      |     ❌    |    ✅     |  │
│ | Precio flat        |      ❌      |     ✅    |    ✅     |  │
│ | Narrativas AI      |      ❌      |     ❌    |    ✅     |  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ SOCIAL PROOF                                                    │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ "Ahorro 4 horas por semana en reportes. El análisis            │
│  automático es lo que mis clientes necesitaban."               │
│  — María G., Agencia Digital MX                                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ PRICING (transparente)                                          │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ [Starter $49/mes]  [Agency $99/mes]  [Enterprise - Contactar]  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ CTA FINAL                                                       │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ "Prueba el análisis de causa ahora mismo."                     │
│ [Crear cuenta gratis - Sin tarjeta]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Factor X Técnico:**
1. **Demo interactivo en landing**: Widget REAL con datos mock que el visitante puede clickear
2. **RCA en vivo**: El visitante hace click en "¿Por qué?" y ve la magia SIN registrarse
3. **Comparación directa**: Tabla que ataca a competidores por nombre

### Prompt de Acción

```
Módulo 3: Rediseñar Landing Page con UVP competitiva

Contexto:
- Landing actual es genérica ("Marketing Reports Made Easy")
- Necesito comunicar diferenciador: análisis de causa automático
- Debe incluir demo interactivo donde visitante prueba RCA sin registrarse

Tareas:
1. Rediseñar pages/index.vue con nueva estructura:
   - Hero con UVP clara + demo interactivo
   - Sección problema/solución lado a lado
   - Features principales (3 cards)
   - Tabla comparativa vs Supermetrics/AgencyAnalytics
   - Testimonios (placeholder por ahora)
   - Pricing transparente
   - CTA final

2. Crear componente InteractiveDemo.vue:
   - Widget de métrica con datos mock
   - Botón "¿Por qué?" funcional
   - Llama a /api/ai/rca con mock data
   - Muestra resultado real de Claude

3. Crear componente ComparisonTable.vue:
   - Compara features vs 3 competidores
   - Checkmarks para features que tenemos
   - X para features que ellos no tienen

4. Crear componente PricingSection.vue:
   - 3 tiers: Starter, Agency, Enterprise
   - Precios visibles (no "contactar")
   - Feature list por tier
```

### Entregable Esperado
- `pages/index.vue` rediseñado completamente
- `InteractiveDemo.vue` - Demo funcional en landing
- `ComparisonTable.vue` - Tabla competitiva
- `PricingSection.vue` - Pricing transparente
- Mobile responsive verificado

### Criterio de Éxito
- [ ] Visitante entiende diferenciador en <5 segundos
- [ ] Demo interactivo funciona sin registro
- [ ] Pricing visible sin clicks adicionales
- [ ] Mobile score >90 en Lighthouse

---

# FASE 2: RETENCIÓN PROACTIVA

## MÓDULO 4: ALERTAS INTELIGENTES

### Contexto Estratégico
El dolor más grande: enterarse de problemas DESPUÉS de que el cliente reclama. Las alertas convierten al usuario de reactivo a proactivo.

### Objetivo
Sistema de alertas automáticas que detecta anomalías y notifica por email con análisis de causa incluido.

### Especificación Técnica

**Flujo de Alertas:**
```
┌─────────────────────────────────────────────────────────────────┐
│                      PIPELINE DE ALERTAS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CRON JOB (diario, 8am timezone del tenant)                 │
│     │                                                           │
│     ▼                                                           │
│  2. Para cada cliente activo:                                   │
│     │                                                           │
│     ├── Fetch métricas últimos 7 días                          │
│     ├── Comparar vs 7 días anteriores                          │
│     │                                                           │
│     ▼                                                           │
│  3. DETECCIÓN DE ANOMALÍAS                                      │
│     │                                                           │
│     ├── Cambio >15% en métrica clave? → ALERTA                 │
│     ├── Spend >120% del promedio? → ALERTA                     │
│     ├── ROAS <80% del objetivo? → ALERTA                       │
│     │                                                           │
│     ▼                                                           │
│  4. Si hay alertas:                                             │
│     │                                                           │
│     ├── Ejecutar RCA para cada anomalía                        │
│     ├── Generar email con análisis                             │
│     ├── Enviar via Resend                                       │
│     ├── Guardar en DB (AlertLog)                               │
│     │                                                           │
│     ▼                                                           │
│  5. Dashboard: Badge de alertas pendientes                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Email de Alerta:**
```
Asunto: ⚠️ [Cliente X] ROAS bajó 23% - Acción requerida

Hola [Nombre],

Detectamos un cambio significativo en las métricas de [Cliente X]:

📉 ROAS: 3.2x → 2.5x (-23%)
📈 CPC: $0.45 → $0.58 (+29%)
➡️ Spend: $2,100 (sin cambio)

🔍 ANÁLISIS AUTOMÁTICO:
El incremento en CPC sugiere mayor competencia en tu
audiencia principal (25-34, intereses: fitness).
Esto coincide con inicio de campañas de competidores
en período post-navideño.

✅ ACCIÓN RECOMENDADA:
1. Revisar Auction Insights en Google Ads
2. Considerar expandir audiencia a 35-44
3. Rotar creativos si tienen >10 días activos

[Ver dashboard completo] [Marcar como resuelta]

---
Configurar alertas: [Preferencias]
```

**Factor X Técnico:**
1. **RCA incluido**: No solo "bajó", sino "bajó PORQUE..."
2. **Acción específica**: No genérico, sino pasos concretos
3. **1-click resolve**: Usuario puede marcar como resuelta desde email

**Arquitectura:**
```
Nuevo modelo: Alert
    │
    ├── id, tenantId, clientId
    ├── metric (roas, cpc, spend, etc)
    ├── previousValue, currentValue, changePercent
    ├── severity (warning, critical)
    ├── rcaAnalysis (JSON del RCA)
    ├── status (pending, acknowledged, resolved)
    ├── notifiedAt, resolvedAt
    │
Nuevo endpoint: POST /api/cron/check-alerts
    │
    ├── Itera clientes activos
    ├── Detecta anomalías
    ├── Ejecuta RCA
    ├── Envía email
    ├── Guarda Alert
    │
Nuevo endpoint: POST /api/alerts/[id]/resolve
    │
    └── Marca como resuelta

Nuevo componente: AlertsBadge.vue
    │
    └── Muestra contador en navbar

Nuevo componente: AlertsPanel.vue
    │
    └── Lista de alertas con acciones
```

### Prompt de Acción

```
Módulo 4: Implementar Sistema de Alertas Inteligentes

Contexto:
- Los usuarios se enteran de problemas cuando el cliente reclama
- Queremos detectar anomalías proactivamente y notificar con análisis

Tareas:
1. Crear modelo Alert en Prisma schema
2. Crear endpoint POST /api/cron/check-alerts
3. Crear template de email de alerta
4. Crear endpoint POST /api/alerts/[id]/resolve
5. Crear AlertsBadge.vue y AlertsPanel.vue
6. Crear página /[tenant]/alerts
```

### Entregable Esperado
- Modelo `Alert` en Prisma
- `POST /api/cron/check-alerts` - Cron de detección
- `POST /api/alerts/[id]/resolve` - Resolver alerta
- Template email HTML
- `AlertsBadge.vue` + `AlertsPanel.vue`
- Página `/[tenant]/alerts`

### Criterio de Éxito
- [ ] Cron detecta anomalías correctamente
- [ ] Email incluye análisis RCA real
- [ ] Usuario puede resolver desde email (1-click)
- [ ] Badge muestra contador actualizado

---

## MÓDULO 5: ONBOARDING GUIADO

### Contexto Estratégico
Usuario nuevo ve dashboard vacío. No sabe qué hacer primero. Abandona. El onboarding guiado reduce fricción de "¿y ahora qué?".

### Objetivo
Flujo paso a paso que lleva al usuario de registro a primer reporte en <10 minutos.

### Especificación Técnica

**Flujo de Onboarding:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    ONBOARDING: 5 PASOS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PASO 1: Bienvenida (30s)                                       │
│  PASO 2: Conectar plataforma (2min)                            │
│  PASO 3: Crear cliente (1min)                                   │
│  PASO 4: Primer dashboard (2min)                                │
│  PASO 5: Wow moment (30s)                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Factor X Técnico:**
1. **Datos reales desde paso 2**: No mock, datos del usuario
2. **Template inteligente**: Pre-selecciona métricas basado en plataforma conectada
3. **Wow moment con AI**: El último paso muestra el diferenciador (RCA)

### Prompt de Acción

```
Módulo 5: Implementar Onboarding Guiado

Tareas:
1. Crear modelo OnboardingProgress en Prisma
2. Crear componente OnboardingWizard.vue
3. Crear páginas de onboarding (5 pasos)
4. Modificar flujo post-registro
5. Crear OnboardingChecklist.vue
6. Implementar "Wow moment"
```

### Entregable Esperado
- Modelo `OnboardingProgress`
- `OnboardingWizard.vue` - Contenedor principal
- 5 páginas de pasos
- `OnboardingChecklist.vue` - Widget en dashboard
- Flujo post-registro modificado

### Criterio de Éxito
- [ ] Usuario completa onboarding en <10 minutos
- [ ] Tiene dashboard funcional con datos reales al terminar
- [ ] Ve el "wow moment" (RCA) antes de terminar
- [ ] Puede retomar si abandona a mitad

---

# FASE 3: VALIDACIÓN COMERCIAL

## MÓDULO 6: PRICING & TRIALS

### Contexto Estratégico
Sin pricing claro, el usuario asume que es caro o que no estás listo. Pricing transparente genera confianza y filtra leads no calificados.

### Objetivo
Implementar sistema de trials y enforcement de límites por plan.

### Especificación Técnica

**Estructura de Planes:**
```
FREE TRIAL (14 días)
└── Todo ilimitado durante trial
└── Al expirar → downgrade a Starter limits

STARTER ($49/mes)
└── 5 clientes
└── 3 integraciones
└── 10 dashboards
└── Análisis AI: 50/mes
└── Sin white-label

AGENCY ($99/mes) ← RECOMENDADO
└── 25 clientes
└── Integraciones ilimitadas
└── Dashboards ilimitados
└── Análisis AI: 500/mes
└── White-label completo
└── Alertas automáticas

ENTERPRISE (custom)
└── Todo ilimitado
└── API access
└── SSO/SAML
└── SLA garantizado
```

### Prompt de Acción

```
Módulo 6: Implementar Sistema de Pricing y Límites

Tareas:
1. Crear modelo Subscription en Prisma
2. Crear modelo UsageTracking en Prisma
3. Crear servicio subscription.service.ts
4. Crear middleware de límites
5. Crear componentes UI (UsageMeter, UpgradeModal, TrialBanner)
6. Crear página /[tenant]/settings/billing
7. Crear endpoints de subscription
```

### Entregable Esperado
- Modelos `Subscription` y `UsageTracking`
- `subscription.service.ts` - Lógica de límites
- Middleware de verificación
- Componentes: `UsageMeter`, `UpgradeModal`, `TrialBanner`
- Página `/[tenant]/settings/billing`
- Endpoints de subscription

### Criterio de Éxito
- [ ] Trial de 14 días funciona correctamente
- [ ] Límites se verifican antes de cada acción
- [ ] Usuario ve consumo en tiempo real
- [ ] Upgrade CTA aparece cuando se acerca al límite

---

## MÓDULO 7: BETA LAUNCH

### Contexto Estratégico
Antes de lanzar públicamente, necesitas validación con usuarios reales. Beta controlada permite iterar rápido con feedback directo.

### Objetivo
Preparar infraestructura para beta privada con 10-20 usuarios reales.

### Especificación Técnica

**Checklist de Beta Launch:**
```
INFRAESTRUCTURA
□ Deploy a Railway/Vercel producción
□ Dominio configurado
□ SSL activo
□ Variables de entorno producción
□ APIs reales configuradas
□ Backup de DB automatizado
□ Monitoring (Sentry, LogRocket)

PRODUCTO
□ Módulos 1-6 completados y testeados
□ Mobile responsive verificado
□ Performance <3s load time
□ Errores manejados gracefully

BETA USERS
□ Lista de 10-20 agencias target
□ Email de invitación personalizado
□ Formulario de feedback in-app
□ Canal de Slack/Discord para beta users
□ Calendario de calls de feedback

MÉTRICAS A TRACKEAR
□ Activation rate (completa onboarding)
□ Time to first dashboard
□ AI analysis usage
□ Retention (día 7, día 14)
□ NPS score
```

### Prompt de Acción

```
Módulo 7: Preparar Beta Launch

Tareas:
1. Crear sistema de invitaciones beta
2. Implementar feedback widget
3. Implementar analytics básicos
4. Crear página /admin/beta
5. Preparar templates de email
6. Documentar deployment
```

### Entregable Esperado
- Modelo `BetaInvite` + endpoints
- `FeedbackButton.vue` + `FeedbackModal.vue`
- Sistema de analytics básico
- Página `/admin/beta`
- Templates de email
- Documentación de deploy

### Criterio de Éxito
- [ ] Solo usuarios invitados pueden registrarse
- [ ] Feedback llega en tiempo real
- [ ] Puedes ver métricas de activación
- [ ] Deploy documentado y reproducible

---

# RESUMEN EJECUTIVO

| Fase | Módulos | Objetivo | Esfuerzo |
|------|---------|----------|----------|
| **FASE 1** | 1-3 | Hacer visible lo que ya tienes | ~1-2 semanas |
| **FASE 2** | 4-5 | Usuario no abandona, se vuelve dependiente | ~2 semanas |
| **FASE 3** | 6-7 | Validar que alguien paga | ~1-2 semanas |

**El paso del 0 al 1 no es más features.** Es hacer visible lo que ya tienes y validar que alguien pague por ello.
