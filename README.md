# Costify

Calculadora de costos y precios de venta para micro y pequeñas empresas privadas (MIPYME) en Cuba. Permite crear fichas de costo, gestionar materias primas, calcular márgenes e impuestos, y sincronizar los datos en la nube con soporte offline.

## Características

- **Calculadora de precios** — productos simples o elaborados con recetas de insumos
- **Materias primas** — catálogo de insumos, costo unitario y control de stock
- **Historial** — productos guardados y resumen del negocio
- **Impuestos** — presets para TCP, MIPYME y CNA, editables por línea
- **Gastos indirectos y fondo global** — distribución por unidades, costo directo, peso o manual
- **Unidades de medida** — catálogo configurable (ud, gr, kg, lb, lt, ml…)
- **Offline-first** — opera sin conexión con `localStorage` y sincroniza con MongoDB al reconectar
- **Multi-tenant** — cada cliente tiene su negocio aislado con login propio
- **Panel super admin** — registro de clientes, usuarios y gestión de accesos
- **Cuenta del cliente** — editar perfil, cambiar contraseña, suspender o eliminar cuenta
- **Respaldo manual** — exportar/importar datos por código o archivo JSON

## Stack tecnológico

- [Next.js 15](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) — persistencia y sincronización
- Autenticación con JWT en cookie HTTP-only (`jose` + `bcryptjs`)

## Requisitos

- Node.js 20+
- Cuenta en MongoDB Atlas (o instancia MongoDB compatible)
- Variables de entorno configuradas (ver abajo)

## Instalación local

```bash
git clone https://github.com/ypvaldivia88/Costify.git
cd Costify
npm install
```

Crea un archivo `.env.local` basado en `.env.example`:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.net/costify?retryWrites=true&w=majority
AUTH_SECRET=una-cadena-aleatoria-de-al-menos-32-caracteres
SUPER_ADMIN_EMAIL=admin@costify.local
SUPER_ADMIN_PASSWORD=tu-contraseña-segura
SUPER_ADMIN_NAME=Super Admin
APP_URL=http://localhost:3000
```

Inicializa el super administrador y arranca la app:

```bash
npm run seed:admin
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Roles y rutas

| Rol | Ruta | Descripción |
|-----|------|-------------|
| Super admin | `/admin` | Registrar clientes y gestionar usuarios |
| Cliente (`tenant_admin`, `tenant_user`) | `/` | Calculadora y gestión del negocio |
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

3. Despliega y ejecuta `npm run seed:admin` si el super admin no se creó automáticamente en el primer login

En MongoDB Atlas, permite el acceso de red desde `0.0.0.0/0` o los rangos IP de Vercel.

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Linter |
| `npm run seed:admin` | Crear o sincronizar el super administrador |

## Estructura del proyecto

```
app/
  admin/          Panel super administrador
  login/          Inicio de sesión
  api/            Auth, sync, cuenta y administración
components/
  calculator/     Calculadora de costos
  inventory/      Historial y resumen
  raw-materials/  Materias primas
  settings/       Ajustes, cuenta y sincronización
hooks/            Estado de la app y sincronización
lib/
  auth/           Usuarios, tenants, sesiones
  db/             Conexión MongoDB
  domain/         Lógica de negocio y tipos
  sync/           Sincronización offline-first
```

## Sincronización offline

1. La app carga y guarda datos en `localStorage` (rápido, sin conexión)
2. Al tener internet, sincroniza automáticamente con MongoDB
3. Los cambios offline se marcan como pendientes y se suben al reconectar
4. Cada tenant tiene su propio espacio de datos aislado

## Licencia

Proyecto privado.
