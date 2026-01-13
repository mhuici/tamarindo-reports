# TamarindoReports - Launch Checklist

## Pre-Launch Checklist

### 1. Railway Environment Variables
Verificar que todas las variables esten configuradas en Railway:

```
Required:
[ ] DATABASE_URL          - PostgreSQL connection string
[ ] REDIS_URL             - Redis connection string
[ ] JWT_SECRET            - Min 32 chars, secure random string
[ ] NUXT_PUBLIC_APP_URL   - https://tudominio.com

AI (para RCA y narrativas):
[ ] ANTHROPIC_API_KEY     - Claude API key

Integraciones (pueden agregarse despues):
[ ] GOOGLE_CLIENT_ID      - Google OAuth
[ ] GOOGLE_CLIENT_SECRET
[ ] GOOGLE_ADS_DEVELOPER_TOKEN
[ ] FACEBOOK_APP_ID       - Meta OAuth
[ ] FACEBOOK_APP_SECRET

Storage (para PDFs y logos):
[ ] R2_ACCOUNT_ID
[ ] R2_ACCESS_KEY_ID
[ ] R2_SECRET_ACCESS_KEY
[ ] R2_BUCKET_NAME
[ ] R2_PUBLIC_URL

Email (opcional):
[ ] RESEND_API_KEY        - Para envio de reportes

Feedback (opcional):
[ ] SLACK_FEEDBACK_WEBHOOK - Para recibir feedback en Slack
```

### 2. Database
```
[ ] Ejecutar migraciones: npx prisma migrate deploy
[ ] Verificar conexion desde Railway
```

### 3. Dominio
```
[ ] Configurar dominio custom en Railway
[ ] Configurar SSL (automatico en Railway)
[ ] Actualizar NUXT_PUBLIC_APP_URL con el dominio
[ ] Actualizar OAuth redirect URIs en Google/Facebook con nuevo dominio
```

### 4. OAuth Callbacks
Actualizar en cada plataforma:
```
Google Cloud Console:
[ ] Authorized redirect URI: https://tudominio.com/api/integrations/google-ads/callback
[ ] Authorized redirect URI: https://tudominio.com/api/integrations/google-analytics/callback

Facebook Developers:
[ ] Valid OAuth Redirect URI: https://tudominio.com/api/integrations/facebook-ads/callback
```

### 5. Verificacion Funcional
```
[ ] Landing page carga correctamente
[ ] Registro de usuario funciona
[ ] Login funciona
[ ] Onboarding se muestra para nuevos usuarios
[ ] Conexion de integracion funciona (si OAuth configurado)
[ ] Widget de feedback funciona
[ ] API de RCA responde (puede ser fallback si no hay ANTHROPIC_API_KEY)
```

### 6. Monitoreo
```
[ ] Railway logs accesibles
[ ] Health check respondiendo en /api/health
[ ] Configurar alertas de Railway (opcional)
```

---

## Post-Launch

### Semana 1
- [ ] Invitar 5-10 beta users
- [ ] Monitorear logs por errores
- [ ] Recolectar feedback inicial
- [ ] Resolver bugs criticos

### Semana 2
- [ ] Analizar uso y metricas
- [ ] Implementar mejoras de feedback
- [ ] Preparar integracion de Stripe (Modulo 6)

---

## Comandos Utiles

```bash
# Ver logs en Railway
railway logs

# Ejecutar migraciones
railway run npx prisma migrate deploy

# Verificar variables de entorno
railway variables
```

---

## Contactos Beta Users

| Nombre | Email | Estado | Notas |
|--------|-------|--------|-------|
|        |       |        |       |
|        |       |        |       |
|        |       |        |       |

---

## Metricas de Lanzamiento

- **Fecha de lanzamiento:** ___________
- **Usuarios registrados (D1):** ___
- **Usuarios registrados (W1):** ___
- **Integraciones conectadas:** ___
- **Dashboards creados:** ___
- **Feedback recibido:** ___
