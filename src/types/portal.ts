export type OperationType = 'Venta' | 'Renta' | 'Terreno';
export type PropertyCategory = 'Residencial' | 'Villa' | 'Terreno' | 'Corporativo';
export type RegionState = 'Querétaro' | 'Yucatán' | 'Estado de México';
export type PropertyStatus = 'Disponible' | 'Apartada' | 'Vendida' | 'Rentada' | 'Oculta';

export type NosotrasTabId = 'mision' | 'vision' | 'valores' | 'alianzas';

export type LeadStatus =
  | 'Nuevo'
  | 'Contactado'
  | 'Visita agendada'
  | 'En negociación'
  | 'Cerrado'
  | 'Archivado';

export type AdminRole = 'administradora' | 'asesora';

export interface Advisor {
  id: string;
  name: string;
  role: string;
  license: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface PropertyListing {
  id: string;
  folio: string;
  title: string;
  operation: OperationType;
  category: PropertyCategory;
  state: RegionState;
  zone: string;
  priceMxn: number;
  priceSuffix?: string;
  areaLandM2: number;
  areaConstM2: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  image: string;
  gallery: string[];
  status: PropertyStatus;
  featured: boolean;
  legalStatus: string;
  advisorId: string;
  advisor: {
    name: string;
    role: string;
    license: string;
  };
  highlights: string[];
  description: string;
  updatedAt: string;
}

export interface LeadRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  intent: string;
  source: 'Contacto general' | 'Ficha de propiedad';
  propertyId?: string;
  propertyTitle?: string;
  propertyFolio?: string;
  preferredDate?: string;
  notes: string;
  internalNotes: string;
  assignedAdvisor: string;
  status: LeadStatus;
  createdAt: string;
}

export interface NosotrasPillar {
  id: NosotrasTabId;
  label: string;
  kicker: string;
  title: string;
  body: string;
  highlights: string[];
}

export interface ValorItem {
  number: string;
  name: string;
  detail: string;
}

export interface ServiceItem {
  number: string;
  title: string;
  summary: string;
  deliverables: string[];
  contactIntent: string;
}

export interface CapabilityItem {
  number: string;
  title: string;
  description: string;
}

export interface SiteContent {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroImageCaptionZone: string;
  heroImageCaptionTitle: string;
  capabilities: CapabilityItem[];
  nosotrasKicker: string;
  nosotrasHeading: string;
  nosotrasPillars: NosotrasPillar[];
  valoresList: ValorItem[];
  servicesKicker: string;
  servicesHeading: string;
  servicesSubheading: string;
  servicesList: ServiceItem[];
  contactKicker: string;
  contactHeading: string;
  contactSubtitle: string;
  officeTitle: string;
  officeAddress: string;
  officePhone: string;
  officeEmail: string;
}

export interface AdminSession {
  id: string;
  username: string;
  email: string;
  name: string;
  role: AdminRole;
  token: string;
}

export interface ClientSession {
  id: string;
  username: string;
  fullName: string;
  email: string;
  whatsapp: string;
  token: string;
}

