-- Site templates: table + alter tenants + seed 10 plantillas

create table if not exists public.site_templates (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  description text,
  preview_image_url text,
  layout_variant text not null default 'classic',
  default_theme_color text default '#6366f1',
  config jsonb default '{}',
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.site_templates (slug, name, description, layout_variant, default_theme_color, sort_order)
values
  ('classic', 'Clásico', 'Diseño tradicional con barra de color y cards', 'classic', '#6366f1', 0),
  ('minimal', 'Minimalista', 'Limpio, mucho espacio en blanco', 'minimal', '#374151', 1),
  ('bento', 'Bento Grid', 'Cards en grid irregular, estilo Apple/moderno', 'bento', '#0a0a0a', 2),
  ('dark', 'Oscuro', 'Fondo oscuro, acentos claros', 'dark', '#22c55e', 3),
  ('elegant', 'Elegante', 'Serif, bordes suaves, espaciado amplio', 'elegant', '#8b7355', 4),
  ('bold', 'Bold', 'Colores fuertes, tipografía grande', 'bold', '#ef4444', 5),
  ('organic', 'Orgánico', 'Formas redondeadas, tonos tierra', 'organic', '#84cc16', 6),
  ('industrial', 'Industrial', 'Tipografía mono/condensed, grises', 'industrial', '#64748b', 7),
  ('vibrant', 'Vibrante', 'Gradientes, colores saturados', 'vibrant', '#ec4899', 8),
  ('clean', 'Clean', 'Blanco puro, bordes finos, minimal icons', 'clean', '#0891b2', 9);

alter table public.tenants
  add column if not exists site_template_id uuid references public.site_templates(id) on delete set null;

create index if not exists idx_tenants_site_template_id on public.tenants(site_template_id);
