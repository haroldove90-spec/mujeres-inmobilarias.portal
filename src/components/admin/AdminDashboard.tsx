import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Edit3,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  AdminSession,
  Advisor,
  LeadRecord,
  LeadStatus,
  OperationType,
  PropertyListing,
  PropertyStatus,
  SiteContent,
  VisitAppointment,
} from '../../types/portal';
import { formatMxn } from '../../data/properties';
import { formatReadableDate } from '../../lib/calendarUtils';
import { BrandLogo } from '../BrandLogo';
import { PropertyEditorModal } from './PropertyEditorModal';
import { AdminCmsEditor } from './AdminCmsEditor';
import { AdminAgenda } from './AdminAgenda';
import { AdminPhotosManager } from './AdminPhotosManager';

type AdminView = 'overview' | 'agenda' | 'photos' | 'properties' | 'leads' | 'advisors' | 'cms';

interface AdminDashboardProps {
  session: AdminSession;
  properties: PropertyListing[];
  advisors: Advisor[];
  leads: LeadRecord[];
  appointments: VisitAppointment[];
  siteContent: SiteContent;
  onBackToPortal: () => void;
  onLogout: () => void;
  onSaveProperty: (property: PropertyListing) => Promise<void>;
  onDeleteProperty: (id: string) => Promise<void>;
  onUpdateLead: (lead: LeadRecord) => Promise<void>;
  onSaveAdvisor: (advisor: Advisor) => Promise<void>;
  onDeleteAdvisor: (id: string) => Promise<void>;
  onSaveAppointment: (appointment: VisitAppointment) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onSaveSiteContent: (content: SiteContent) => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

const LEAD_STATUS_OPTIONS: LeadStatus[] = [
  'Nuevo',
  'Contactado',
  'Visita agendada',
  'En negociación',
  'Cerrado',
  'Archivado',
];

const PROPERTY_STATUS_OPTIONS: PropertyStatus[] = [
  'Disponible',
  'Apartada',
  'Vendida',
  'Rentada',
  'Oculta',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  properties,
  advisors,
  leads,
  appointments,
  siteContent,
  onBackToPortal,
  onLogout,
  onSaveProperty,
  onDeleteProperty,
  onUpdateLead,
  onSaveAdvisor,
  onDeleteAdvisor,
  onSaveAppointment,
  onDeleteAppointment,
  onSaveSiteContent,
  onResetDefaults,
}) => {
  const [view, setView] = useState<AdminView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agendaPrefill, setAgendaPrefill] = useState<Partial<VisitAppointment> | null>(null);

  // Properties table controls
  const [propQuery, setPropQuery] = useState('');
  const [propOpFilter, setPropOpFilter] = useState<'Todas' | OperationType>('Todas');
  const [propStatusFilter, setPropStatusFilter] = useState<'Todos' | PropertyStatus>('Todos');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');
  const [confirmDeletePropId, setConfirmDeletePropId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorProperty, setEditorProperty] = useState<PropertyListing | null>(null);

  // Leads CRM controls
  const [leadStatusFilter, setLeadStatusFilter] = useState<'Todos' | LeadStatus>('Todos');
  const [leadQuery, setLeadQuery] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(leads[0]?.id ?? null);

  // Advisors form state
  const [advFormOpen, setAdvFormOpen] = useState(false);
  const [advEditingId, setAdvEditingId] = useState<string | null>(null);
  const [advName, setAdvName] = useState('');
  const [advRole, setAdvRole] = useState('');
  const [advLicense, setAdvLicense] = useState('');
  const [advEmail, setAdvEmail] = useState('');
  const [advPhone, setAdvPhone] = useState('');
  const [confirmDeleteAdvId, setConfirmDeleteAdvId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const active = properties.filter((p) => p.status !== 'Oculta').length;
    const forSale = properties.filter(
      (p) => (p.operation === 'Venta' || p.operation === 'Terreno') && p.status !== 'Oculta'
    ).length;
    const scheduledVisits = appointments.filter(
      (a) => a.status === 'Programada' || a.status === 'Confirmada'
    ).length;
    const newLeads = leads.filter((l) => l.status === 'Nuevo').length;
    return { active, forSale, scheduledVisits, newLeads };
  }, [properties, leads, appointments]);

  const filteredProps = useMemo(() => {
    const q = propQuery.trim().toLowerCase();
    return properties.filter((p) => {
      if (propOpFilter !== 'Todas' && p.operation !== propOpFilter) return false;
      if (propStatusFilter !== 'Todos' && p.status !== propStatusFilter) return false;
      if (q) {
        const hay = `${p.folio} ${p.title} ${p.zone} ${p.state}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [properties, propQuery, propOpFilter, propStatusFilter]);

  const filteredLeads = useMemo(() => {
    const q = leadQuery.trim().toLowerCase();
    return leads.filter((l) => {
      if (leadStatusFilter !== 'Todos' && l.status !== leadStatusFilter) return false;
      if (q) {
        const hay = `${l.name} ${l.email} ${l.phone} ${l.propertyFolio ?? ''} ${l.intent}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, leadStatusFilter, leadQuery]);

  const activeLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) ?? filteredLeads[0] ?? null,
    [leads, selectedLeadId, filteredLeads]
  );

  const navItems: { id: AdminView; label: string; icon: React.ReactNode; adminOnly?: boolean }[] =
    [
      { id: 'overview', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'agenda', label: 'Agenda de visitas', icon: <Calendar className="w-4 h-4" /> },
      { id: 'photos', label: 'Fotos y Portada', icon: <ImageIcon className="w-4 h-4" /> },
      { id: 'properties', label: 'Inmuebles y precios', icon: <Building2 className="w-4 h-4" /> },
      { id: 'leads', label: 'Prospectos y visitas', icon: <Inbox className="w-4 h-4" /> },
      {
        id: 'advisors',
        label: 'Asesoras',
        icon: <Users className="w-4 h-4" />,
        adminOnly: true,
      },
      {
        id: 'cms',
        label: 'Contenidos del portal',
        icon: <FileText className="w-4 h-4" />,
      },
    ];

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || session.role === 'administradora'
  );

  const currentTitle =
    visibleNavItems.find((i) => i.id === view)?.label ?? 'Resumen';

  const handleInlinePriceSave = async (prop: PropertyListing) => {
    const val = Number(editingPriceValue);
    if (!isNaN(val) && val > 0) {
      await onSaveProperty({
        ...prop,
        priceMxn: val,
        updatedAt: new Date().toISOString(),
      });
    }
    setEditingPriceId(null);
  };

  const openAdvisorForm = (adv?: Advisor) => {
    if (adv) {
      setAdvEditingId(adv.id);
      setAdvName(adv.name);
      setAdvRole(adv.role);
      setAdvLicense(adv.license);
      setAdvEmail(adv.email);
      setAdvPhone(adv.phone);
    } else {
      setAdvEditingId(null);
      setAdvName('');
      setAdvRole('Asesora Inmobiliaria');
      setAdvLicense('');
      setAdvEmail('');
      setAdvPhone('');
    }
    setAdvFormOpen(true);
  };

  const handleSaveAdvisorForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advName.trim() || !advEmail.includes('@')) return;
    await onSaveAdvisor({
      id: advEditingId ?? `adv-${Date.now()}`,
      name: advName.trim(),
      role: advRole.trim() || 'Asesora Inmobiliaria',
      license: advLicense.trim(),
      email: advEmail.trim(),
      phone: advPhone.trim(),
      active: true,
    });
    setAdvFormOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F9F8FA] text-[#161513] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-[260px] shrink-0 bg-white border-r border-[#E6E2E8] flex-col justify-between">
        <div>
          <div className="h-16 px-5 border-b border-[#E6E2E8] flex items-center">
            <BrandLogo className="h-9 w-auto" />
          </div>

          <nav aria-label="Menú de administración" className="p-3 space-y-1">
            {visibleNavItems.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#892B84] text-white'
                      : 'text-[#57534E] hover:bg-[#F9F8FA] hover:text-[#161513]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5 truncate">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.id === 'leads' && metrics.newLeads > 0 && (
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        active ? 'text-white/90' : 'text-[#892B84] font-semibold'
                      }`}
                    >
                      {metrics.newLeads}
                    </span>
                  )}
                  {item.id === 'agenda' && metrics.scheduledVisits > 0 && (
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        active ? 'text-white/90' : 'text-[#892B84] font-semibold'
                      }`}
                    >
                      {metrics.scheduledVisits}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#E6E2E8] space-y-3">
          <div className="text-xs">
            <p className="font-semibold text-[#161513] truncate">{session.name}</p>
            <p className="text-[#57534E] truncate">{session.email}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[#892B84] font-semibold">
              {session.role}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 px-3 border border-[#E6E2E8] text-xs font-medium text-[#57534E] hover:text-[#161513] hover:border-[#161513]/30 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-[#161513]/50"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="w-[260px] h-full bg-white border-r border-[#E6E2E8] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="h-16 px-4 border-b border-[#E6E2E8] flex items-center justify-between">
                <BrandLogo className="h-9 w-auto" />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Cerrar navegación"
                  className="w-8 h-8 inline-flex items-center justify-center border border-[#E6E2E8]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="p-3 space-y-1">
                {visibleNavItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setView(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium ${
                      view === item.id ? 'bg-[#892B84] text-white' : 'text-[#57534E]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-4 border-t border-[#E6E2E8]">
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2 px-3 border border-[#E6E2E8] text-xs font-medium text-[#57534E] inline-flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Breadcrumb Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E6E2E8] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú de administración"
              className="lg:hidden w-9 h-9 inline-flex items-center justify-center border border-[#E6E2E8] text-[#161513] cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <p className="text-xs sm:text-sm text-[#57534E] truncate">
              <span>Administración</span>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-[#161513]">{currentTitle}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onBackToPortal}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E6E2E8] bg-white text-xs font-medium text-[#161513] hover:border-[#892B84] hover:text-[#892B84] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver portal público</span>
              <span className="sm:hidden">Portal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditorProperty(null);
                setEditorOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo inmueble</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1320px] w-full mx-auto space-y-8">
          {/* VIEW 1: OVERVIEW */}
          {view === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E6E2E8] p-5">
                  <p className="text-xs text-[#57534E]">Inmuebles visibles</p>
                  <p className="mt-2 font-mono text-2xl font-medium text-[#161513] tabular-nums">
                    {metrics.active}
                  </p>
                </div>
                <div className="bg-white border border-[#E6E2E8] p-5">
                  <p className="text-xs text-[#57534E]">Venta y Terrenos</p>
                  <p className="mt-2 font-mono text-2xl font-medium text-[#161513] tabular-nums">
                    {metrics.forSale}
                  </p>
                </div>
                <div className="bg-white border border-[#E6E2E8] p-5">
                  <p className="text-xs text-[#57534E]">Visitas en agenda</p>
                  <p className="mt-2 font-mono text-2xl font-medium text-[#892B84] tabular-nums">
                    {metrics.scheduledVisits}
                  </p>
                </div>
                <div className="bg-white border border-[#E6E2E8] p-5">
                  <p className="text-xs text-[#57534E]">Solicitudes nuevas</p>
                  <p className="mt-2 font-mono text-2xl font-medium text-[#892B84] tabular-nums">
                    {metrics.newLeads}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setView('photos')}
                  className="bg-white border border-[#E6E2E8] hover:border-[#892B84] p-4 text-left transition-colors cursor-pointer"
                >
                  <p className="text-xs font-semibold text-[#892B84] inline-flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Fotos y Portada</span>
                  </p>
                  <p className="mt-1 text-xs text-[#57534E]">
                    Cambia la foto principal del portal, galería de portada y fotos de inmuebles.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setView('cms')}
                  className="bg-white border border-[#E6E2E8] hover:border-[#892B84] p-4 text-left transition-colors cursor-pointer"
                >
                  <p className="text-xs font-semibold text-[#892B84] inline-flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Textos, Títulos y WhatsApp</span>
                  </p>
                  <p className="mt-1 text-xs text-[#57534E]">
                    Edita título, subtítulo, bienvenida, secciones, teléfonos y botón WhatsApp.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setView('agenda')}
                  className="bg-white border border-[#E6E2E8] hover:border-[#892B84] p-4 text-left transition-colors cursor-pointer"
                >
                  <p className="text-xs font-semibold text-[#892B84] inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agenda de Visitas</span>
                  </p>
                  <p className="mt-1 text-xs text-[#57534E]">
                    Programa citas en calendario, descarga al móvil (.ics) y activa alertas.
                  </p>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Recent Leads */}
                <div className="lg:col-span-7 bg-white border border-[#E6E2E8]">
                  <div className="px-5 py-4 border-b border-[#E6E2E8] flex items-center justify-between gap-4">
                    <h2 className="font-sans text-sm font-semibold text-[#161513]">
                      Últimos prospectos y visitas
                    </h2>
                    <button
                      type="button"
                      onClick={() => setView('leads')}
                      className="text-xs font-semibold text-[#892B84] hover:underline cursor-pointer"
                    >
                      Abrir bandeja completa
                    </button>
                  </div>
                  <div className="divide-y divide-[#E6E2E8]">
                    {leads.slice(0, 5).map((lead) => (
                      <div
                        key={lead.id}
                        className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#F9F8FA]"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#161513] truncate">{lead.name}</p>
                          <p className="text-xs text-[#57534E] truncate">
                            {lead.intent}
                            {lead.propertyFolio ? ` · ${lead.propertyFolio}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`text-xs font-medium ${
                              lead.status === 'Nuevo' ? 'text-[#892B84]' : 'text-[#57534E]'
                            }`}
                          >
                            {lead.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLeadId(lead.id);
                              setView('leads');
                            }}
                            className="text-xs font-semibold text-[#161513] hover:text-[#892B84] cursor-pointer"
                          >
                            Revisar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Appointments Preview */}
                <div className="lg:col-span-5 bg-white border border-[#E6E2E8]">
                  <div className="px-5 py-4 border-b border-[#E6E2E8] flex items-center justify-between gap-4">
                    <h2 className="font-sans text-sm font-semibold text-[#161513]">
                      Próximas visitas en agenda
                    </h2>
                    <button
                      type="button"
                      onClick={() => setView('agenda')}
                      className="text-xs font-semibold text-[#892B84] hover:underline cursor-pointer"
                    >
                      Abrir calendario
                    </button>
                  </div>
                  <div className="divide-y divide-[#E6E2E8]">
                    {appointments.filter((a) => a.status !== 'Cancelada').length > 0 ? (
                      appointments
                        .filter((a) => a.status !== 'Cancelada')
                        .slice(0, 5)
                        .map((apt) => (
                          <div
                            key={apt.id}
                            className="px-5 py-3.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#161513] truncate">
                                {apt.title}
                              </p>
                              <p className="text-xs text-[#57534E] font-mono tabular-nums truncate">
                                {formatReadableDate(apt.date)} · {apt.startTime} · {apt.clientName}
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold text-[#892B84] shrink-0">
                              {apt.status}
                            </span>
                          </div>
                        ))
                    ) : (
                      <div className="p-6 text-center text-xs text-[#57534E]">
                        No hay visitas programadas todavía.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* VIEW 2: AGENDA & CALENDAR */}
          {view === 'agenda' && (
            <AdminAgenda
              appointments={appointments}
              properties={properties}
              advisors={advisors}
              prefillDraft={agendaPrefill}
              onClearPrefill={() => setAgendaPrefill(null)}
              onSaveAppointment={onSaveAppointment}
              onDeleteAppointment={onDeleteAppointment}
            />
          )}

          {/* VIEW 2B: PHOTOS & COVER MANAGER */}
          {view === 'photos' && (
            <AdminPhotosManager
              siteContent={siteContent}
              properties={properties}
              onSaveSiteContent={onSaveSiteContent}
              onSaveProperty={onSaveProperty}
            />
          )}

          {/* VIEW 2: PROPERTIES & INLINE PRICING */}
          {view === 'properties' && (
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="bg-white border border-[#E6E2E8] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-[#57534E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={propQuery}
                      onChange={(e) => setPropQuery(e.target.value)}
                      placeholder="Buscar folio, título o zona..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                    />
                  </div>

                  <select
                    value={propOpFilter}
                    onChange={(e) => setPropOpFilter(e.target.value as 'Todas' | OperationType)}
                    className="px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  >
                    <option value="Todas">Todas las operaciones</option>
                    <option value="Venta">Venta</option>
                    <option value="Renta">Renta</option>
                    <option value="Terreno">Terreno</option>
                  </select>

                  <select
                    value={propStatusFilter}
                    onChange={(e) =>
                      setPropStatusFilter(e.target.value as 'Todos' | PropertyStatus)
                    }
                    className="px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  >
                    <option value="Todos">Todos los estatus</option>
                    {PROPERTY_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="font-mono text-xs text-[#57534E] tabular-nums">
                  {filteredProps.length} resultados
                </span>
              </div>

              {/* High-Density Data Table */}
              <div className="bg-white border border-[#E6E2E8] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[780px]">
                  <thead>
                    <tr className="border-b border-[#E6E2E8] bg-[#F9F8FA] text-[11px] uppercase tracking-[0.14em] text-[#57534E]">
                      <th className="py-3 px-4 font-semibold">Folio</th>
                      <th className="py-3 px-4 font-semibold">Inmueble / Plaza</th>
                      <th className="py-3 px-4 font-semibold">Operación</th>
                      <th className="py-3 px-4 font-semibold">Estatus</th>
                      <th className="py-3 px-4 font-semibold text-right">Precio (MXN)</th>
                      <th className="py-3 px-4 font-semibold text-center">Destacada</th>
                      <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2E8] text-xs">
                    {filteredProps.map((prop) => (
                      <tr key={prop.id} className="hover:bg-[#F9F8FA]">
                        <td className="py-3 px-4 font-mono text-[#892B84] font-medium whitespace-nowrap">
                          {prop.folio}
                        </td>
                        <td className="py-3 px-4 min-w-[210px]">
                          <p className="font-semibold text-[#161513]">{prop.title}</p>
                          <p className="text-[11px] text-[#57534E] truncate">{prop.zone}</p>
                        </td>
                        <td className="py-3 px-4 text-[#161513] whitespace-nowrap">
                          {prop.operation}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            aria-label={`Cambiar estatus de ${prop.title}`}
                            value={prop.status}
                            onChange={(e) =>
                              onSaveProperty({
                                ...prop,
                                status: e.target.value as PropertyStatus,
                                updatedAt: new Date().toISOString(),
                              })
                            }
                            className={`px-2 py-1 text-xs border bg-white focus:outline-none focus:border-[#892B84] ${
                              prop.status === 'Disponible'
                                ? 'text-[#16A34A] border-[#E6E2E8]'
                                : prop.status === 'Apartada'
                                ? 'text-[#D97706] border-[#E6E2E8]'
                                : 'text-[#57534E] border-[#E6E2E8]'
                            }`}
                          >
                            {PROPERTY_STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                          {editingPriceId === prop.id ? (
                            <div className="inline-flex items-center gap-1 justify-end">
                              <input
                                type="number"
                                min={0}
                                step={1000}
                                value={editingPriceValue}
                                onChange={(e) => setEditingPriceValue(e.target.value)}
                                className="w-28 px-2 py-1 text-xs text-right border border-[#892B84] bg-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleInlinePriceSave(prop)}
                                aria-label="Guardar precio"
                                className="p-1 bg-[#892B84] text-white cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPriceId(null)}
                                aria-label="Cancelar"
                                className="p-1 border border-[#E6E2E8] text-[#57534E] cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPriceId(prop.id);
                                setEditingPriceValue(String(prop.priceMxn));
                              }}
                              title="Clic para editar precio rápido"
                              className="inline-flex items-center gap-1.5 text-[#161513] hover:text-[#892B84] cursor-pointer"
                            >
                              <span>
                                {formatMxn(prop.priceMxn)}
                                {prop.priceSuffix ? ` ${prop.priceSuffix}` : ''}
                              </span>
                              <Edit3 className="w-3 h-3 opacity-60" />
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              onSaveProperty({
                                ...prop,
                                featured: !prop.featured,
                                updatedAt: new Date().toISOString(),
                              })
                            }
                            aria-label={
                              prop.featured ? 'Quitar de destacadas' : 'Marcar como destacada'
                            }
                            className={`p-1.5 inline-flex items-center justify-center cursor-pointer ${
                              prop.featured
                                ? 'text-[#892B84]'
                                : 'text-[#A8A29E] hover:text-[#161513]'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${prop.featured ? 'fill-current' : ''}`} />
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {confirmDeletePropId === prop.id ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteProperty(prop.id);
                                  setConfirmDeletePropId(null);
                                }}
                                className="px-2 py-1 bg-[#DC2626] text-white text-[11px] font-semibold cursor-pointer"
                              >
                                Eliminar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeletePropId(null)}
                                className="px-2 py-1 border border-[#E6E2E8] text-[11px] cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditorProperty(prop);
                                  setEditorOpen(true);
                                }}
                                className="px-2.5 py-1 border border-[#E6E2E8] text-xs font-medium text-[#161513] hover:border-[#892B84] hover:text-[#892B84] cursor-pointer"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeletePropId(prop.id)}
                                aria-label={`Eliminar ${prop.title}`}
                                className="p-1.5 text-[#57534E] hover:text-[#DC2626] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredProps.length === 0 && (
                  <div className="p-10 text-center space-y-3">
                    <p className="text-sm font-medium text-[#161513]">
                      No hay propiedades que coincidan con la búsqueda.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPropQuery('');
                        setPropOpFilter('Todas');
                        setPropStatusFilter('Todos');
                      }}
                      className="px-3.5 py-2 border border-[#E6E2E8] text-xs font-semibold cursor-pointer"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: LEADS & VISITS CRM */}
          {view === 'leads' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E6E2E8] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-[#57534E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={leadQuery}
                      onChange={(e) => setLeadQuery(e.target.value)}
                      placeholder="Buscar nombre, teléfono o folio..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                    />
                  </div>
                  <select
                    value={leadStatusFilter}
                    onChange={(e) => setLeadStatusFilter(e.target.value as 'Todos' | LeadStatus)}
                    className="px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  >
                    <option value="Todos">Todos los estatus</option>
                    {LEAD_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="font-mono text-xs text-[#57534E] tabular-nums">
                  {filteredLeads.length} prospectos
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white border border-[#E6E2E8] divide-y divide-[#E6E2E8]">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => {
                      const isSelected = activeLead?.id === lead.id;
                      return (
                        <button
                          key={lead.id}
                          type="button"
                          onClick={() => setSelectedLeadId(lead.id)}
                          className={`w-full text-left px-5 py-4 flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#F9F5F9]' : 'hover:bg-[#F9F8FA]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs text-[#57534E]">
                              <span
                                className={`font-semibold ${
                                  lead.status === 'Nuevo' ? 'text-[#892B84]' : 'text-[#161513]'
                                }`}
                              >
                                {lead.status}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{lead.source}</span>
                            </div>
                            <p className="mt-1 text-sm font-semibold text-[#161513] truncate">
                              {lead.name}
                            </p>
                            <p className="text-xs text-[#57534E] truncate">
                              {lead.intent}
                              {lead.propertyTitle ? ` — ${lead.propertyTitle}` : ''}
                            </p>
                          </div>
                          <span className="font-mono text-[11px] text-[#57534E] tabular-nums shrink-0">
                            {new Date(lead.createdAt).toLocaleDateString('es-MX')}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-10 text-center text-sm text-[#57534E]">
                      No hay solicitudes registradas con estos filtros.
                    </div>
                  )}
                </div>

                {/* Lead Detail Panel */}
                <div className="lg:col-span-5 bg-white border border-[#E6E2E8] p-5 sm:p-6 space-y-5">
                  {activeLead ? (
                    <>
                      <div className="pb-4 border-b border-[#E6E2E8]">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#892B84] font-semibold">
                          Detalle de solicitud
                        </p>
                        <h3 className="mt-1 text-xl font-medium text-[#161513]">
                          {activeLead.name}
                        </h3>
                        <p className="mt-1 text-xs text-[#57534E]">
                          {activeLead.email} · {activeLead.phone}
                        </p>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-[#57534E]">Interés:</span>{' '}
                          <span className="font-medium text-[#161513]">{activeLead.intent}</span>
                        </div>
                        {activeLead.propertyTitle && (
                          <div>
                            <span className="text-[#57534E]">Propiedad:</span>{' '}
                            <span className="font-medium text-[#161513]">
                              {activeLead.propertyTitle} ({activeLead.propertyFolio})
                            </span>
                          </div>
                        )}
                        {activeLead.preferredDate && (
                          <div>
                            <span className="text-[#57534E]">Fecha sugerida:</span>{' '}
                            <span className="font-mono text-[#161513]">
                              {activeLead.preferredDate}
                            </span>
                          </div>
                        )}
                        {activeLead.notes && (
                          <div className="p-3 bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] leading-relaxed">
                            {activeLead.notes}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 pt-2 border-t border-[#E6E2E8]">
                        <div>
                          <label className="block text-xs text-[#57534E] mb-1">
                            Estatus comercial
                          </label>
                          <select
                            value={activeLead.status}
                            onChange={(e) =>
                              onUpdateLead({
                                ...activeLead,
                                status: e.target.value as LeadStatus,
                              })
                            }
                            className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                          >
                            {LEAD_STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-[#57534E] mb-1">
                            Asesora responsable
                          </label>
                          <select
                            value={activeLead.assignedAdvisor}
                            onChange={(e) =>
                              onUpdateLead({
                                ...activeLead,
                                assignedAdvisor: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                          >
                            <option value="">Sin asignar</option>
                            {advisors.map((adv) => (
                              <option key={adv.id} value={adv.name}>
                                {adv.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-[#57534E] mb-1">
                            Notas internas de seguimiento
                          </label>
                          <textarea
                            rows={3}
                            value={activeLead.internalNotes}
                            onChange={(e) =>
                              onUpdateLead({
                                ...activeLead,
                                internalNotes: e.target.value,
                              })
                            }
                            placeholder="Registra acuerdos, presupuesto o siguiente paso..."
                            className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const matchedProp = properties.find(
                              (p) => p.id === activeLead.propertyId
                            );
                            setAgendaPrefill({
                              title: activeLead.propertyTitle
                                ? `Visita · ${activeLead.propertyTitle}`
                                : `Asesoría · ${activeLead.intent}`,
                              clientName: activeLead.name,
                              clientPhone: activeLead.phone,
                              clientEmail: activeLead.email,
                              propertyId: activeLead.propertyId,
                              propertyTitle: activeLead.propertyTitle,
                              propertyFolio: activeLead.propertyFolio,
                              advisorName:
                                activeLead.assignedAdvisor || matchedProp?.advisor.name || '',
                              date:
                                activeLead.preferredDate ||
                                new Date().toISOString().slice(0, 10),
                              startTime: '11:00',
                              location: matchedProp
                                ? `${matchedProp.zone}, ${matchedProp.state}`
                                : '',
                              notes: activeLead.notes,
                              status: 'Programada',
                              reminderMinutes: 60,
                              leadId: activeLead.id,
                            });
                            setView('agenda');
                          }}
                          className="w-full py-2 px-3 bg-[#161513] text-white text-xs font-semibold hover:bg-[#892B84] transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Agendar en calendario</span>
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={`mailto:${activeLead.email}?subject=Mujer%20Inmobiliaria%20-%20Seguimiento`}
                            className="py-2 px-3 bg-[#892B84] text-white text-xs font-semibold text-center hover:bg-[#6E206A]"
                          >
                            Enviar correo
                          </a>
                          <a
                            href={`tel:${activeLead.phone}`}
                            className="py-2 px-3 border border-[#E6E2E8] text-xs font-semibold text-center text-[#161513] hover:border-[#892B84]"
                          >
                            Llamar teléfono
                          </a>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#57534E]">
                      Selecciona un prospecto para revisar su seguimiento.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: ADVISORS TEAM */}
          {view === 'advisors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-[#57534E]">
                  Equipo autorizado para asignación de propiedades y prospectos.
                </p>
                <button
                  type="button"
                  onClick={() => openAdvisorForm()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar asesora</span>
                </button>
              </div>

              {advFormOpen && (
                <form
                  onSubmit={handleSaveAdvisorForm}
                  className="bg-white border border-[#E6E2E8] p-5 space-y-4"
                >
                  <h3 className="font-sans text-sm font-semibold text-[#161513]">
                    {advEditingId ? 'Editar asesora' : 'Nueva asesora'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={advName}
                      onChange={(e) => setAdvName(e.target.value)}
                      placeholder="Nombre completo"
                      className="px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                    />
                    <input
                      type="text"
                      value={advRole}
                      onChange={(e) => setAdvRole(e.target.value)}
                      placeholder="Cargo / Especialidad"
                      className="px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                    />
                    <input
                      type="text"
                      value={advLicense}
                      onChange={(e) => setAdvLicense(e.target.value)}
                      placeholder="Licencia o registro"
                      className="px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                    />
                    <input
                      type="email"
                      value={advEmail}
                      onChange={(e) => setAdvEmail(e.target.value)}
                      placeholder="Correo electrónico"
                      className="px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                    />
                    <input
                      type="tel"
                      value={advPhone}
                      onChange={(e) => setAdvPhone(e.target.value)}
                      placeholder="Teléfono / WhatsApp"
                      className="px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#892B84] text-white text-xs font-semibold cursor-pointer"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdvFormOpen(false)}
                        className="px-4 py-2 border border-[#E6E2E8] text-xs font-medium cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="bg-white border border-[#E6E2E8] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[680px]">
                  <thead>
                    <tr className="border-b border-[#E6E2E8] bg-[#F9F8FA] text-[11px] uppercase tracking-[0.14em] text-[#57534E]">
                      <th className="py-3 px-4 font-semibold">Nombre</th>
                      <th className="py-3 px-4 font-semibold">Cargo</th>
                      <th className="py-3 px-4 font-semibold">Registro</th>
                      <th className="py-3 px-4 font-semibold">Contacto</th>
                      <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2E8] text-xs">
                    {advisors.map((adv) => (
                      <tr key={adv.id} className="hover:bg-[#F9F8FA]">
                        <td className="py-3 px-4 font-semibold text-[#161513]">{adv.name}</td>
                        <td className="py-3 px-4 text-[#57534E]">{adv.role}</td>
                        <td className="py-3 px-4 font-mono text-[#57534E]">{adv.license}</td>
                        <td className="py-3 px-4 text-[#57534E]">
                          <p>{adv.email}</p>
                          <p className="font-mono text-[11px]">{adv.phone}</p>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {confirmDeleteAdvId === adv.id ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteAdvisor(adv.id);
                                  setConfirmDeleteAdvId(null);
                                }}
                                className="px-2 py-1 bg-[#DC2626] text-white text-[11px] font-semibold cursor-pointer"
                              >
                                Eliminar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteAdvId(null)}
                                className="px-2 py-1 border border-[#E6E2E8] text-[11px] cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openAdvisorForm(adv)}
                                className="px-2.5 py-1 border border-[#E6E2E8] font-medium hover:border-[#892B84] cursor-pointer"
                              >
                                Editar
                              </button>
                              {advisors.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteAdvId(adv.id)}
                                  aria-label={`Eliminar a ${adv.name}`}
                                  className="p-1.5 text-[#57534E] hover:text-[#DC2626] cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 5: CMS SITE CONTENT */}
          {view === 'cms' && (
            <AdminCmsEditor
              content={siteContent}
              onSave={onSaveSiteContent}
              onResetDefaults={onResetDefaults}
            />
          )}
        </main>
      </div>

      {/* Full Property Editor Modal */}
      <PropertyEditorModal
        isOpen={editorOpen}
        initialProperty={editorProperty}
        advisors={advisors}
        onClose={() => setEditorOpen(false)}
        onSave={onSaveProperty}
      />
    </div>
  );
};
