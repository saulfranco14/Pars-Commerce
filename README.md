# Pars Commerce

Plataforma multi-tenant para gestión de negocios: catálogo de productos y servicios, órdenes y tickets, equipo por tenant, comisiones de venta y sitio web público por negocio.

---

## Descripción

Pars Commerce permite a cada negocio (tenant) administrar productos, servicios, órdenes y un equipo con roles. Incluye comisiones por venta, almacenamiento de imágenes en Supabase Storage y un sitio público por slug (`/sitio/[slug]`). La autenticación y los datos están centralizados en Supabase con Row Level Security (RLS).

---

## Stack

| Tecnología   | Uso                          |
| ------------ | ---------------------------- |
| Next.js 15   | App Router, API Routes       |
| TypeScript   | Tipado estático              |
| Tailwind CSS | Estilos                      |
| Supabase     | Auth, Postgres, RLS, Storage |
| Zustand      | Estado global (sesión, tenant)|

---

## Prácticas y rendimiento

El proyecto sigue las [Vercel React Best Practices](https://vercel.com/blog) para Next.js y React:

- **Waterfalls**: evitar cadenas de `await` secuenciales en API routes; usar `Promise.all` cuando las operaciones sean independientes.
- **Bundle**: imports directos o `optimizePackageImports` para librerías tipo barrel (p. ej. `lucide-react`).
- **Server**: autenticación y autorización en cada API route y Server Action; mínima serialización en límites RSC.

Guía detallada para agentes y refactors: `.agents/skills/vercel-react-best-practices/AGENTS.md`.

---

## Requisitos previos

- **Node.js** 20+
- **npm** (o pnpm/yarn)
- **Cuenta Supabase** ([supabase.com](https://supabase.com))
- **Opcional**: [Supabase CLI](https://supabase.com/docs/guides/cli) para aplicar migraciones desde terminal

---

## Configuración

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd pars_commerce
npm install
```

### 2. Variables de entorno

Copia el archivo de ejemplo y edita los valores con los de tu proyecto Supabase:

```bash
cp .env.local.example .env.local
```

Variables requeridas en `.env.local`:

| Variable                    | Descripción                                              |
| -------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto (Project Settings → API → Project URL)  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública (Project Settings → API → anon key) |
| `SUPABASE_SERVICE_ROLE_KEY`     | Clave de servicio (Project Settings → API → service_role). Usada por el cliente admin (invitaciones, perfiles, etc.). **No exponer en el cliente.** |

### 3. Base de datos y Auth en Supabase

#### 3.1 Crear proyecto en Supabase

1. Entra en [app.supabase.com](https://app.supabase.com) y crea un proyecto (o usa uno existente).
2. En **Project Settings → API** copia la **Project URL** y las claves **anon** y **service_role** para `.env.local`.

#### 3.2 Aplicar migraciones

Las migraciones definen el esquema (tenants, perfiles, productos, órdenes, comisiones, storage, RLS, etc.). Deben ejecutarse **en orden**, según el prefijo de fecha del nombre del archivo.

**Opción A — Con Supabase CLI (recomendado)**

```bash
# Enlazar al proyecto (te pedirá URL y clave o login)
npx supabase link --project-ref <tu-project-ref>

# Aplicar todas las migraciones pendientes
npx supabase db push
```

El **Project ref** está en la URL del proyecto: `https://app.supabase.com/project/<project-ref>`.

**Opción B — Manualmente en el SQL Editor**

1. En el dashboard de Supabase: **SQL Editor**.
2. Ejecuta cada archivo de `supabase/migrations/` **en orden alfabético** (el nombre ya incluye orden cronológico):

   - `20260202000001_pars_commerce_core.sql`
   - `20260202000002_pars_commerce_commerce.sql`
   - `20260202000003_pars_commerce_seed_tenant.sql`
   - `20260207000001_fix_tenant_memberships_rls.sql`
   - `20260207000002_storage_product_images.sql`
   - `20260207000003_add_member_role.sql`
   - `20260208000001_add_products_theme.sql`
   - `20260208000002_auto_inventory_management.sql`
   - `20260208000003_add_product_cost.sql`
   - `20260208000004_sales_commissions.sql`
   - `20260208000005_add_product_commission.sql`
   - `20260208000006_update_commission_calculation.sql`
   - `20260208000007_commission_payments.sql`
   - `20260209000001_fix_handle_new_user_display_name.sql`
   - `20260209000002_fix_profiles_read_policy.sql`
   - `20260209000003_add_profiles_insert_policy.sql`
   - `20260209000004_sync_missing_profiles_from_auth_users.sql`

#### 3.3 Configurar Authentication

1. En Supabase: **Authentication → Providers**.
2. Habilita **Email** (o el proveedor que vayas a usar).
3. En desarrollo, opcional: en **Email** desactiva **Confirm email** para no depender del enlace de confirmación.

Con esto la base de datos y la autenticación quedan listas para la aplicación.

---

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Comandos útiles:

- `npm run build` — build de producción
- `npm run start` — servir build de producción
- `npm run lint` — ESLint

---

## Flujo de la aplicación

- **Inicio**: enlaces a Login y Dashboard.
- **Registro**: alta en Supabase Auth; se crea el perfil en la tabla `profiles`.
- **Login**: redirección a `/dashboard`.
- **Dashboard**: requiere sesión. Si no hay negocios, se ofrece **Crear negocio**. Con al menos un negocio, se elige tenant y se accede a:
  - **Productos** y **Servicios** (CRUD, imágenes, inventario)
  - **Órdenes** (crear, asignar, flujo de estados, ítems, pago)
  - **Equipo** (roles, invitaciones por email)
  - **Ventas / Comisiones** (resumen y pagos de comisiones)
  - **Configuración**
- Al crear un negocio se crean el rol **owner**, las páginas por defecto del sitio (inicio, productos, promociones, nosotros, contacto) y la membresía del usuario como owner.

---

## Próximos pasos (roadmap)

- CMS del sitio web por tenant (edición de páginas).
- Sitio público por tenant (`/sitio/[slug]`) completo.
- Integración Mercado Pago (checkout y webhooks).
