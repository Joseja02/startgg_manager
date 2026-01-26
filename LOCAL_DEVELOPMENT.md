# 🛠️ Configuración para Desarrollo Local

**IMPORTANTE:** Esta configuración te permite desarrollar en local usando los servicios desplegados (backend, BD, OAuth de producción). No necesitas desplegar para hacer pruebas.

---

## Backend (.env)

Crea un archivo `backend/.env` con estas variables:

```env
# ===========================================
# Backend - Variables de entorno para LOCAL
# Usa servicios de PRODUCCIÓN (BD, OAuth)
# ===========================================

APP_NAME="StartGG Manager"
APP_ENV=local
APP_DEBUG=true
APP_KEY=base64:iRCnqwvvZrHkF/UZ0lDWKS5NwumeOd3SIJ73hwF3vnk=
APP_URL=http://localhost:8000

# Frontend URL (para CORS y redirects OAuth)
FRONTEND_URL=http://localhost:8080
FRONTEND_BASE_PATH=

# Base de datos de PRODUCCIÓN (PostgreSQL en Render)
DB_CONNECTION=pgsql
DB_HOST=dpg-d5rqkiv18n1s73e6qa30-a.frankfurt-postgres.render.com
DB_PORT=5432
DB_DATABASE=startgg_manager
DB_USERNAME=startgg_manager_user
DB_PASSWORD=uKCl7aosCtxqLOunbKnSEVxNqzgm5yyR

# Sesión y caché (usar archivos en local para mejor rendimiento)
CACHE_DRIVER=file
SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_DOMAIN=
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
SESSION_HTTP_ONLY=true

# Logs
LOG_CHANNEL=stack
LOG_LEVEL=debug

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost:8080

# Start.gg OAuth (usa callbacks de PRODUCCIÓN)
# ✅ Los callbacks ya están registrados en start.gg, no necesitas cambiar nada
STARTGG_CLIENT_ID=336
STARTGG_CLIENT_SECRET=529985e50d42156bcbc0486055c18420d340ff4f49c75c7fe5aeae3f32c3255b
STARTGG_REDIRECT_URI=https://startgg-manager-backend.onrender.com/auth/callback
STARTGG_OAUTH_AUTHORIZE_URL=https://start.gg/oauth/authorize
STARTGG_OAUTH_TOKEN_URL=https://api.start.gg/oauth/access_token
STARTGG_API_URL=https://api.start.gg/gql/alpha
STARTGG_API_URL_OAUTH=https://api.start.gg/gql/alpha

# Broadcasting, Queue, Mail (no necesarios para desarrollo básico)
BROADCAST_DRIVER=log
QUEUE_CONNECTION=sync
MAIL_MAILER=log
```

---

## Frontend (.env.local)

Crea un archivo `frontend/.env.local` con:

```env
# URL del backend de PRODUCCIÓN en Render
VITE_API_BASE_URL=https://startgg-manager-backend.onrender.com
```

---

## 📋 Pasos para configurar desarrollo local:

### 1. Backend

```bash
cd backend

# Copiar variables de entorno
# (crea backend/.env manualmente con el contenido de arriba)

# Instalar dependencias
composer install

# ✅ NO necesitas crear BD ni ejecutar migraciones (usa producción)

# Iniciar servidor local
php artisan serve
```

El backend correrá en `http://localhost:8000` pero usará:
- ✅ Base de datos de producción (PostgreSQL en Render)
- ✅ OAuth de producción (callbacks ya registrados)

### 2. Frontend

```bash
cd frontend

# Crear archivo .env.local
echo "VITE_API_BASE_URL=https://startgg-manager-backend.onrender.com" > .env.local

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend correrá en `http://localhost:8080` y usará:
- ✅ Backend de producción en Render
- ✅ No necesita configuración adicional

---

## 🎯 ¿Qué configuración usar?

### Opción 1: Frontend local + Backend producción (RECOMENDADO)
```bash
# Frontend
cd frontend
npm run dev  # http://localhost:8080

# El frontend usa backend de producción automáticamente
# .env.local: VITE_API_BASE_URL=https://startgg-manager-backend.onrender.com
```

✅ **Ventajas:**
- Solo desarrollas frontend
- No necesitas backend local
- Usa datos reales de producción

### Opción 2: Backend local + Frontend local + BD/OAuth producción
```bash
# Backend
cd backend
php artisan serve  # http://localhost:8000

# Frontend
cd frontend
# .env.local: VITE_API_BASE_URL=http://localhost:8000
npm run dev  # http://localhost:8080
```

✅ **Ventajas:**
- Pruebas completas (frontend + backend)
- Debugging de backend
- Usa BD y OAuth de producción

---

## 🔍 Diferencias Local vs Producción Desplegada

| Variable | Local | Producción (Render) |
|----------|-------|-----------|
| `APP_ENV` | `local` | `production` |
| `APP_DEBUG` | `true` | `false` |
| `APP_URL` | `http://localhost:8000` | `https://startgg-manager-backend.onrender.com` |
| `FRONTEND_URL` | `http://localhost:8080` | `https://joseja02.github.io` |
| `FRONTEND_BASE_PATH` | `` (vacío) | `/StartGG-Manager` |
| `DB_*` | **Misma BD de producción** | PostgreSQL en Render |
| `CACHE_DRIVER` | `file` | `database` |
| `SESSION_DRIVER` | `file` | `database` |
| `SESSION_SECURE_COOKIE` | `false` | `true` |
| `SESSION_SAME_SITE` | `lax` | `none` |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:8080` | `joseja02.github.io` |
| `STARTGG_*` | **Mismos valores de producción** | start.gg OAuth |
| `LOG_CHANNEL` | `stack` | `stderr` |

---

## ⚠️ Notas Importantes

### Base de datos compartida
- ⚠️ **Local y producción usan LA MISMA BD**
- Todos los datos que crees en local aparecerán en producción
- Todos los cambios en BD son reales
- **Cuidado con las migraciones** - afectan producción

### OAuth
- ✅ Usa callbacks de producción (ya registrados en start.gg)
- ✅ No necesitas configurar nada en start.gg
- ✅ El flujo funciona: `localhost:8080` → `render.com/auth/login` → `start.gg` → `render.com/auth/callback`

### CORS
- ✅ El backend de producción ya permite `localhost:8080` cuando `APP_ENV=local`
- ✅ Puedes desarrollar frontend sin problemas

### Sesiones
- En local: archivos (`storage/framework/sessions`) - no afecta producción
- En producción: base de datos (tabla `sessions`)

---

## 🚀 Comandos útiles

```bash
# Backend - Limpiar caché
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Backend - Ver rutas
php artisan route:list

# Backend - Ver logs
tail -f storage/logs/laravel.log

# Frontend - Ver errores de build
npm run build
```

---

## 🆘 Solución de problemas

### Error: "SQLSTATE[08006] Connection refused"
- Verifica que las credenciales de BD en `.env` sean correctas
- Verifica que el host incluya `.frankfurt-postgres.render.com`
- Comprueba tu conexión a internet

### Error: "CORS policy" en frontend
- Asegúrate de que `VITE_API_BASE_URL` esté configurado en `.env.local`
- Verifica que el backend de producción esté activo (no dormido)
- Espera 30s si el servicio estaba dormido (Render free tier)

### Error: "419 Page Expired" o "CSRF token mismatch"
- Limpia cookies del navegador
- Reinicia el servidor de desarrollo (`npm run dev`)
- Borra caché: `localStorage.clear()` y `sessionStorage.clear()` en consola

### Error: "No application encryption key"
- El `APP_KEY` ya está configurado en el `.env` de arriba
- Si persiste, copia el `APP_KEY` de producción

### Frontend no carga datos
- Verifica que el backend de Render esté activo
- Abre `https://startgg-manager-backend.onrender.com` en el navegador
- Espera 30 segundos si muestra "Service Starting"

