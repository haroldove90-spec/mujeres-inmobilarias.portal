-- Esquema SQL completo para Supabase — Mujer Inmobiliaria & Asociadas
-- Ejecutar en el SQL Editor de tu proyecto Supabase (dtgnwgtrtbufdslfeakk).

create extension if not exists "pgcrypto";

-- 1. Cuentas de acceso privadas (Administración y Clientes)
create table if not exists public.portal_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  full_name text not null,
  email text not null unique,
  whatsapp text not null default '',
  role text not null check (role in ('administradora', 'asesora', 'cliente')),
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Sesiones privadas verificadas en servidor
create table if not exists public.portal_sessions (
  token text primary key,
  user_id uuid not null references public.portal_users(id) on delete cascade,
  role text not null check (role in ('administradora', 'asesora', 'cliente')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

-- 3. Asesoras / Equipo comercial
create table if not exists public.advisors (
  id text primary key,
  name text not null,
  role text not null,
  license text not null default '',
  email text not null,
  phone text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. Catálogo de inmuebles
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

-- 5. Prospectos y solicitudes de visita (CRM)
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

-- 6. Contenidos editables del portal (CMS)
create table if not exists public.site_content (
  id text primary key default 'main',
  content jsonb not null,
  updated_at timestamptz not null default now()
);

-- 7. Agenda de visitas inmobiliarias
create table if not exists public.appointments (
  id text primary key,
  title text not null,
  client_name text not null,
  client_phone text not null default '',
  client_email text not null default '',
  property_id text null,
  property_title text null,
  property_folio text null,
  advisor_name text not null default '',
  visit_date text not null,
  start_time text not null,
  duration_minutes integer not null default 60,
  location text not null default '',
  notes text not null default '',
  status text not null default 'Programada' check (status in ('Programada', 'Confirmada', 'Completada', 'Cancelada')),
  reminder_minutes integer not null default 60,
  lead_id text null,
  created_at timestamptz not null default now()
);

-- 8. Row Level Security (RLS)
alter table public.portal_users enable row level security;
alter table public.portal_sessions enable row level security;
alter table public.advisors enable row level security;
alter table public.properties enable row level security;
alter table public.leads enable row level security;
alter table public.site_content enable row level security;
alter table public.appointments enable row level security;

-- Limpieza idempotente de políticas previas
drop policy if exists "Public read properties" on public.properties;
drop policy if exists "Public read advisors" on public.advisors;
drop policy if exists "Public read site_content" on public.site_content;
drop policy if exists "Public insert leads" on public.leads;
drop policy if exists "Authenticated manage properties" on public.properties;
drop policy if exists "Authenticated manage advisors" on public.advisors;
drop policy if exists "Authenticated manage leads" on public.leads;
drop policy if exists "Authenticated manage site_content" on public.site_content;

-- Lectura pública controlada (sin acceso directo a portal_users, portal_sessions ni lectura pública de leads)
create policy "Public read properties" on public.properties
  for select using (status <> 'Oculta');

create policy "Public read advisors" on public.advisors
  for select using (active = true);

create policy "Public read site_content" on public.site_content
  for select using (true);

create policy "Public insert leads" on public.leads
  for insert with check (true);

-- Permisos de acceso API (indispensables para que anon/authenticated lean el portal público)
grant usage on schema public to anon, authenticated;
grant select on public.properties, public.advisors, public.site_content to anon, authenticated;
grant insert on public.leads to anon, authenticated;

-- 8. Funciones seguras de autenticación y administración (SECURITY DEFINER)

create or replace function public.create_admin_account(
  p_username text,
  p_full_name text,
  p_email text,
  p_password text,
  p_role text default 'administradora'
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if p_role not in ('administradora', 'asesora') then
    raise exception 'Rol administrativo no válido';
  end if;

  insert into public.portal_users (username, full_name, email, whatsapp, role, password_hash)
  values (
    lower(trim(p_username)),
    trim(p_full_name),
    lower(trim(p_email)),
    '',
    p_role,
    crypt(p_password, gen_salt('bf', 10))
  )
  on conflict (username) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        role = excluded.role,
        password_hash = excluded.password_hash,
        active = true
  returning id into v_id;

  return v_id;
end;
$$;

-- Solo ejecutable desde SQL Editor / rol de servicio (nunca desde el navegador)
revoke all on function public.create_admin_account(text, text, text, text, text) from public, anon, authenticated;

create or replace function public.register_client_user(
  p_full_name text,
  p_email text,
  p_username text,
  p_password text,
  p_whatsapp text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_username text := lower(trim(p_username));
  v_email text := lower(trim(p_email));
  v_user_id uuid;
  v_token text;
begin
  if length(trim(p_full_name)) < 2 then
    return jsonb_build_object('ok', false, 'error', 'Ingresa tu nombre completo.');
  end if;
  if position('@' in v_email) <= 1 then
    return jsonb_build_object('ok', false, 'error', 'Ingresa un correo electrónico válido.');
  end if;
  if length(v_username) < 3 then
    return jsonb_build_object('ok', false, 'error', 'El usuario debe tener al menos 3 caracteres.');
  end if;
  if length(p_password) < 6 then
    return jsonb_build_object('ok', false, 'error', 'La contraseña debe tener al menos 6 caracteres.');
  end if;
  if length(regexp_replace(p_whatsapp, '\D', '', 'g')) < 8 then
    return jsonb_build_object('ok', false, 'error', 'Ingresa un número de WhatsApp válido.');
  end if;

  if exists (select 1 from public.portal_users where username = v_username or email = v_email) then
    return jsonb_build_object('ok', false, 'error', 'El usuario o correo electrónico ya se encuentra registrado.');
  end if;

  insert into public.portal_users (username, full_name, email, whatsapp, role, password_hash)
  values (
    v_username,
    trim(p_full_name),
    v_email,
    trim(p_whatsapp),
    'cliente',
    crypt(p_password, gen_salt('bf', 10))
  )
  returning id into v_user_id;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.portal_sessions (token, user_id, role)
  values (v_token, v_user_id, 'cliente');

  return jsonb_build_object(
    'ok', true,
    'token', v_token,
    'user', jsonb_build_object(
      'id', v_user_id,
      'username', v_username,
      'fullName', trim(p_full_name),
      'email', v_email,
      'whatsapp', trim(p_whatsapp),
      'role', 'cliente'
    )
  );
end;
$$;

create or replace function public.login_portal_user(
  p_username text,
  p_password text,
  p_expected_scope text default 'any'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_identifier text := lower(trim(p_username));
  v_user public.portal_users%rowtype;
  v_token text;
begin
  select *
  into v_user
  from public.portal_users
  where (lower(username) = v_identifier or lower(email) = v_identifier)
    and active = true
  limit 1;

  if v_user.id is null or v_user.password_hash <> crypt(p_password, v_user.password_hash) then
    return jsonb_build_object('ok', false, 'error', 'Usuario o contraseña incorrectos.');
  end if;

  if p_expected_scope = 'admin' and v_user.role not in ('administradora', 'asesora') then
    return jsonb_build_object('ok', false, 'error', 'Usuario o contraseña incorrectos.');
  end if;

  if p_expected_scope = 'client' and v_user.role <> 'cliente' then
    return jsonb_build_object('ok', false, 'error', 'Usuario o contraseña incorrectos.');
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.portal_sessions (token, user_id, role)
  values (v_token, v_user.id, v_user.role);

  return jsonb_build_object(
    'ok', true,
    'token', v_token,
    'user', jsonb_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'fullName', v_user.full_name,
      'email', v_user.email,
      'whatsapp', v_user.whatsapp,
      'role', v_user.role
    )
  );
end;
$$;

create or replace function public.logout_portal_user(p_token text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.portal_sessions where token = p_token;
end;
$$;

create or replace function public.require_admin_role(
  p_token text,
  p_require_super boolean default false
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_role text;
begin
  select u.role
  into v_role
  from public.portal_sessions s
  join public.portal_users u on u.id = s.user_id
  where s.token = p_token
    and s.expires_at > now()
    and u.active = true;

  if v_role is null or v_role not in ('administradora', 'asesora') then
    raise exception 'Sesión no autorizada';
  end if;

  if p_require_super and v_role <> 'administradora' then
    raise exception 'Se requiere perfil de administradora';
  end if;

  return v_role;
end;
$$;

create or replace function public.admin_list_properties(p_token text)
returns setof public.properties
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_admin_role(p_token, false);
  return query select * from public.properties order by featured desc, updated_at desc;
end;
$$;

create or replace function public.admin_upsert_property(p_token text, p_item jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_admin_role(p_token, false);

  insert into public.properties (
    id, folio, title, operation, category, state, zone,
    price_mxn, price_suffix, area_land_m2, area_const_m2,
    bedrooms, bathrooms, parking, image, gallery, status,
    featured, legal_status, advisor_id, advisor_name,
    advisor_role, advisor_license, highlights, description, updated_at
  )
  values (
    p_item->>'id',
    p_item->>'folio',
    p_item->>'title',
    p_item->>'operation',
    p_item->>'category',
    p_item->>'state',
    p_item->>'zone',
    (p_item->>'price_mxn')::numeric,
    coalesce(p_item->>'price_suffix', ''),
    coalesce((p_item->>'area_land_m2')::numeric, 0),
    coalesce((p_item->>'area_const_m2')::numeric, 0),
    coalesce((p_item->>'bedrooms')::integer, 0),
    coalesce((p_item->>'bathrooms')::numeric, 0),
    coalesce((p_item->>'parking')::integer, 0),
    p_item->>'image',
    coalesce(p_item->'gallery', '[]'::jsonb),
    coalesce(p_item->>'status', 'Disponible'),
    coalesce((p_item->>'featured')::boolean, false),
    coalesce(p_item->>'legal_status', ''),
    coalesce(p_item->>'advisor_id', ''),
    coalesce(p_item->>'advisor_name', ''),
    coalesce(p_item->>'advisor_role', ''),
    coalesce(p_item->>'advisor_license', ''),
    coalesce(p_item->'highlights', '[]'::jsonb),
    coalesce(p_item->>'description', ''),
    now()
  )
  on conflict (id) do update set
    folio = excluded.folio,
    title = excluded.title,
    operation = excluded.operation,
    category = excluded.category,
    state = excluded.state,
    zone = excluded.zone,
    price_mxn = excluded.price_mxn,
    price_suffix = excluded.price_suffix,
    area_land_m2 = excluded.area_land_m2,
    area_const_m2 = excluded.area_const_m2,
    bedrooms = excluded.bedrooms,
    bathrooms = excluded.bathrooms,
    parking = excluded.parking,
    image = excluded.image,
    gallery = excluded.gallery,
    status = excluded.status,
    featured = excluded.featured,
    legal_status = excluded.legal_status,
    advisor_id = excluded.advisor_id,
    advisor_name = excluded.advisor_name,
    advisor_role = excluded.advisor_role,
    advisor_license = excluded.advisor_license,
    highlights = excluded.highlights,
    description = excluded.description,
    updated_at = now();
end;
$$;

create or replace function public.admin_delete_property(p_token text, p_id text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_admin_role(p_token, false);
  delete from public.properties where id = p_id;
end;
$$;

create or replace function public.admin_list_advisors(p_token text)
returns setof public.advisors
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_admin_role(p_token, false);
  return query select * from public.advisors order by name asc;
end;
$$;

create or replace function public.admin_upsert_advisor(p_token text, p_item jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_admin_role(p_token, true);

  insert into public.advisors (id, name, role, license, email, phone, active)
  values (
    p_item->>'id',
    p_item->>'name',
    p_item->>'role',
    coalesce(p_item->>'license', ''),
    p_item->>'email',
    coalesce(p_item->>'phone', ''),
    coalesce((p_item->>'active')::boolean, true)
  )
  on conflict (id) do update set
    name = excluded.name,
    role = excluded.role,
    license = excluded.license,
    email = excluded.email,
    phone = excluded.phone,
    active = excluded.active;
end;
$$;

create or replace function public.admin_delete_advisor(p_token text, p_id text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_admin_role(p_token, true);
  delete from public.advisors where id = p_id;
end;
$$;

create or replace function public.admin_list_leads(p_token text)
returns setof public.leads
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_admin_role(p_token, false);
  return query select * from public.leads order by created_at desc;
end;
$$;

create or replace function public.admin_update_lead(
  p_token text,
  p_id uuid,
  p_status text,
  p_internal_notes text,
  p_assigned_advisor text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_admin_role(p_token, false);

  update public.leads
  set status = p_status,
      internal_notes = coalesce(p_internal_notes, ''),
      assigned_advisor = coalesce(p_assigned_advisor, '')
  where id = p_id;
end;
$$;

create or replace function public.admin_save_site_content(p_token text, p_content jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_admin_role(p_token, false);

  insert into public.site_content (id, content, updated_at)
  values ('main', p_content, now())
  on conflict (id) do update set
    content = excluded.content,
    updated_at = now();
end;
$$;

create or replace function public.admin_list_appointments(p_token text)
returns setof public.appointments
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_admin_role(p_token, false);
  return query select * from public.appointments order by visit_date asc, start_time asc;
end;
$$;

create or replace function public.admin_upsert_appointment(p_token text, p_item jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_admin_role(p_token, false);

  insert into public.appointments (
    id, title, client_name, client_phone, client_email,
    property_id, property_title, property_folio, advisor_name,
    visit_date, start_time, duration_minutes, location,
    notes, status, reminder_minutes, lead_id
  )
  values (
    p_item->>'id',
    p_item->>'title',
    p_item->>'client_name',
    coalesce(p_item->>'client_phone', ''),
    coalesce(p_item->>'client_email', ''),
    nullif(p_item->>'property_id', ''),
    nullif(p_item->>'property_title', ''),
    nullif(p_item->>'property_folio', ''),
    coalesce(p_item->>'advisor_name', ''),
    p_item->>'visit_date',
    p_item->>'start_time',
    coalesce((p_item->>'duration_minutes')::integer, 60),
    coalesce(p_item->>'location', ''),
    coalesce(p_item->>'notes', ''),
    coalesce(p_item->>'status', 'Programada'),
    coalesce((p_item->>'reminder_minutes')::integer, 60),
    nullif(p_item->>'lead_id', '')
  )
  on conflict (id) do update set
    title = excluded.title,
    client_name = excluded.client_name,
    client_phone = excluded.client_phone,
    client_email = excluded.client_email,
    property_id = excluded.property_id,
    property_title = excluded.property_title,
    property_folio = excluded.property_folio,
    advisor_name = excluded.advisor_name,
    visit_date = excluded.visit_date,
    start_time = excluded.start_time,
    duration_minutes = excluded.duration_minutes,
    location = excluded.location,
    notes = excluded.notes,
    status = excluded.status,
    reminder_minutes = excluded.reminder_minutes,
    lead_id = excluded.lead_id;
end;
$$;

create or replace function public.admin_delete_appointment(p_token text, p_id text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_admin_role(p_token, false);
  delete from public.appointments where id = p_id;
end;
$$;

grant execute on function public.login_portal_user(text, text, text) to anon, authenticated;
grant execute on function public.logout_portal_user(text) to anon, authenticated;
grant execute on function public.admin_list_properties(text) to anon, authenticated;
grant execute on function public.admin_upsert_property(text, jsonb) to anon, authenticated;
grant execute on function public.admin_delete_property(text, text) to anon, authenticated;
grant execute on function public.admin_list_advisors(text) to anon, authenticated;
grant execute on function public.admin_upsert_advisor(text, jsonb) to anon, authenticated;
grant execute on function public.admin_delete_advisor(text, text) to anon, authenticated;
grant execute on function public.admin_list_leads(text) to anon, authenticated;
grant execute on function public.admin_update_lead(text, uuid, text, text, text) to anon, authenticated;
grant execute on function public.admin_save_site_content(text, jsonb) to anon, authenticated;
grant execute on function public.admin_list_appointments(text) to anon, authenticated;
grant execute on function public.admin_upsert_appointment(text, jsonb) to anon, authenticated;
grant execute on function public.admin_delete_appointment(text, text) to anon, authenticated;
