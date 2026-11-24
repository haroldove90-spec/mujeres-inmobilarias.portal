import {
  DEFAULT_ADVISORS,
  DEFAULT_APPOINTMENTS,
  DEFAULT_LEADS,
  DEFAULT_PROPERTIES,
  DEFAULT_SITE_CONTENT,
} from '../data/properties';
import {
  AdminRole,
  AdminSession,
  Advisor,
  AppointmentStatus,
  ClientSession,
  LeadRecord,
  PropertyListing,
  SiteContent,
  VisitAppointment,
} from '../types/portal';
import { isSupabaseConfigured, supabase } from './supabase';

const KEYS = {
  properties: 'mia_portal_properties_v1',
  advisors: 'mia_portal_advisors_v1',
  leads: 'mia_portal_leads_v1',
  siteContent: 'mia_portal_site_content_v1',
  appointments: 'mia_portal_appointments_v1',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

function mapSupabaseProperty(row: Record<string, unknown>): PropertyListing {
  return {
    id: String(row.id),
    folio: String(row.folio),
    title: String(row.title),
    operation: row.operation as PropertyListing['operation'],
    category: row.category as PropertyListing['category'],
    state: row.state as PropertyListing['state'],
    zone: String(row.zone),
    priceMxn: Number(row.price_mxn ?? 0),
    priceSuffix: row.price_suffix ? String(row.price_suffix) : undefined,
    areaLandM2: Number(row.area_land_m2 ?? 0),
    areaConstM2: Number(row.area_const_m2 ?? 0),
    bedrooms: Number(row.bedrooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 0),
    parking: Number(row.parking ?? 0),
    image: String(row.image ?? ''),
    gallery: Array.isArray(row.gallery) ? (row.gallery as string[]) : [],
    status: (row.status as PropertyListing['status']) ?? 'Disponible',
    featured: Boolean(row.featured),
    legalStatus: String(row.legal_status ?? ''),
    advisorId: String(row.advisor_id ?? ''),
    advisor: {
      name: String(row.advisor_name ?? ''),
      role: String(row.advisor_role ?? ''),
      license: String(row.advisor_license ?? ''),
    },
    highlights: Array.isArray(row.highlights) ? (row.highlights as string[]) : [],
    description: String(row.description ?? ''),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapSupabaseLead(r: Record<string, unknown>): LeadRecord {
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    phone: String(r.phone),
    intent: String(r.intent),
    source: r.source as LeadRecord['source'],
    propertyId: r.property_id ? String(r.property_id) : undefined,
    propertyTitle: r.property_title ? String(r.property_title) : undefined,
    propertyFolio: r.property_folio ? String(r.property_folio) : undefined,
    preferredDate: r.preferred_date ? String(r.preferred_date) : undefined,
    notes: String(r.notes ?? ''),
    internalNotes: String(r.internal_notes ?? ''),
    assignedAdvisor: String(r.assigned_advisor ?? ''),
    status: r.status as LeadRecord['status'],
    createdAt: String(r.created_at),
  };
}

function toSupabaseProperty(item: PropertyListing) {
  return {
    id: item.id,
    folio: item.folio,
    title: item.title,
    operation: item.operation,
    category: item.category,
    state: item.state,
    zone: item.zone,
    price_mxn: item.priceMxn,
    price_suffix: item.priceSuffix ?? '',
    area_land_m2: item.areaLandM2,
    area_const_m2: item.areaConstM2,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    parking: item.parking,
    image: item.image,
    gallery: item.gallery,
    status: item.status,
    featured: item.featured,
    legal_status: item.legalStatus,
    advisor_id: item.advisorId,
    advisor_name: item.advisor.name,
    advisor_role: item.advisor.role,
    advisor_license: item.advisor.license,
    highlights: item.highlights,
    description: item.description,
    updated_at: new Date().toISOString(),
  };
}

function mapSupabaseAppointment(r: Record<string, unknown>): VisitAppointment {
  return {
    id: String(r.id),
    title: String(r.title ?? ''),
    clientName: String(r.client_name ?? ''),
    clientPhone: String(r.client_phone ?? ''),
    clientEmail: String(r.client_email ?? ''),
    propertyId: r.property_id ? String(r.property_id) : undefined,
    propertyTitle: r.property_title ? String(r.property_title) : undefined,
    propertyFolio: r.property_folio ? String(r.property_folio) : undefined,
    advisorName: String(r.advisor_name ?? ''),
    date: String(r.visit_date ?? ''),
    startTime: String(r.start_time ?? '10:00'),
    durationMinutes: Number(r.duration_minutes ?? 60),
    location: String(r.location ?? ''),
    notes: String(r.notes ?? ''),
    status: (r.status as AppointmentStatus) ?? 'Programada',
    reminderMinutes: Number(r.reminder_minutes ?? 60),
    leadId: r.lead_id ? String(r.lead_id) : undefined,
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

function toSupabaseAppointment(item: VisitAppointment) {
  return {
    id: item.id,
    title: item.title,
    client_name: item.clientName,
    client_phone: item.clientPhone,
    client_email: item.clientEmail,
    property_id: item.propertyId ?? '',
    property_title: item.propertyTitle ?? '',
    property_folio: item.propertyFolio ?? '',
    advisor_name: item.advisorName,
    visit_date: item.date,
    start_time: item.startTime,
    duration_minutes: item.durationMinutes,
    location: item.location,
    notes: item.notes,
    status: item.status,
    reminder_minutes: item.reminderMinutes,
    lead_id: item.leadId ?? '',
  };
}

export async function loginAdminAccount(
  username: string,
  password: string
): Promise<{ ok: true; session: AdminSession } | { ok: false; error: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Configura las variables de Supabase para iniciar sesión.',
    };
  }

  const { data, error } = await supabase.rpc('login_portal_user', {
    p_username: username.trim(),
    p_password: password,
    p_expected_scope: 'admin',
  });

  if (error) {
    return {
      ok: false,
      error:
        'No se pudo validar el acceso en Supabase. Verifica que ejecutaste el script SQL en tu proyecto.',
    };
  }

  const res = data as {
    ok?: boolean;
    error?: string;
    token?: string;
    user?: {
      id: string;
      username: string;
      fullName: string;
      email: string;
      role: AdminRole;
    };
  } | null;

  if (!res?.ok || !res.user || !res.token) {
    return {
      ok: false,
      error: res?.error ?? 'Usuario o contraseña incorrectos.',
    };
  }

  return {
    ok: true,
    session: {
      id: res.user.id,
      username: res.user.username,
      email: res.user.email,
      name: res.user.fullName,
      role: res.user.role,
      token: res.token,
    },
  };
}

export async function registerClientAccount(payload: {
  fullName: string;
  email: string;
  username: string;
  password: string;
  whatsapp: string;
}): Promise<{ ok: true; session: ClientSession } | { ok: false; error: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Configura Supabase para registrar clientes.',
    };
  }

  const { data, error } = await supabase.rpc('register_client_user', {
    p_full_name: payload.fullName.trim(),
    p_email: payload.email.trim(),
    p_username: payload.username.trim(),
    p_password: payload.password,
    p_whatsapp: payload.whatsapp.trim(),
  });

  if (error) {
    return {
      ok: false,
      error:
        'No se pudo completar el registro en Supabase. Verifica que ejecutaste el script SQL en tu proyecto.',
    };
  }

  const res = data as {
    ok?: boolean;
    error?: string;
    token?: string;
    user?: {
      id: string;
      username: string;
      fullName: string;
      email: string;
      whatsapp: string;
    };
  } | null;

  if (!res?.ok || !res.user || !res.token) {
    return {
      ok: false,
      error: res?.error ?? 'No fue posible crear tu cuenta.',
    };
  }

  return {
    ok: true,
    session: {
      id: res.user.id,
      username: res.user.username,
      fullName: res.user.fullName,
      email: res.user.email,
      whatsapp: res.user.whatsapp,
      token: res.token,
    },
  };
}

export async function loginClientAccount(
  username: string,
  password: string
): Promise<{ ok: true; session: ClientSession } | { ok: false; error: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Configura Supabase para iniciar sesión.',
    };
  }

  const { data, error } = await supabase.rpc('login_portal_user', {
    p_username: username.trim(),
    p_password: password,
    p_expected_scope: 'client',
  });

  if (error) {
    return {
      ok: false,
      error:
        'No se pudo validar tu acceso en Supabase. Verifica que ejecutaste el script SQL en tu proyecto.',
    };
  }

  const res = data as {
    ok?: boolean;
    error?: string;
    token?: string;
    user?: {
      id: string;
      username: string;
      fullName: string;
      email: string;
      whatsapp: string;
    };
  } | null;

  if (!res?.ok || !res.user || !res.token) {
    return {
      ok: false,
      error: res?.error ?? 'Usuario o contraseña incorrectos.',
    };
  }

  return {
    ok: true,
    session: {
      id: res.user.id,
      username: res.user.username,
      fullName: res.user.fullName,
      email: res.user.email,
      whatsapp: res.user.whatsapp,
      token: res.token,
    },
  };
}

export async function logoutPortalToken(token?: string): Promise<void> {
  if (!token || !isSupabaseConfigured || !supabase) return;
  try {
    await supabase.rpc('logout_portal_user', { p_token: token });
  } catch {
    // Ignore logout network error gracefully
  }
}

function mergeSiteContent(partial: Partial<SiteContent> | null | undefined): SiteContent {
  if (!partial) return DEFAULT_SITE_CONTENT;
  const heroImage = partial.heroImage || DEFAULT_SITE_CONTENT.heroImage;
  const rawGallery = Array.isArray(partial.heroGallery) ? partial.heroGallery.filter(Boolean) : [];
  const heroGallery =
    rawGallery.length > 0
      ? rawGallery.includes(heroImage)
        ? rawGallery
        : [heroImage, ...rawGallery]
      : [heroImage];

  return {
    ...DEFAULT_SITE_CONTENT,
    ...partial,
    heroImage,
    heroGallery,
    sectionsEnabled: {
      ...DEFAULT_SITE_CONTENT.sectionsEnabled,
      ...(partial.sectionsEnabled ?? {}),
    },
  };
}

function formatSupabaseError(error: { message?: string; code?: string } | null, action: string): Error {
  const msg = error?.message ?? 'Error desconocido en Supabase';
  if (error?.code === '42501' || /permission denied/i.test(msg)) {
    return new Error(
      `Permisos pendientes en Supabase al ${action}. Ejecuta el SQL actualizado en el SQL Editor de tu proyecto.`
    );
  }
  return new Error(`No se pudo ${action} en Supabase: ${msg}`);
}

export async function loadPortalData(adminToken?: string): Promise<{
  properties: PropertyListing[];
  advisors: Advisor[];
  leads: LeadRecord[];
  siteContent: SiteContent;
  appointments: VisitAppointment[];
}> {
  const localProps = readLocal(KEYS.properties, DEFAULT_PROPERTIES);
  const localAdvisors = readLocal(KEYS.advisors, DEFAULT_ADVISORS);
  const localLeads = readLocal(KEYS.leads, DEFAULT_LEADS);
  const localContent = mergeSiteContent(
    readLocal<Partial<SiteContent>>(KEYS.siteContent, DEFAULT_SITE_CONTENT)
  );
  const localAppointments = readLocal(KEYS.appointments, DEFAULT_APPOINTMENTS);

  if (!isSupabaseConfigured || !supabase) {
    return {
      properties: localProps,
      advisors: localAdvisors,
      leads: localLeads,
      siteContent: localContent,
      appointments: localAppointments,
    };
  }

  try {
    const propsPromise = adminToken
      ? supabase.rpc('admin_list_properties', { p_token: adminToken })
      : supabase.from('properties').select('*').order('featured', { ascending: false });

    const advPromise = adminToken
      ? supabase.rpc('admin_list_advisors', { p_token: adminToken })
      : supabase.from('advisors').select('*').order('name');

    const leadsPromise = adminToken
      ? supabase.rpc('admin_list_leads', { p_token: adminToken })
      : Promise.resolve({ data: null });

    const aptPromise = adminToken
      ? supabase.rpc('admin_list_appointments', { p_token: adminToken })
      : Promise.resolve({ data: null });

    const cmsPromise = supabase
      .from('site_content')
      .select('content')
      .eq('id', 'main')
      .maybeSingle();

    const [propsRes, advRes, leadsRes, cmsRes, aptRes] = await Promise.all([
      propsPromise,
      advPromise,
      leadsPromise,
      cmsPromise,
      aptPromise,
    ]);

    return {
      properties:
        Array.isArray(propsRes.data) && propsRes.data.length > 0
          ? propsRes.data.map((row) => mapSupabaseProperty(row as Record<string, unknown>))
          : localProps,
      advisors:
        Array.isArray(advRes.data) && advRes.data.length > 0
          ? (advRes.data as Advisor[])
          : localAdvisors,
      leads:
        Array.isArray(leadsRes.data) && leadsRes.data.length > 0
          ? leadsRes.data.map((row) => mapSupabaseLead(row as Record<string, unknown>))
          : adminToken
          ? []
          : localLeads,
      siteContent:
        cmsRes.data && cmsRes.data.content
          ? mergeSiteContent(cmsRes.data.content as Partial<SiteContent>)
          : localContent,
      appointments:
        Array.isArray(aptRes.data) && aptRes.data.length > 0
          ? aptRes.data.map((row) => mapSupabaseAppointment(row as Record<string, unknown>))
          : localAppointments,
    };
  } catch {
    return {
      properties: localProps,
      advisors: localAdvisors,
      leads: localLeads,
      siteContent: localContent,
      appointments: localAppointments,
    };
  }
}

export async function upsertProperty(
  item: PropertyListing,
  currentList: PropertyListing[],
  adminToken?: string
): Promise<PropertyListing[]> {
  if (isSupabaseConfigured && supabase && adminToken) {
    const { error } = await supabase.rpc('admin_upsert_property', {
      p_token: adminToken,
      p_item: toSupabaseProperty(item),
    });
    if (error) {
      throw formatSupabaseError(error, 'guardar el inmueble');
    }
  }

  const exists = currentList.some((p) => p.id === item.id);
  const next = exists
    ? currentList.map((p) => (p.id === item.id ? item : p))
    : [item, ...currentList];
  writeLocal(KEYS.properties, next);
  return next;
}

export async function removeProperty(
  id: string,
  currentList: PropertyListing[],
  adminToken?: string
): Promise<PropertyListing[]> {
  if (isSupabaseConfigured && supabase && adminToken) {
    const { error } = await supabase.rpc('admin_delete_property', {
      p_token: adminToken,
      p_id: id,
    });
    if (error) {
      throw formatSupabaseError(error, 'eliminar el inmueble');
    }
  }

  const next = currentList.filter((p) => p.id !== id);
  writeLocal(KEYS.properties, next);
  return next;
}

export async function upsertAdvisor(
  advisor: Advisor,
  currentList: Advisor[],
  adminToken?: string
): Promise<Advisor[]> {
  if (isSupabaseConfigured && supabase && adminToken) {
    const { error } = await supabase.rpc('admin_upsert_advisor', {
      p_token: adminToken,
      p_item: advisor,
    });
    if (error) {
      throw formatSupabaseError(error, 'guardar la asesora');
    }
  }

  const exists = currentList.some((a) => a.id === advisor.id);
  const next = exists
    ? currentList.map((a) => (a.id === advisor.id ? advisor : a))
    : [...currentList, advisor];
  writeLocal(KEYS.advisors, next);
  return next;
}

export async function removeAdvisor(
  id: string,
  currentList: Advisor[],
  adminToken?: string
): Promise<Advisor[]> {
  if (isSupabaseConfigured && supabase && adminToken) {
    const { error } = await supabase.rpc('admin_delete_advisor', {
      p_token: adminToken,
      p_id: id,
    });
    if (error) {
      throw formatSupabaseError(error, 'eliminar la asesora');
    }
  }

  const next = currentList.filter((a) => a.id !== id);
  writeLocal(KEYS.advisors, next);
  return next;
}

export async function createLead(
  lead: Omit<LeadRecord, 'id' | 'createdAt' | 'status' | 'internalNotes'>,
  currentList: LeadRecord[]
): Promise<LeadRecord[]> {
  const newLead: LeadRecord = {
    ...lead,
    id: `lead-${Date.now()}`,
    status: 'Nuevo',
    internalNotes: '',
    createdAt: new Date().toISOString(),
  };
  const next = [newLead, ...currentList];
  writeLocal(KEYS.leads, next);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('leads').insert({
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone,
      intent: newLead.intent,
      source: newLead.source,
      property_id: newLead.propertyId ?? null,
      property_title: newLead.propertyTitle ?? null,
      property_folio: newLead.propertyFolio ?? null,
      preferred_date: newLead.preferredDate ?? null,
      notes: newLead.notes,
      internal_notes: newLead.internalNotes,
      assigned_advisor: newLead.assignedAdvisor,
      status: newLead.status,
    });
  }
  return next;
}

export async function updateLead(
  lead: LeadRecord,
  currentList: LeadRecord[],
  adminToken?: string
): Promise<LeadRecord[]> {
  if (isSupabaseConfigured && supabase && adminToken && UUID_RE.test(lead.id)) {
    const { error } = await supabase.rpc('admin_update_lead', {
      p_token: adminToken,
      p_id: lead.id,
      p_status: lead.status,
      p_internal_notes: lead.internalNotes,
      p_assigned_advisor: lead.assignedAdvisor,
    });
    if (error) {
      throw formatSupabaseError(error, 'actualizar el prospecto');
    }
  }

  const next = currentList.map((item) => (item.id === lead.id ? lead : item));
  writeLocal(KEYS.leads, next);
  return next;
}

export async function saveSiteContent(
  content: SiteContent,
  adminToken?: string
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    if (!adminToken) {
      throw new Error('Tu sesión administrativa expiró. Vuelve a iniciar sesión para guardar en Supabase.');
    }
    const { error } = await supabase.rpc('admin_save_site_content', {
      p_token: adminToken,
      p_content: content,
    });
    if (error) {
      throw formatSupabaseError(error, 'guardar los contenidos del portal');
    }
  }
  writeLocal(KEYS.siteContent, content);
}

export async function upsertAppointment(
  item: VisitAppointment,
  currentList: VisitAppointment[],
  adminToken?: string
): Promise<VisitAppointment[]> {
  if (isSupabaseConfigured && supabase && adminToken) {
    const { error } = await supabase.rpc('admin_upsert_appointment', {
      p_token: adminToken,
      p_item: toSupabaseAppointment(item),
    });
    if (error) {
      throw formatSupabaseError(error, 'guardar la cita en agenda');
    }
  }

  const exists = currentList.some((a) => a.id === item.id);
  const next = (exists
    ? currentList.map((a) => (a.id === item.id ? item : a))
    : [...currentList, item]
  ).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  writeLocal(KEYS.appointments, next);
  return next;
}

export async function removeAppointment(
  id: string,
  currentList: VisitAppointment[],
  adminToken?: string
): Promise<VisitAppointment[]> {
  if (isSupabaseConfigured && supabase && adminToken) {
    const { error } = await supabase.rpc('admin_delete_appointment', {
      p_token: adminToken,
      p_id: id,
    });
    if (error) {
      throw formatSupabaseError(error, 'eliminar la cita de agenda');
    }
  }

  const next = currentList.filter((a) => a.id !== id);
  writeLocal(KEYS.appointments, next);
  return next;
}

export async function resetAllPortalData(): Promise<{
  properties: PropertyListing[];
  advisors: Advisor[];
  leads: LeadRecord[];
  siteContent: SiteContent;
  appointments: VisitAppointment[];
}> {
  writeLocal(KEYS.properties, DEFAULT_PROPERTIES);
  writeLocal(KEYS.advisors, DEFAULT_ADVISORS);
  writeLocal(KEYS.leads, DEFAULT_LEADS);
  writeLocal(KEYS.siteContent, DEFAULT_SITE_CONTENT);
  writeLocal(KEYS.appointments, DEFAULT_APPOINTMENTS);

  return {
    properties: DEFAULT_PROPERTIES,
    advisors: DEFAULT_ADVISORS,
    leads: DEFAULT_LEADS,
    siteContent: DEFAULT_SITE_CONTENT,
    appointments: DEFAULT_APPOINTMENTS,
  };
}
