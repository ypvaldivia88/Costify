# Costify

Calculadora de costos, precios de venta e inventario para micro y pequeñas empresas privadas (MIPYME) en Cuba. Permite controlar almacenes y stock, crear fichas de costo, gestionar materias primas, calcular márgenes e impuestos, y sincronizar los datos en la nube con soporte offline.

## Características

### Almacenes e inventario
- **Stock actual** — valorización en CUP de insumos y productos terminados en almacén
- **Múltiples almacenes** — bodega principal, punto de venta y área de producción
- **Movimientos de stock** — entradas, salidas, transferencias, mermas, ajustes e inventario inicial
- **Kardex** — historial de movimientos por ítem y almacén
- **Producción** — registrar elaboración desde productos con receta (descuenta insumos, suma producto terminado)
- **Alertas** — umbrales de stock mínimo configurables

### Costos y precios
- **Productos** — fichas de costo unificadas con stock por almacén y producción
- **Materias primas** — catálogo de insumos, costo unitario y stock sincronizado con almacén
- **Impuestos** — presets para TCP, MIPYME y CNA, editables por línea
- **Gastos indirectos y fondo global** — distribución por unidades, costo directo, peso o manual
- **Unidades de medida** — catálogo configurable (ud, gr, kg, lb, lt, ml…)

### Plataforma
- **Offline-first** — opera sin conexión con `localStorage` y sincroniza con MongoDB al reconectar
- **Multi-tenant** — cada cliente tiene su negocio aislado con login propio
- **Panel super admin** — registro de clientes, usuarios y gestión de accesos
- **Cuenta del cliente** — editar perfil, cambiar contraseña, suspender o eliminar cuenta
- **Respaldo manual** — exportar/importar datos por código o archivo JSON

## Navegación de la app

Al iniciar sesión, el admin del negocio entra en **Productos**. El orden de las pestañas es:

| Pestaña | Descripción |
|---------|-------------|
| **Productos** | Fichas de costo, precios sugeridos, stock y producción por producto |
| **Insumos** | Materias primas y costos unitarios |
| **Almacén** | Stock actual, movimientos, gestión de bodegas y alertas |
| **Ajustes** | Impuestos, gastos, unidades, respaldo y cuenta |

## Stack tecnológico

- [Next.js 15](https://nextjs.org/) (App Router) — `apps/web`
- [Expo SDK 56](https://docs.expo.dev/) / React Native — `apps/mobile`
- Lógica compartida — `packages/shared` (`@costify/shared`)
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) — persistencia y sincronización (web)
- Autenticación con JWT en cookie HTTP-only (`jose` + `bcryptjs`)

## Requisitos

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- Cuenta en MongoDB Atlas (o instancia MongoDB compatible)
- Variables de entorno configuradas (ver abajo)

## Instalación local

```bash
git clone https://github.com/ypvaldivia88/Costify.git
cd Costify
pnpm install
```

Crea `apps/web/.env.local` basado en `apps/web/.env.example`:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.net/costify?retryWrites=true&w=majority
AUTH_SECRET=una-cadena-aleatoria-de-al-menos-32-caracteres
SUPER_ADMIN_EMAIL=admin@costify.local
SUPER_ADMIN_PASSWORD=tu-contraseña-segura
SUPER_ADMIN_NAME=Super Admin
APP_URL=http://localhost:3000
```

Inicializa el super administrador y arranca la app web:

```bash
pnpm seed:admin
pnpm dev
```

Para la app móvil (Expo):

```bash
pnpm dev:mobile
```

Abre [http://localhost:3000](http://localhost:3000) para la web.

## Roles y rutas

| Rol | Ruta | Descripción |
|-----|------|-------------|
| Super admin | `/admin` | Registrar clientes y gestionar usuarios |
| Cliente (`tenant_admin`, `tenant_user`) | `/` | Almacén, costos y gestión del negocio |
| Todos | `/login` | Inicio de sesión |

## Despliegue en Vercel

1. Importa el repositorio en [Vercel](https://vercel.com)
2. Añade las variables de entorno en **Settings → Environment Variables**:

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | Cadena de conexión a MongoDB |
| `AUTH_SECRET` | Secreto para firmar sesiones (mín. 32 caracteres) |
| `SUPER_ADMIN_EMAIL` | Correo del super administrador |
| `SUPER_ADMIN_PASSWORD` | Contraseña del super administrador |
| `SUPER_ADMIN_NAME` | Nombre visible del super admin |
| `APP_URL` | URL pública de la app (ej. `https://tu-app.vercel.app`) |

3. Despliega y ejecuta `pnpm seed:admin` si el super admin no se creó automáticamente en el primer login

> **Nota Vercel:** configura el **Root Directory** del proyecto como `apps/web`.

En MongoDB Atlas, permite el acceso de red desde `0.0.0.0/0` o los rangos IP de Vercel.

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` / `pnpm dev:web` | Servidor de desarrollo (Next.js) |
| `pnpm dev:mobile` | Expo dev server |
| `pnpm build` | Build de producción (web) |
| `pnpm start` | Servidor de producción (web) |
| `pnpm lint` | Linter (web) |
| `pnpm seed:admin` | Crear o sincronizar el super administrador |
| `pnpm typecheck` | Type-check en todos los paquetes |

## Estructura del monorepo

```
apps/
  web/              Next.js — panel web, API y sync con MongoDB
  mobile/           Expo — app Android offline-first
packages/
  shared/           @costify/shared — tipos, cálculos, backup y formatos
  client-data/      @costify/client-data — hooks, sync y storage compartidos
  ui-tokens/        @costify/ui-tokens — colores, spacing y marca compartida
```

## App Android (releases)

La APK de prueba se publica en [GitHub Releases](https://github.com/ypvaldivia88/Costify/releases). Versión actual recomendada: **v1.0.16**.

| Release | Notas |
|---------|--------|
| **v1.0.16** | Logo SaaS v2, UI web refactor (landing, auth, contraste dark mode) |
| v1.0.15 | Desglose salarios, multi-área, fixes sync |

Descarga directa: [Releases → Latest](https://github.com/ypvaldivia88/Costify/releases/latest)

Build local (Linux + JDK 17):

```bash
cd apps/mobile
EXPO_PUBLIC_API_URL=https://costify-iota.vercel.app pnpm build:apk
```

Build en la nube (EAS):

```bash
cd apps/mobile
pnpm build:preview
```

### Detalle de `apps/web`

```
app/
  admin/            Panel super administrador
  login/            Inicio de sesión
  api/              Auth, sync, cuenta y administración
components/         UI web (React DOM + Tailwind)
hooks/              Estado de la app y sincronización
lib/
  auth/             Usuarios, tenants, sesiones
  db/               Conexión MongoDB y workspace por tenant
  sync/             Sincronización offline-first (cliente)
  storage/          localStorage
```

## Sincronización offline

1. La app carga y guarda datos en `localStorage` (rápido, sin conexión)
2. Al tener internet, sincroniza automáticamente con MongoDB
3. Los cambios offline se marcan como pendientes y se suben al reconectar
4. Cada tenant tiene su propio espacio de datos aislado (inventario, almacenes, movimientos, insumos, etc.)

## Licencia

Proyecto privado.
