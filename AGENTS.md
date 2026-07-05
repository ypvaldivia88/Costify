# Costify — Contexto para agentes (entorno de pruebas / staging)

Documento de referencia para agentes de IA que trabajen en este repositorio. Incluye URLs, credenciales de prueba verificadas, variables de entorno, flujos de negocio y comandos operativos.

> **Confidencialidad:** este archivo contiene credenciales de pruebas. No lo compartas fuera del equipo ni lo publiques en canales abiertos.

---

## Resumen del proyecto

**Costify** es una calculadora de costos, precios e inventario para MIPYME en Cuba. Monorepo pnpm:

| Ruta | Descripción |
|------|-------------|
| `apps/web` | Next.js 15 — API REST, auth JWT, sync MongoDB, panel web |
| `apps/mobile` | Expo SDK 56 / React Native — app Android offline-first |
| `packages/shared` | `@costify/shared` — tipos, cálculos, backup |
| `packages/client-data` | `@costify/client-data` — hooks, sync, storage |

---

## URLs del entorno de pruebas / producción

| Recurso | URL |
|---------|-----|
| **Web + API (Vercel)** | `https://costify-iota.vercel.app` |
| Login web | `https://costify-iota.vercel.app/login` |
| Registro público | `https://costify-iota.vercel.app/register` |
| Panel super admin | `https://costify-iota.vercel.app/admin` |
| API base | `https://costify-iota.vercel.app/api` |
| GitHub | `https://github.com/ypvaldivia88/Costify` |
| WhatsApp soporte / pagos | `+5354148857` → `https://wa.me/5354148857` |

**Vercel:** Root Directory = `apps/web`

---

## Variables de entorno

### Backend web (`apps/web/.env.local`)

Usar en desarrollo local. En Vercel, las mismas claves están en **Settings → Environment Variables** del proyecto. Plantilla copiable: `apps/web/env.staging.template`.

```env
# URL pública del despliegue
APP_URL=https://costify-iota.vercel.app

# MongoDB Atlas (servidor — NO exponer al cliente móvil)
MONGODB_URI=<configurado en Vercel — ver panel del proyecto>

# Firma de sesiones JWT (mín. 32 caracteres)
AUTH_SECRET=<configurado en Vercel — ver panel del proyecto>

# Super administrador (bootstrap automático en cada login)
SUPER_ADMIN_EMAIL=admin@costify.local
SUPER_ADMIN_PASSWORD=CostifyAdmin2026!
SUPER_ADMIN_NAME=Super Admin

# Token API elTOQUE TRMI (opcional; tasas vía servidor)
ELTOQUE_API_TOKEN=

# Solo si se usa Gemini en web (opcional)
GEMINI_API_KEY=
```

> Los valores de `MONGODB_URI` y `AUTH_SECRET` **no están en el repo**. Están solo en Vercel. Para seeds locales necesitas copiarlos del panel de Vercel o pedirlos al maintainer.

### App móvil (`apps/mobile/.env` o embebido en build)

```env
# OBLIGATORIA para APK — apunta al backend de Vercel
EXPO_PUBLIC_API_URL=https://costify-iota.vercel.app

# Opcional — fallback local de tasas si el backend no responde
EXPO_PUBLIC_ELTOQUE_API_TOKEN=
```

**Default en release:** `apps/mobile/app.config.js` ya usa `https://costify-iota.vercel.app` si no se define la variable. Plantilla: `apps/mobile/env.staging.template`.

### Expo / EAS

| Campo | Valor |
|-------|-------|
| Owner | `ypalmero` |
| Slug | `costify` |
| Project ID | `cee919b6-82ea-411d-b3c7-5154be7eafab` |
| Android package | `com.costify.app` |
| Preview APK profile | `eas.json` → `preview` (incluye `EXPO_PUBLIC_API_URL`) |

---

## Credenciales de prueba (verificadas en producción)

### Super administrador

| Campo | Valor |
|-------|-------|
| URL | `https://costify-iota.vercel.app/admin` |
| Email | `admin@costify.local` |
| Contraseña | `CostifyAdmin2026!` |
| Rol | `super_admin` |

### Cliente demo (tenant)

| Campo | Valor |
|-------|-------|
| Negocio | Panadería La Prueba *(puede variar si se re-seedó)* |
| Email admin | `demo@costify.local` |
| Contraseña | `Demo2026!` |
| Rol | `tenant_admin` |

### Operador demo (si existe tras `seed:demo`)

| Campo | Valor |
|-------|-------|
| Email | `operador@costify.local` |
| Contraseña | `Demo2026!` |
| Rol | `tenant_user` |

### Probar login vía API

```bash
curl -s -X POST https://costify-iota.vercel.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@costify.local","password":"Demo2026!"}'
```

---

## Roles y rutas

| Rol | Ruta web | Acceso |
|-----|----------|--------|
| `super_admin` | `/admin` | Gestión de clientes, aprobaciones, usuarios |
| `tenant_admin` | `/` | App completa del negocio + suscripción en Ajustes → Cuenta |
| `tenant_user` | `/` | App del negocio (sin gestión de suscripción) |
| Público | `/login`, `/register` | Sin auth |

**Middleware:** `apps/web/middleware.ts` — rutas públicas: `/login`, `/register`, `/api/auth/login`, `/api/register`.

---

## Flujos de negocio recientes

### Registro de nuevos clientes (demo)

1. Usuario va a `/register`, elige plan y envía solicitud
2. Tenant queda en estado `pending` + suscripción `pending_payment`
3. Usuario contacta por WhatsApp (`+5354148857`) para pagar
4. Super admin aprueba en `/admin` → tenant pasa a `active`

### Planes de suscripción

| Plan | Precio | Descuento |
|------|--------|-----------|
| Mensual | $10 USD | — |
| 6 meses | $54 USD | 10% |
| Anual | $102 USD | 15% |

Constantes: `packages/shared/src/domain/subscription.ts`

### Estados de cuenta

- `pending` — esperando aprobación / pago
- `active` — operativo
- `suspended` — acceso bloqueado

---

## API relevante

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login (cookie web + token JSON móvil) |
| POST | `/api/auth/logout` | Sí | Cerrar sesión |
| GET | `/api/auth/me` | Sí | Sesión actual |
| POST | `/api/register` | No | Registro público pendiente |
| GET/PATCH | `/api/account` | Tenant | Perfil y datos del negocio |
| GET/POST | `/api/admin/tenants` | Super admin | Listar / crear clientes |
| POST | `/api/admin/tenants/:id/approve` | Super admin | Aprobar registro pendiente |
| POST | `/api/admin/tenants/:id/reject` | Super admin | Rechazar registro pendiente |
| GET/POST | `/api/sync` | Tenant | Sync workspace MongoDB ↔ cliente |

**Auth móvil:** header `Authorization: Bearer <token>` (devuelto por login).

---

## Comandos habituales

```bash
# Instalar dependencias (siempre desde la raíz)
pnpm install

# Web en local (requiere apps/web/.env.local)
pnpm dev
pnpm seed:admin    # sincroniza super admin
pnpm seed:demo     # crea/actualiza tenant demo con datos de panadería

# Móvil
pnpm dev:mobile

# Type-check
pnpm typecheck
pnpm --filter @costify/web typecheck
pnpm --filter costify-mobile typecheck

# Build web
pnpm build

# Build APK local (Linux)
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export EXPO_PUBLIC_API_URL=https://costify-iota.vercel.app
cd apps/mobile && pnpm build:apk
# Salida: apps/mobile/android/app/build/outputs/apk/release/app-release.apk

# Build APK vía EAS (requiere `eas login`)
cd apps/mobile && pnpm build:preview
```

---

## Releases Android (GitHub)

| Release | APK | Notas |
|---------|-----|-------|
| `v1.0.0-preview-android` | ❌ Sin API URL | No usar |
| **`v1.0.0-preview-android-2`** | ✅ `costify-preview-1.0.0-android-iota.apk` | Apunta a `costify-iota.vercel.app` |

Descarga: https://github.com/ypvaldivia88/Costify/releases/tag/v1.0.0-preview-android-2

---

## Estructura de datos (MongoDB)

| Colección | Contenido |
|-----------|-----------|
| `users` | Usuarios (super_admin, tenant_admin, tenant_user) |
| `tenants` | Negocios + `subscription` opcional |
| `workspaces` | Inventario, almacenes, movimientos por tenant |

---

## Problemas conocidos y soluciones

### APK muestra "EXPO_PUBLIC_API_URL no está configurada"
- Rebuild con `EXPO_PUBLIC_API_URL=https://costify-iota.vercel.app`
- O usar release `v1.0.0-preview-android-2` o posterior

### Alertas de revisión de precios parpadean al cerrar
- Corregido en `packages/client-data/src/hooks/use-persisted-state.ts` (merge al recargar + refs estables)

### Gradle falla con Java 21
- Usar `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`

### Expo web en cloud VM
- Ver `apps/mobile/AGENTS.md` — usar `expo start --web` con `EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1`

### Cuenta pendiente no puede entrar
- Comportamiento esperado hasta que super admin apruebe en `/admin`

---

## Convenciones para agentes (Cloud)

- Rama base: `main`
- Ramas de agente: `cursor/<descripcion>-b111`
- Push: `git push -u origin <branch>`
- Vercel despliega desde `main` con root `apps/web`
- No commitear `apps/mobile/android/` (está en `.gitignore`)
- No commitear `.env.local` con secrets reales
- UI en español; mantener cambios mínimos y alineados al estilo existente

---

## Archivos clave

| Área | Archivos |
|------|----------|
| Auth / tenants | `apps/web/lib/auth/*` |
| Registro | `apps/web/app/register/`, `apps/web/app/api/register/` |
| Suscripciones | `packages/shared/src/domain/subscription.ts` |
| Admin panel | `apps/web/app/admin/page.tsx` |
| Alertas precio | `packages/client-data/src/hooks/use-price-review-alerts-state.ts` |
| Config móvil | `apps/mobile/app.config.js`, `apps/mobile/src/config/env.ts` |
| Seeds | `apps/web/scripts/seed-super-admin.ts`, `seed-demo-tenant.ts` |

---

## Checklist antes de generar APK de prueba

- [ ] `EXPO_PUBLIC_API_URL=https://costify-iota.vercel.app`
- [ ] `expo prebuild --platform android` (regenera nativo con `extra.apiUrl`)
- [ ] Build con JDK 17
- [ ] Verificar en APK: `unzip -p app-release.apk assets/app.config` contiene `"apiUrl":"https://costify-iota.vercel.app"`
- [ ] Subir a GitHub Releases con notas claras
