# 🛠️ Configuración para Desarrollo Local

## Backend (.env)

Crea un archivo `backend/.env` con estas variables:

```env
# ===========================================
# Backend - Variables de entorno para LOCAL
# ===========================================

APP_NAME="StartGG Manager"
APP_ENV=local
APP_DEBUG=true
APP_KEY=base64:iRCnqwvvZrHkF/UZ0lDWKS5NwumeOd3SIJ73hwF3vnk=
APP_URL=http://localhost:8000

# Frontend URL (para CORS y redirects OAuth)
FRONTEND_URL=http://localhost:8080
FRONTEND_BASE_PATH=

# Base de datos local (MySQL con XAMPP)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=startgg_manager
DB_USERNAME=root
DB_PASSWORD=

# Sesión y caché (usar archivos en local)
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

# Start.gg OAuth
# ⚠️ IMPORTANTE: Debes agregar http://localhost:8000/auth/callback
# como Redirect URI en https://developer.start.gg
STARTGG_CLIENT_ID=336
STARTGG_CLIENT_SECRET=529985e50d42156bcbc0486055c18420d340ff4f49c75c7fe5aeae3f32c3255b
STARTGG_REDIRECT_URI=http://localhost:8000/auth/callback
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

## Frontend (.env)

Crea un archivo `frontend/.env.local` con:

```env
# URL del backend local
VITE_API_BASE_URL=http://localhost:8000
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

# Crear base de datos (en phpMyAdmin o CLI)
# CREATE DATABASE startgg_manager;

# Ejecutar migraciones
php artisan migrate

# Iniciar servidor
php artisan serve
```

### 2. Frontend

```bash
cd frontend

# Crear archivo .env.local con VITE_API_BASE_URL
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### 3. start.gg Developer Portal

**IMPORTANTE:** Debes agregar el redirect URI de local:

1. Ve a https://developer.start.gg
2. Edita tu aplicación OAuth
3. En **Redirect URIs**, agrega:
   ```
   http://localhost:8000/auth/callback
   ```
4. Guarda los cambios

---

## 🔍 Diferencias Local vs Producción

| Variable | Local | Producción |
|----------|-------|-----------|
| `APP_ENV` | `local` | `production` |
| `APP_DEBUG` | `true` | `false` |
| `APP_URL` | `http://localhost:8000` | `https://startgg-manager-backend.onrender.com` |
| `FRONTEND_URL` | `http://localhost:8080` | `https://joseja02.github.io` |
| `FRONTEND_BASE_PATH` | `` (vacío) | `/StartGG-Manager` |
| `DB_CONNECTION` | `mysql` | `pgsql` |
| `DB_HOST` | `127.0.0.1` | `dpg-d5rqkiv18n1s73e6qa30-a` |
| `CACHE_DRIVER` | `file` | `database` |
| `SESSION_DRIVER` | `file` | `database` |
| `SESSION_SECURE_COOKIE` | `false` | `true` |
| `SESSION_SAME_SITE` | `lax` | `none` |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:8080` | `joseja02.github.io` |
| `STARTGG_REDIRECT_URI` | `http://localhost:8000/auth/callback` | `https://startgg-manager-backend.onrender.com/auth/callback` |
| `LOG_CHANNEL` | `stack` | `stderr` |

---

## ⚠️ Notas Importantes

### CORS en local
- El backend permite `http://localhost:8080` automáticamente cuando `APP_ENV=local`
- No necesitas configurar nada adicional

### Base de datos
- En local usas MySQL (XAMPP)
- En producción usas PostgreSQL (Render)
- Las migraciones funcionan en ambos

### OAuth
- **DEBES** agregar `http://localhost:8000/auth/callback` en start.gg
- Puedes tener múltiples redirect URIs configurados simultáneamente
- No afecta a producción

### Sesiones
- En local: archivos (`storage/framework/sessions`)
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

### Error: "SQLSTATE[HY000] [1045] Access denied"
- Verifica `DB_USERNAME` y `DB_PASSWORD` en `.env`
- Asegúrate de que MySQL está corriendo (XAMPP)

### Error: "CORS policy"
- Verifica que `FRONTEND_URL` sea `http://localhost:8080`
- Verifica que `APP_ENV` sea `local`

### Error: "invalid_state" en OAuth
- Limpia cookies del navegador
- Verifica que `SESSION_DRIVER=file` en local
- Reinicia el servidor de Laravel

### Error: "No application encryption key"
- Ejecuta: `php artisan key:generate`

