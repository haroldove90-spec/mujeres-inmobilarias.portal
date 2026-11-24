import {
  DEFAULT_ADVISORS,
  DEFAULT_LEADS,
  DEFAULT_PROPERTIES,
  DEFAULT_SITE_CONTENT,
} from '../data/properties';
import {
  AdminSession,
  Advisor,
  LeadRecord,
  PropertyListing,
  SiteContent,
} from '../types/portal';
import { isSupabaseConfigured, supabase } from './supabase';

const KEYS = {
  properties: 'mia_portal_properties_v1',
  advisors: 'mia_portal_advisors_v1',
  leads: 'mia_portal_leads_v1',
  siteContent: 'mia_portal_site_content_v1',
  session: 'mia_admin_session_v1',
};

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

// Convert Supabase snake_case rows to camelCase app objects
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

export async function loadPortalData(): Promise<{
  properties: PropertyListing[];
  advisors: Advisor[];
  leads: LeadRecord[];
  siteContent: SiteContent;
}> {
  const localProps = readLocal(KEYS.properties, DEFAULT_PROPERTIES);
  const localAdvisors = readLocal(KEYS.advisors, DEFAULT_ADVISORS);
  const localLeads = readLocal(KEYS.leads, DEFAULT_LEADS);
  const localContent = readLocal(KEYS.siteContent, DEFAULT_SITE_CONTENT);

  if (!isSupabaseConfigured || !supabase) {
    return {
      properties: localProps,
      advisors: localAdvisors,
      leads: localLeads,
      siteContent: localContent,
    };
  }

  try {
    const [propsRes, advRes, leadsRes, cmsRes] = await Promise.all([
      supabase.from('properties').select('*').order('featured', { ascending: false }),
      supabase.from('advisors').select('*').order('name'),
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('site_content').select('content').eq('id', 'main').maybeSingle(),
    ]);

    return {
      properties:
        propsRes.data && propsRes.data.length > 0
          ? propsRes.data.map(mapSupabaseProperty)
          : localProps,
      advisors:
        advRes.data && advRes.data.length > 0 ? (advRes.data as Advisor[]) : localAdvisors,
      leads:
        leadsRes.data && leadsRes.data.length > 0
          ? leadsRes.data.map((r) => ({
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
            }))
          : localLeads,
      siteContent:
        cmsRes.data && cmsRes.data.content
          ? (cmsRes.data.content as SiteContent)
          : localContent,
    };
  } catch {
    return {
      properties: localProps,
      advisors: localAdvisors,
      leads: localLeads,
      siteContent: localContent,
    };
  }
}

export async function savePropertiesList(list: PropertyListing[]): Promise<void> {
  writeLocal(KEYS.properties, list);
}

export async function upsertProperty(
  item: PropertyListing,
  currentList: PropertyListing[]
): Promise<PropertyListing[]> {
  const exists = currentList.some((p) => p.id === item.id);
  const next = exists
    ? currentList.map((p) => (p.id === item.id ? item : p))
    : [item, ...currentList];
  writeLocal(KEYS.properties, next);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('properties').upsert(toSupabaseProperty(item));
  }
  return next;
}

export async function removeProperty(
  id: string,
  currentList: PropertyListing[]
): Promise<PropertyListing[]> {
  const next = currentList.filter((p) => p.id !== id);
  writeLocal(KEYS.properties, next);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('properties').delete().eq('id', id);
  }
  return next;
}

export async function upsertAdvisor(
  advisor: Advisor,
  currentList: Advisor[]
): Promise<Advisor[]> {
  const exists = currentList.some((a) => a.id === advisor.id);
  const next = exists
    ? currentList.map((a) => (a.id === advisor.id ? advisor : a))
    : [...currentList, advisor];
  writeLocal(KEYS.advisors, next);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('advisors').upsert(advisor);
  }
  return next;
}

export async function removeAdvisor(id: string, currentList: Advisor[]): Promise<Advisor[]> {
  const next = currentList.filter((a) => a.id !== id);
  writeLocal(KEYS.advisors, next);

  if (isSupabaseConfigured && supabase) {
    await supabase.from('advisors').delete().eq('id', id);
  }
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
  currentList: LeadRecord[]
): Promise<LeadRecord[]> {
  const next = currentList.map((item) => (item.id === lead.id ? lead : item));
  writeLocal(KEYS.leads, next);

  if (isSupabaseConfigured && supabase) {
    await supabase
      .from('leads')
      .update({
        status: lead.status,
        internal_notes: lead.internalNotes,
        assigned_advisor: lead.assignedAdvisor,
      })
      .eq('id', lead.id);
  }
  return next;
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  writeLocal(KEYS.siteContent, content);
  if (isSupabaseConfigured && supabase) {
    await supabase.from('site_content').upsert({
      id: 'main',
      content,
      updated_at: new Date().toISOString(),
    });
  }
}

export async function resetAllPortalData(): Promise<{
  properties: PropertyListing[];
  advisors: Advisor[];
  leads: LeadRecord[];
  siteContent: SiteContent;
}> {
  writeLocal(KEYS.properties, DEFAULT_PROPERTIES);
  writeLocal(KEYS.advisors, DEFAULT_ADVISORS);
  writeLocal(KEYS.leads, DEFAULT_LEADS);
  writeLocal(KEYS.siteContent, DEFAULT_SITE_CONTENT);

  return {
    properties: DEFAULT_PROPERTIES,
    advisors: DEFAULT_ADVISORS,
    leads: DEFAULT_LEADS,
    siteContent: DEFAULT_SITE_CONTENT,
  };
}

export function getSavedAdminSession(): AdminSession | null {
  return readLocal<AdminSession | null>(KEYS.session, null);
}

export function saveAdminSession(session: AdminSession | null): void {
  if (!session) {
    localStorage.removeItem(KEYS.session);
    return;
  }
  writeLocal(KEYS.session, session);
}
