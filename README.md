# Pars Commerce

Plataforma multi-tenant para negocios: productos, órdenes/tickets, sitio web por negocio y más.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- Zustand

## Configuración

1. Copia las variables de entorno:

```bash
cp .env.local.example .env.local
```

2. En `.env.local` configura tu proyecto Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto (ej. https://xxx.supabase.co)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave anónima (anon key)

3. Aplica las migraciones en Supabase:

- En el dashboard de Supabase: SQL Editor, o con CLI `supabase db push`.
- Ejecuta en orden los archivos en `supabase/migrations/`:
  - `20260202000001_pars_commerce_core.sql`
  - `20260202000002_pars_commerce_commerce.sql`
  - `20260202000003_pars_commerce_seed_tenant.sql`

4. En Supabase Auth habilita Email (o el proveedor que uses). Opcional: desactiva "Confirm email" en desarrollo.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Flujo actual

- **Inicio**: enlace a Login y Dashboard.
- **Registro**: crea cuenta (Supabase Auth); se crea perfil en `profiles`.
- **Login**: inicia sesión; redirige a `/dashboard`.
- **Dashboard**: requiere sesión. Si no hay negocios, permite "Crear negocio". Si hay, selector de negocio y acceso a:
  - Productos (placeholder)
  - Órdenes / Tickets (placeholder)
  - Configuración (placeholder)

Al crear un negocio se crean automáticamente el rol "owner", las páginas del sitio (inicio, productos, promociones, nosotros, contacto) y la membresía del usuario como owner.

## Próximos pasos (plan)

- API y UI de productos (CRUD, imágenes, inventario).
- API y UI de órdenes (crear ticket, asignar, iniciar/completar trabajo, cobrar).
- CMS del sitio web por tenant (editar páginas).
- Sitio público por tenant (`/sitio/[slug]/`).
- Integración MercadoPago (checkout y webhooks).
