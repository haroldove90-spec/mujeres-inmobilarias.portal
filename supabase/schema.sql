-- Esquema SQL para Supabase — Mujer Inmobiliaria & Asociadas
-- Ejecutar en el SQL Editor de tu proyecto Supabase cuando estés listo para conectar.

create extension if not exists "pgcrypto";

-- 1. Asesoras / Equipo comercial
create table if not exists public.advisors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  license text not null default '',
  email text not null,
  phone text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Catálogo de inmuebles
create table if not exists public.properties (
  id text primary key,
  folio text not null unique,
  title text not null,
  operation text not null check (operation in ('Venta', 'Renta', 'Terreno')),
  category text not null check (category in ('Residencial', 'Villa', 'Terreno', 'Corporativo')),
  state text not null check (state in ('Querétaro', 'Yucatán', 'Estado de México')),
  zone text not null,
  price_mxn numeric not null check (price_mxn >= 0),
  price_suffix text default '',
  area_land_m2 numeric not null default 0,
  area_const_m2 numeric not null default 0,
  bedrooms integer not null default 0,
  bathrooms numeric not null default 0,
  parking integer not null default 0,
  image text not null,
  gallery jsonb not null default '[]'::jsonb,
  status text not null default 'Disponible' check (status in ('Disponible', 'Apartada', 'Vendida', 'Rentada', 'Oculta')),
  featured boolean not null default false,
  legal_status text not null default '',
  advisor_id text not null,
  advisor_name text not null,
  advisor_role text not null,
  advisor_license text not null,
  highlights jsonb not null default '[]'::jsonb,
  description text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 3. Prospectos y solicitudes de visita (CRM)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  intent text not null,
  source text not null check (source in ('Contacto general', 'Ficha de propiedad')),
  property_id text null,
  property_title text null,
  property_folio text null,
  preferred_date text null,
  notes text not null default '',
  internal_notes text not null default '',
  assigned_advisor text not null default '',
  status text not null default 'Nuevo' check (status in ('Nuevo', 'Contactado', 'Visita agendada', 'En negociación', 'Cerrado', 'Archivado')),
  created_at timestamptz not null default now()
);

-- 4. Contenidos editables del portal (CMS)
create table if not exists public.site_content (
  id text primary key default 'main',
  content jsonb not null,
  updated_at timestamptz not null default now()
);

-- 5. Seguridad Row Level Security (RLS)
alter table public.advisors enable row level security;
alter table public.properties enable row level security;
alter table public.leads enable row level security;
alter table public.site_content enable row level security;

-- Lectura pública para el portal (solo inmuebles no ocultos, asesoras activas y contenidos)
create policy "Public read properties" on public.properties
  for select using (status <> 'Oculta' or auth.role() = 'authenticated');

create policy "Public read advisors" on public.advisors
  for select using (active = true or auth.role() = 'authenticated');

create policy "Public read site_content" on public.site_content
  for select using (true);

-- Inserción pública de prospectos desde formularios del portal
create policy "Public insert leads" on public.leads
  for insert with check (true);

-- Administración completa solo para usuarias autenticadas (Administradora / Asesoras)
create policy "Authenticated manage properties" on public.properties
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated manage advisors" on public.advisors
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated manage leads" on public.leads
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated manage site_content" on public.site_content
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
