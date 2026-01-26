# 🚀 Guía de Despliegue - StartGG Manager

## Arquitectura de Despliegue

- **Frontend**: GitHub Pages (React + Vite)
- **Backend**: Render.com (Laravel 11 + PHP 8.2)
- **Base de Datos**: Render.com PostgreSQL (Gratis)

---

## 📋 Pasos para Desplegar

### 1️⃣ Configurar GitHub Pages (Frontend)

#### A. Habilitar GitHub Pages en el Repositorio

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. En "Build and deployment":
   - Source: **GitHub Actions**
4. Guarda los cambios

#### B. Configurar Secret para la API URL

1. Ve a Settings → Secrets and variables → Actions
2. Crea un nuevo **Repository secret**:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://tu-backend.onrender.com` (lo tendrás después del paso 2)
3. Guarda

#### C. Desplegar Frontend

```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

El frontend se desplegará automáticamente en:
```
https://tu-usuario.github.io/StartGG-Manager
```

---

### 2️⃣ Configurar Render.com (Backend + Base de Datos)

#### A. Crear Cuenta en Render.com

1. Ve a [render.com](https://render.com)
2. Regístrate con GitHub
3. Conecta tu repositorio `StartGG-Manager`

#### B. Desplegar desde el Dashboard

1. En el dashboard de Render, haz clic en **"New +"**
2. Selecciona **"Blueprint"**
3. Conecta tu repositorio GitHub
4. Selecciona el archivo `backend/render.yaml`
5. Haz clic en **"Apply"**

Render creará automáticamente:
- ✅ Un servicio web (backend Laravel)
- ✅ Una base de datos PostgreSQL

#### C. Configurar Variables de Entorno Adicionales

En el dashboard del servicio web, ve a **Environment** y agrega:

```env
APP_URL=https://tu-backend.onrender.com
FRONTEND_URL=https://tu-usuario.github.io/StartGG-Manager

# Start.gg OAuth
STARTGG_CLIENT_ID=tu_client_id
STARTGG_CLIENT_SECRET=tu_client_secret
STARTGG_REDIRECT_URI=https://tu-backend.onrender.com/auth/callback
STARTGG_API_URL=https://api.start.gg/gql/alpha
STARTGG_API_URL_OAUTH=https://api.start.gg/oauth/authorize

# Session (IMPORTANTE para OAuth cross-site)
SESSION_DRIVER=database
SESSION_DOMAIN=
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none
SESSION_HTTP_ONLY=true

# Sanctum
SANCTUM_STATEFUL_DOMAINS=tu-usuario.github.io
```

#### D. Ejecutar Migraciones

Una vez desplegado el backend, ve a la **Shell** del servicio en Render y ejecuta:

```bash
php artisan migrate --force
```

---

### 3️⃣ Configurar start.gg OAuth

1. Ve a [start.gg Developer Portal](https://developer.start.gg)
2. Edita tu aplicación OAuth
3. Agrega como Redirect URI:
   ```
   https://tu-backend.onrender.com/auth/callback
   ```

---

### 4️⃣ Actualizar la URL del Backend en GitHub

1. Una vez que tengas la URL de Render (ej: `https://startgg-manager-backend.onrender.com`)
2. Ve a GitHub → Settings → Secrets and variables → Actions
3. Edita `VITE_API_BASE_URL` con la URL correcta
4. El frontend se redesplegar ásolo automáticamente

---

## ⚠️ Limitaciones del Free Tier

### Render.com Backend
- ⏱️ Se "duerme" después de 15 min de inactividad
- 🕐 Tarda ~30 segundos en despertar en el primer request
- 🔄 750 horas/mes (más que suficiente)

### PostgreSQL
- 💾 90 días de inactividad → Se elimina la BD
- ✅ Si tu app tiene actividad regular, no hay problema
- 🔄 Fácil de recrear si se elimina

### GitHub Pages
- ✅ Totalmente gratuito e ilimitado
- ⚡ CDN global de GitHub

---

## 🔧 Comandos Útiles

### Limpiar caché local (antes de hacer push)
```bash
cd backend
php artisan config:clear
php artisan route:clear
php artisan cache:clear
```

### Forzar redespliegue en Render
```bash
git commit --allow-empty -m "Trigger Render redeploy"
git push origin main
```

### Ver logs en Render
Dashboard → Tu servicio → Logs

---

## 📝 Checklist de Despliegue

- [ ] GitHub Pages habilitado
- [ ] Secret `VITE_API_BASE_URL` configurado en GitHub
- [ ] Servicio web creado en Render
- [ ] Base de datos PostgreSQL creada en Render
- [ ] Variables de entorno configuradas en Render
- [ ] Migraciones ejecutadas
- [ ] OAuth redirect URI actualizado en start.gg
- [ ] Frontend desplegado y accesible
- [ ] Backend desplegado y respondiendo
- [ ] Login con start.gg funcionando

---

## 🆘 Solución de Problemas

### El frontend no se despliega
- Revisa la pestaña **Actions** en GitHub
- Verifica que el workflow se haya ejecutado
- Comprueba que `VITE_API_BASE_URL` esté configurado

### El backend no inicia
- Revisa los **Logs** en Render
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que `APP_KEY` se haya generado automáticamente

### Error de CORS
- Verifica `FRONTEND_URL` en Render
- Comprueba `SANCTUM_STATEFUL_DOMAINS` en Render

### Error de base de datos
- Verifica que las migraciones se hayan ejecutado
- Comprueba la conexión a PostgreSQL en los logs

### Error "invalid_state" en OAuth
- Este error ocurre cuando las cookies de sesión no persisten entre el login y el callback
- **Solución**: Asegúrate de que estas variables estén configuradas en Render:
  - `SESSION_DRIVER=database`
  - `SESSION_DOMAIN=` (vacío, sin valor)
  - `SESSION_SECURE_COOKIE=true`
  - `SESSION_SAME_SITE=none`
  - `SESSION_HTTP_ONLY=true`
- Verifica que hayas ejecutado las migraciones (tabla `sessions` debe existir)

---

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en:
- **Frontend**: `https://tu-usuario.github.io/StartGG-Manager`
- **Backend API**: `https://tu-backend.onrender.com`

