import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Building2,
  Check,
  ChevronDown,
  Lock,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  X,
} from 'lucide-react';
import {
  DEFAULT_ADVISORS,
  DEFAULT_LEADS,
  DEFAULT_PROPERTIES,
  DEFAULT_SITE_CONTENT,
  HERO_IMAGE,
} from './data/properties';
import {
  AdminSession,
  Advisor,
  LeadRecord,
  NosotrasTabId,
  OperationType,
  PropertyListing,
  RegionState,
  SiteContent,
} from './types/portal';
import {
  createLead,
  getSavedAdminSession,
  loadPortalData,
  removeAdvisor,
  removeProperty,
  resetAllPortalData,
  saveAdminSession,
  saveSiteContent,
  updateLead,
  upsertAdvisor,
  upsertProperty,
} from './lib/portalStore';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { BrandLogo } from './components/BrandLogo';
import { PropertyCard } from './components/PropertyCard';
import { PropertyModal } from './components/PropertyModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SplashScreen } from './components/SplashScreen';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

type OperationFilter = 'Todas' | OperationType;
type RegionFilter = 'Todas' | RegionState;
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'area-desc';

const NOSOTRAS_SUBITEMS: { id: NosotrasTabId; label: string }[] = [
  { id: 'mision', label: 'Misión' },
  { id: 'vision', label: 'Visión' },
  { id: 'valores', label: 'Valores' },
  { id: 'alianzas', label: 'Alianzas' },
];

function checkAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname === '/admin' ||
    window.location.pathname === '/admin/' ||
    window.location.hash === '#admin'
  );
}

export default function App() {
  // Admin & persistence state
  const [isAdminView, setIsAdminView] = useState<boolean>(checkAdminRoute);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() =>
    getSavedAdminSession()
  );
  const [properties, setProperties] = useState<PropertyListing[]>(DEFAULT_PROPERTIES);
  const [advisors, setAdvisors] = useState<Advisor[]>(DEFAULT_ADVISORS);
  const [leads, setLeads] = useState<LeadRecord[]>(DEFAULT_LEADS);
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);

  // Navigation & Nosotras dropdown
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNosotrasOpen, setMobileNosotrasOpen] = useState(true);
  const [nosotrasDropdownOpen, setNosotrasDropdownOpen] = useState(false);
  const [activeNosotrasTab, setActiveNosotrasTab] = useState<NosotrasTabId>('mision');
  const nosotrasMenuRef = useRef<HTMLDivElement>(null);

  // Hero & catalog filtering state
  const [operationFilter, setOperationFilter] = useState<OperationFilter>('Todas');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [onlySaved, setOnlySaved] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>(['qro-campanario-01']);

  // Hero quick-search bar controlled state
  const [heroOp, setHeroOp] = useState<OperationFilter>('Todas');
  const [heroRegion, setHeroRegion] = useState<RegionFilter>('Todas');

  // Hero image resilience
  const [heroImgError, setHeroImgError] = useState(false);

  // Active property modal
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);

  // Advisory contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactIntent, setContactIntent] = useState('Comprar propiedad');
  const [contactNotes, setContactNotes] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Hydrate persisted portal data & Supabase session
  useEffect(() => {
    let mounted = true;
    loadPortalData().then((data) => {
      if (!mounted) return;
      setProperties(data.properties);
      setAdvisors(data.advisors);
      setLeads(data.leads);
      setSiteContent(data.siteContent);
    });

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (!mounted || !data.session?.user) return;
        const user = data.session.user;
        const restored: AdminSession = {
          email: user.email ?? '',
          name:
            (user.user_metadata?.full_name as string | undefined) ?? 'Dirección General',
          role:
            (user.user_metadata?.role as AdminSession['role'] | undefined) ??
            'administradora',
        };
        setAdminSession(restored);
        saveAdminSession(restored);
      });
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Sync admin route with URL changes
  useEffect(() => {
    const syncRoute = () => setIsAdminView(checkAdminRoute());
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  useEffect(() => {
    setHeroImgError(false);
  }, [siteContent.heroImage]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (nosotrasMenuRef.current && !nosotrasMenuRef.current.contains(e.target as Node)) {
        setNosotrasDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNosotrasDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const openAdmin = () => {
    setMobileMenuOpen(false);
    setNosotrasDropdownOpen(false);
    setIsAdminView(true);
    try {
      window.history.pushState(null, '', '/admin');
    } catch {
      window.location.hash = 'admin';
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const backToPortal = () => {
    setIsAdminView(false);
    try {
      window.history.pushState(null, '', '/');
    } catch {
      window.location.hash = '';
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleAdminLogin = (session: AdminSession) => {
    setAdminSession(session);
    saveAdminSession(session);
  };

  const handleAdminLogout = async () => {
    saveAdminSession(null);
    setAdminSession(null);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  };

  const handleSaveProperty = async (item: PropertyListing) => {
    const next = await upsertProperty(item, properties);
    setProperties(next);
  };

  const handleDeleteProperty = async (id: string) => {
    const next = await removeProperty(id, properties);
    setProperties(next);
  };

  const handleCreateLead = async (
    lead: Omit<LeadRecord, 'id' | 'createdAt' | 'status' | 'internalNotes'>
  ) => {
    const next = await createLead(lead, leads);
    setLeads(next);
  };

  const handleUpdateLead = async (lead: LeadRecord) => {
    const next = await updateLead(lead, leads);
    setLeads(next);
  };

  const handleSaveAdvisor = async (advisor: Advisor) => {
    const next = await upsertAdvisor(advisor, advisors);
    setAdvisors(next);
  };

  const handleDeleteAdvisor = async (id: string) => {
    const next = await removeAdvisor(id, advisors);
    setAdvisors(next);
  };

  const handleSaveSiteContent = async (content: SiteContent) => {
    await saveSiteContent(content);
    setSiteContent(content);
  };

  const handleResetDefaults = async () => {
    const fresh = await resetAllPortalData();
    setProperties(fresh.properties);
    setAdvisors(fresh.advisors);
    setLeads(fresh.leads);
    setSiteContent(fresh.siteContent);
  };

  const activeNosotrasPillar = useMemo(
    () =>
      siteContent.nosotrasPillars.find((p) => p.id === activeNosotrasTab) ??
      siteContent.nosotrasPillars[0],
    [siteContent.nosotrasPillars, activeNosotrasTab]
  );

  const filteredProperties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = properties.filter((item) => {
      if (item.status === 'Oculta') return false;
      if (operationFilter !== 'Todas' && item.operation !== operationFilter) return false;
      if (regionFilter !== 'Todas' && item.state !== regionFilter) return false;
      if (onlySaved && !savedIds.includes(item.id)) return false;
      if (q) {
        const haystack =
          `${item.title} ${item.zone} ${item.state} ${item.folio} ${item.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.priceMxn - b.priceMxn);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.priceMxn - a.priceMxn);
    }
    if (sortBy === 'area-desc') {
      return [...list].sort((a, b) => b.areaLandM2 - a.areaLandM2);
    }
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [properties, operationFilter, regionFilter, onlySaved, savedIds, searchQuery, sortBy]);

  const toggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setNosotrasDropdownOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectNosotrasSubitem = (tabId: NosotrasTabId) => {
    setActiveNosotrasTab(tabId);
    setNosotrasDropdownOpen(false);
    setMobileMenuOpen(false);
    const el = document.getElementById('nosotras');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOperationFilter(heroOp);
    setRegionFilter(heroRegion);
    setOnlySaved(false);
    scrollToSection('inmuebles');
  };

  const handleResetFilters = () => {
    setOperationFilter('Todas');
    setRegionFilter('Todas');
    setSearchQuery('');
    setOnlySaved(false);
    setSortBy('featured');
  };

  const handleServiceSelect = (intent: string) => {
    setContactIntent(intent);
    setContactSubmitted(false);
    scrollToSection('contacto');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.includes('@') || contactPhone.trim().length < 8) {
      setContactError(
        'Por favor completa tu nombre, correo electrónico válido y teléfono de contacto.'
      );
      return;
    }
    setContactError('');
    await handleCreateLead({
      name: contactName.trim(),
      email: contactEmail.trim(),
      phone: contactPhone.trim(),
      intent: contactIntent,
      source: 'Contacto general',
      notes: contactNotes.trim() || `Solicitud general de ${contactIntent.toLowerCase()}.`,
      assignedAdvisor: '',
    });
    setContactSubmitted(true);
  };

  if (isAdminView) {
    if (!adminSession) {
      return <AdminLogin onLogin={handleAdminLogin} onBackToPortal={backToPortal} />;
    }
    return (
      <AdminDashboard
        session={adminSession}
        properties={properties}
        advisors={advisors}
        leads={leads}
        siteContent={siteContent}
        onBackToPortal={backToPortal}
        onLogout={handleAdminLogout}
        onSaveProperty={handleSaveProperty}
        onDeleteProperty={handleDeleteProperty}
        onUpdateLead={handleUpdateLead}
        onSaveAdvisor={handleSaveAdvisor}
        onDeleteAdvisor={handleDeleteAdvisor}
        onSaveSiteContent={handleSaveSiteContent}
        onResetDefaults={handleResetDefaults}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#161513] overflow-x-clip">
      <SplashScreen />
      <OfflineIndicator />

      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-[#E6E2E8]">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-10 h-16 sm:h-[72px] flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
          {/* Zone 1: Brand Logo */}
          <a
            href="#inicio"
            aria-label="Mujer Inmobiliaria & Asociadas — Inicio"
            className="inline-flex items-center min-w-0 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#892B84]"
          >
            <BrandLogo className="h-9 sm:h-11 w-auto" />
          </a>

          {/* Zone 2: 5 Nav Items: Inicio, Nosotras (dropdown), Servicios, Inmuebles, Contacto */}
          <nav
            aria-label="Navegación principal"
            className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium text-[#57534E]"
          >
            <a
              href="#inicio"
              className="hover:text-[#892B84] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Inicio
            </a>

            {/* Nosotras Dropdown */}
            <div ref={nosotrasMenuRef} className="relative shrink-0">
              <button
                type="button"
                aria-expanded={nosotrasDropdownOpen}
                aria-haspopup="menu"
                onClick={() => setNosotrasDropdownOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1 hover:text-[#892B84] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  nosotrasDropdownOpen ? 'text-[#892B84] underline underline-offset-4' : ''
                }`}
              >
                <span>Nosotras</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    nosotrasDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {nosotrasDropdownOpen && (
                <div
                  role="menu"
                  aria-label="Subsecciones de Nosotras"
                  className="absolute left-0 top-full mt-3 w-48 bg-white border border-[#E6E2E8] shadow-lg py-1.5 z-50"
                >
                  {NOSOTRAS_SUBITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleSelectNosotrasSubitem(item.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center justify-between ${
                        activeNosotrasTab === item.id
                          ? 'bg-[#F9F5F9] text-[#892B84] font-semibold'
                          : 'text-[#161513] hover:bg-[#F9F8FA]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {activeNosotrasTab === item.id && (
                        <span className="text-[10px] font-mono text-[#892B84]">·</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a
              href="#servicios"
              className="hover:text-[#892B84] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Servicios
            </a>
            <a
              href="#inmuebles"
              className="hover:text-[#892B84] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Inmuebles
            </a>
            <a
              href="#contacto"
              className="hover:text-[#892B84] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Contacto
            </a>
          </nav>

          {/* Zone 3: Install App + Admin + Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <PWAInstallButton variant="header" />
            <button
              type="button"
              onClick={openAdmin}
              aria-label="Acceso Administración"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-[#E6E2E8] bg-white text-[#161513] text-xs font-semibold hover:border-[#892B84] hover:text-[#892B84] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#892B84]"
            >
              <Lock className="w-3.5 h-3.5 text-[#892B84]" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contacto')}
              className="hidden sm:inline-flex items-center px-3.5 lg:px-4 py-2 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#892B84]"
            >
              Agendar Asesoría
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center border border-[#E6E2E8] bg-white text-[#161513] hover:border-[#892B84] hover:text-[#892B84] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E6E2E8] bg-white px-4 sm:px-6 py-4 space-y-3">
            <div className="flex flex-col space-y-1 text-sm font-medium text-[#161513]">
              <a
                href="#inicio"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-[#E6E2E8]/70"
              >
                Inicio
              </a>

              {/* Mobile Nosotras Accordion */}
              <div className="border-b border-[#E6E2E8]/70 py-1">
                <button
                  type="button"
                  onClick={() => setMobileNosotrasOpen((prev) => !prev)}
                  className="w-full py-1.5 flex items-center justify-between text-left cursor-pointer"
                >
                  <span>Nosotras</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#57534E] transition-transform ${
                      mobileNosotrasOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {mobileNosotrasOpen && (
                  <div className="pl-4 pb-2 pt-1 flex flex-col space-y-1.5 text-xs text-[#57534E]">
                    {NOSOTRAS_SUBITEMS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectNosotrasSubitem(item.id)}
                        className={`text-left py-1 cursor-pointer ${
                          activeNosotrasTab === item.id
                            ? 'text-[#892B84] font-semibold'
                            : 'hover:text-[#161513]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <a
                href="#servicios"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-[#E6E2E8]/70"
              >
                Servicios
              </a>
              <a
                href="#inmuebles"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-[#E6E2E8]/70"
              >
                Inmuebles
              </a>
              <a
                href="#contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2"
              >
                Contacto
              </a>
            </div>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => scrollToSection('contacto')}
                className="w-full py-2.5 px-4 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors cursor-pointer"
              >
                Agendar Asesoría
              </button>
              <PWAInstallButton variant="drawer" />
              <button
                type="button"
                onClick={openAdmin}
                className="w-full py-2.5 px-4 border border-[#E6E2E8] bg-[#F9F8FA] text-[#161513] text-xs font-semibold hover:border-[#892B84] hover:text-[#892B84] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#892B84]" />
                <span>Acceso Administración</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 bg-white">
        {/* Section 1: Inicio (Hero Split + Quick Finder) */}
        <section id="inicio" className="bg-white border-b border-[#E6E2E8]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-stretch">
              {/* Left Narrative & Live Search */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-7 sm:gap-8 min-w-0">
                <div>
                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.22em] text-[#892B84] font-semibold">
                    {siteContent.heroEyebrow}
                  </p>
                  <h1 className="mt-3 sm:mt-4 text-[clamp(2.05rem,4.3vw,3.85rem)] font-medium tracking-tight text-[#161513] leading-[1.08] [text-wrap:balance]">
                    {siteContent.heroTitle}
                  </h1>
                  <p className="mt-5 text-[15px] sm:text-base leading-relaxed text-[#57534E] max-w-xl">
                    {siteContent.heroSubtitle}
                  </p>
                </div>

                {/* Integrated Property Finder */}
                <form
                  onSubmit={handleHeroSearch}
                  className="bg-white border border-[#E6E2E8] p-5 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="hero-op"
                        className="block text-[11px] uppercase tracking-[0.16em] text-[#57534E] mb-1.5"
                      >
                        Operación
                      </label>
                      <select
                        id="hero-op"
                        value={heroOp}
                        onChange={(e) => setHeroOp(e.target.value as OperationFilter)}
                        className="w-full px-3 py-2.5 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                      >
                        <option value="Todas">Todas las operaciones</option>
                        <option value="Venta">Venta residencial</option>
                        <option value="Renta">Renta ejecutiva</option>
                        <option value="Terreno">Terrenos &amp; desarrollos</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="hero-region"
                        className="block text-[11px] uppercase tracking-[0.16em] text-[#57534E] mb-1.5"
                      >
                        Plaza estratégica
                      </label>
                      <select
                        id="hero-region"
                        value={heroRegion}
                        onChange={(e) => setHeroRegion(e.target.value as RegionFilter)}
                        className="w-full px-3 py-2.5 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                      >
                        <option value="Todas">Querétaro, Yucatán y Edo. Méx.</option>
                        <option value="Querétaro">Querétaro</option>
                        <option value="Yucatán">Yucatán</option>
                        <option value="Estado de México">Estado de México</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Explorar inmuebles</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection('servicios')}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 border border-[#E6E2E8] text-xs font-medium text-[#161513] hover:border-[#892B84] hover:text-[#892B84] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Conocer servicios
                    </button>
                    <PWAInstallButton />
                  </div>
                </form>
              </div>

              {/* Right Focal Visual */}
              <div className="lg:col-span-6 flex flex-col min-w-0">
                <div className="relative flex-1 min-h-[260px] sm:min-h-[360px] lg:min-h-[460px] bg-[#F9F8FA] border border-[#E6E2E8] overflow-hidden">
                  {!heroImgError ? (
                    <img
                      src={siteContent.heroImage || HERO_IMAGE}
                      alt={siteContent.heroImageCaptionTitle}
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgError(true)}
                      className="w-full h-full lg:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#57534E] bg-gradient-to-br from-[#F9F8FA] to-[#E6E2E8] p-8">
                      <Building2 className="w-10 h-10" />
                      <span className="font-editorial text-2xl text-[#161513]">
                        Mujer Inmobiliaria &amp; Asociadas
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                    <p className="text-xs text-white/80">{siteContent.heroImageCaptionZone}</p>
                    <p className="mt-1 font-editorial text-xl text-white">
                      {siteContent.heroImageCaptionTitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Capabilities Strip */}
            <div className="mt-12 pt-8 border-t border-[#E6E2E8] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {siteContent.capabilities.map((cap) => (
                <div key={cap.number}>
                  <p className="font-mono text-xs text-[#892B84] font-semibold tabular-nums">
                    {cap.number}
                  </p>
                  <h2 className="mt-1 font-sans text-sm font-semibold text-[#161513]">
                    {cap.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#57534E]">{cap.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Nosotras (Misión, Visión, Valores, Alianzas) */}
        <section id="nosotras" className="py-14 sm:py-20 lg:py-24 bg-[#F9F8FA]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E6E2E8]">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.22em] text-[#892B84] font-semibold">
                  {siteContent.nosotrasKicker}
                </p>
                <h2 className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-[#161513] [text-wrap:balance]">
                  {siteContent.nosotrasHeading}
                </h2>
              </div>

              {/* Interactive Pillar Switcher */}
              <div
                role="tablist"
                aria-label="Pilares institucionales de Nosotras"
                className="inline-flex flex-wrap items-center gap-1 p-1 bg-white border border-[#E6E2E8] self-start lg:self-auto max-w-full"
              >
                {siteContent.nosotrasPillars.map((pillar) => (
                  <button
                    key={pillar.id}
                    type="button"
                    role="tab"
                    aria-selected={activeNosotrasTab === pillar.id}
                    onClick={() => setActiveNosotrasTab(pillar.id)}
                    className={`px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeNosotrasTab === pillar.id
                        ? 'bg-[#892B84] text-white'
                        : 'text-[#57534E] hover:text-[#892B84]'
                    }`}
                  >
                    {pillar.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Pillar Spotlight */}
            {activeNosotrasPillar && (
              <div className="mt-8 bg-white border border-[#E6E2E8] p-6 sm:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  <div className="lg:col-span-6 space-y-4 min-w-0">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#892B84] font-semibold">
                      {activeNosotrasPillar.kicker}
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#161513] leading-snug">
                      {activeNosotrasPillar.title}
                    </h3>
                    <p className="text-[15px] leading-relaxed text-[#57534E]">
                      {activeNosotrasPillar.body}
                    </p>
                  </div>

                  <div className="lg:col-span-6 min-w-0">
                    {activeNosotrasTab === 'valores' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {siteContent.valoresList.map((valor) => (
                          <div
                            key={valor.number}
                            className="p-4 bg-[#F9F8FA] border border-[#E6E2E8]"
                          >
                            <p className="font-mono text-[11px] text-[#892B84] font-semibold tabular-nums">
                              {valor.number}
                            </p>
                            <p className="mt-1 font-sans text-sm font-semibold text-[#161513]">
                              {valor.name}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-[#57534E]">
                              {valor.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-t border-[#E6E2E8] divide-y divide-[#E6E2E8]">
                        {activeNosotrasPillar.highlights.map((item, idx) => (
                          <div key={`${item}-${idx}`} className="py-4 flex items-start gap-3.5">
                            <span className="font-mono text-xs text-[#892B84] font-semibold mt-0.5 tabular-nums">
                              0{idx + 1}
                            </span>
                            <p className="text-sm leading-relaxed text-[#161513]">{item}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4-Pillar Quick Index */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {siteContent.nosotrasPillars.map((pillar) => {
                const isActive = activeNosotrasTab === pillar.id;
                return (
                  <button
                    key={pillar.id}
                    id={pillar.id}
                    type="button"
                    onClick={() => setActiveNosotrasTab(pillar.id)}
                    className={`text-left p-5 border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#892B84] text-white border-[#892B84]'
                        : 'bg-white text-[#161513] border-[#E6E2E8] hover:border-[#892B84]/50'
                    }`}
                  >
                    <p
                      className={`font-mono text-[11px] uppercase tracking-[0.16em] font-semibold ${
                        isActive ? 'text-white/85' : 'text-[#892B84]'
                      }`}
                    >
                      {pillar.label}
                    </p>
                    <p
                      className={`mt-2 text-xs leading-relaxed line-clamp-3 ${
                        isActive ? 'text-white/90' : 'text-[#57534E]'
                      }`}
                    >
                      {pillar.body}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: Servicios */}
        <section
          id="servicios"
          className="py-14 sm:py-20 lg:py-24 bg-white border-t border-[#E6E2E8]"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E6E2E8]">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.22em] text-[#892B84] font-semibold">
                  {siteContent.servicesKicker}
                </p>
                <h2 className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-[#161513] [text-wrap:balance]">
                  {siteContent.servicesHeading}
                </h2>
              </div>
              <p className="text-sm text-[#57534E] max-w-md">{siteContent.servicesSubheading}</p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              {siteContent.servicesList.map((service) => (
                <div
                  key={service.number}
                  className="bg-white border border-[#E6E2E8] p-6 sm:p-8 flex flex-col justify-between gap-6 hover:border-[#892B84]/45 transition-colors"
                >
                  <div>
                    <p className="font-mono text-xs text-[#892B84] font-semibold tabular-nums">
                      {service.number}
                    </p>
                    <h3 className="mt-2 text-2xl font-medium tracking-tight text-[#161513]">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#57534E]">
                      {service.summary}
                    </p>
                    <ul className="mt-5 pt-4 border-t border-[#E6E2E8] space-y-2">
                      {service.deliverables.map((del) => (
                        <li key={del} className="text-xs text-[#44403C] flex items-start gap-2">
                          <span className="text-[#892B84]" aria-hidden="true">
                            —
                          </span>
                          <span>{del}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleServiceSelect(service.contactIntent)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#892B84] hover:text-[#6E206A] hover:underline cursor-pointer"
                    >
                      <span>Solicitar este servicio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Inmuebles (Curated Property Portfolio) */}
        <section
          id="inmuebles"
          className="py-14 sm:py-20 lg:py-24 bg-[#F9F8FA] border-t border-[#E6E2E8]"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E6E2E8]">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#892B84] font-semibold">
                  Inmuebles · Portafolio Verificado
                </p>
                <h2 className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-[#161513]">
                  Propiedades seleccionadas
                </h2>
              </div>

              {/* Segmented Operation Tabs */}
              <div
                role="tablist"
                aria-label="Filtrar por tipo de operación"
                className="inline-flex flex-wrap items-center gap-1 p-1 bg-white border border-[#E6E2E8] self-start lg:self-auto max-w-full"
              >
                {(['Todas', 'Venta', 'Renta', 'Terreno'] as OperationFilter[]).map((op) => (
                  <button
                    key={op}
                    type="button"
                    role="tab"
                    aria-selected={operationFilter === op}
                    onClick={() => setOperationFilter(op)}
                    className={`px-3 sm:px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      operationFilter === op
                        ? 'bg-[#892B84] text-white'
                        : 'text-[#57534E] hover:text-[#892B84]'
                    }`}
                  >
                    {op === 'Terreno' ? 'Terrenos' : op}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Utility Bar */}
            <div className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6E2E8]">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
                  <Search className="w-4 h-4 text-[#57534E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por zona, nombre o folio..."
                    aria-label="Buscar propiedades"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                  />
                </div>

                <select
                  aria-label="Filtrar por estado"
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value as RegionFilter)}
                  className="flex-1 sm:flex-none px-3 py-2 text-xs bg-white border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                >
                  <option value="Todas">Todas las plazas</option>
                  <option value="Querétaro">Querétaro</option>
                  <option value="Yucatán">Yucatán</option>
                  <option value="Estado de México">Estado de México</option>
                </select>

                <button
                  type="button"
                  onClick={() => setOnlySaved((prev) => !prev)}
                  aria-pressed={onlySaved}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    onlySaved
                      ? 'bg-[#892B84] text-white border-[#892B84]'
                      : 'bg-white text-[#161513] border-[#E6E2E8] hover:border-[#892B84] hover:text-[#892B84]'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${onlySaved ? 'fill-current' : ''}`} />
                  <span className="tabular-nums">Guardadas ({savedIds.length})</span>
                </button>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4">
                <span className="text-xs text-[#57534E] font-mono tabular-nums">
                  {filteredProperties.length}{' '}
                  {filteredProperties.length === 1 ? 'propiedad' : 'propiedades'}
                </span>
                <select
                  aria-label="Ordenar propiedades"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 text-xs bg-white border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                >
                  <option value="featured">Orden editorial</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                  <option value="area-desc">Mayor terreno</option>
                </select>
              </div>
            </div>

            {/* Grid or Empty State */}
            {filteredProperties.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isSaved={savedIds.includes(property.id)}
                    onToggleSave={toggleSave}
                    onSelect={setSelectedProperty}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 bg-white border border-[#E6E2E8] p-12 text-center space-y-4">
                <p className="font-editorial text-2xl text-[#161513]">
                  No encontramos propiedades con esos criterios.
                </p>
                <p className="text-sm text-[#57534E] max-w-md mx-auto">
                  Ajusta los filtros de plaza u operación, o contáctanos para una búsqueda privada
                  fuera de catálogo.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Section 5: Contacto */}
        <section
          id="contacto"
          className="py-14 sm:py-20 lg:py-28 bg-[#161513] text-white border-t border-[#292524]"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              {/* Left: Headquarters & Direct Channels */}
              <div className="lg:col-span-5 space-y-8 min-w-0">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#D88FD4] font-semibold">
                    {siteContent.contactKicker}
                  </p>
                  <h2 className="mt-3 text-3xl lg:text-4xl font-medium tracking-tight text-white [text-wrap:balance]">
                    {siteContent.contactHeading}
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-[#D6D3D1]">
                    {siteContent.contactSubtitle}
                  </p>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/15 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#D88FD4] mt-1 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-white">{siteContent.officeTitle}</p>
                      <p className="text-[#A8A29E]">{siteContent.officeAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[#D88FD4] shrink-0" />
                    <a
                      href={`tel:${siteContent.officePhone.replace(/[^+\d]/g, '')}`}
                      className="font-mono text-white hover:text-[#D88FD4] transition-colors tabular-nums"
                    >
                      {siteContent.officePhone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#D88FD4] shrink-0" />
                    <a
                      href={`mailto:${siteContent.officeEmail}`}
                      className="text-white hover:text-[#D88FD4] transition-colors break-all"
                    >
                      {siteContent.officeEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Right: Validated Advisory Request Form */}
              <div className="lg:col-span-7 bg-[#1F1D1A] border border-white/15 p-5 sm:p-8 min-w-0">
                {contactSubmitted ? (
                  <div className="py-10 space-y-4">
                    <div className="w-10 h-10 bg-[#892B84] text-white inline-flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-medium text-white">
                      Solicitud recibida correctamente
                    </h3>
                    <p className="text-sm text-[#D6D3D1] leading-relaxed max-w-lg">
                      Gracias, <span className="text-white font-medium">{contactName}</span>. Una
                      socia especialista en{' '}
                      <span className="text-white font-medium">{contactIntent.toLowerCase()}</span>{' '}
                      te contactará en menos de 24 horas hábiles al teléfono{' '}
                      <span className="font-mono text-white">{contactPhone}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setContactSubmitted(false);
                        setContactName('');
                        setContactEmail('');
                        setContactPhone('');
                        setContactNotes('');
                      }}
                      className="px-4 py-2 border border-white/25 text-xs font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Enviar otra consulta
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="block text-xs text-[#D6D3D1] mb-1.5"
                        >
                          Nombre completo
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Tu nombre y apellido"
                          className="w-full px-3.5 py-2.5 text-sm bg-[#161513] border border-white/20 text-white placeholder:text-[#78716C] focus:outline-none focus:border-[#D88FD4]"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="contact-phone"
                          className="block text-xs text-[#D6D3D1] mb-1.5"
                        >
                          Teléfono / WhatsApp
                        </label>
                        <input
                          id="contact-phone"
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="+52 442 000 0000"
                          className="w-full px-3.5 py-2.5 text-sm bg-[#161513] border border-white/20 text-white placeholder:text-[#78716C] focus:outline-none focus:border-[#D88FD4]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-xs text-[#D6D3D1] mb-1.5"
                        >
                          Correo electrónico
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="nombre@correo.com"
                          className="w-full px-3.5 py-2.5 text-sm bg-[#161513] border border-white/20 text-white placeholder:text-[#78716C] focus:outline-none focus:border-[#D88FD4]"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="contact-intent"
                          className="block text-xs text-[#D6D3D1] mb-1.5"
                        >
                          Objetivo de asesoría
                        </label>
                        <select
                          id="contact-intent"
                          value={contactIntent}
                          onChange={(e) => setContactIntent(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-[#161513] border border-white/20 text-white focus:outline-none focus:border-[#D88FD4]"
                        >
                          <option value="Comprar propiedad">Comprar propiedad</option>
                          <option value="Vender mi inmueble">Vender mi inmueble</option>
                          <option value="Rentar residencia o espacio">
                            Rentar residencia o espacio
                          </option>
                          <option value="Inversión en terrenos y desarrollos">
                            Inversión en terrenos y desarrollos
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="contact-notes"
                        className="block text-xs text-[#D6D3D1] mb-1.5"
                      >
                        Plaza de interés o detalles del inmueble
                      </label>
                      <textarea
                        id="contact-notes"
                        rows={3}
                        value={contactNotes}
                        onChange={(e) => setContactNotes(e.target.value)}
                        placeholder="Cuéntanos la zona, presupuesto aproximado o características de la propiedad..."
                        className="w-full px-3.5 py-2.5 text-sm bg-[#161513] border border-white/20 text-white placeholder:text-[#78716C] focus:outline-none focus:border-[#D88FD4]"
                      />
                    </div>

                    {contactError && <p className="text-xs text-[#FCA5A5]">{contactError}</p>}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                      <span className="text-[11px] text-[#A8A29E]">
                        Asesoría confidencial · Sin compromiso de exclusividad previa.
                      </span>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#9E3599] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Solicitar asesoría gratuita
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-white border-t border-[#E6E2E8] py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <BrandLogo className="h-11 w-auto" />
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#57534E]">
            <a href="#inicio" className="hover:text-[#892B84] transition-colors">
              Inicio
            </a>
            <a href="#nosotras" className="hover:text-[#892B84] transition-colors">
              Nosotras
            </a>
            <a href="#servicios" className="hover:text-[#892B84] transition-colors">
              Servicios
            </a>
            <a href="#inmuebles" className="hover:text-[#892B84] transition-colors">
              Inmuebles
            </a>
            <a href="#contacto" className="hover:text-[#892B84] transition-colors">
              Contacto
            </a>
            <button
              type="button"
              onClick={openAdmin}
              className="inline-flex items-center gap-1.5 text-[#57534E] hover:text-[#892B84] transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Acceso Administración</span>
            </button>
          </div>

          <p className="text-xs text-[#57534E]">
            © 2026 Mujer Inmobiliaria &amp; Asociadas. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Property Technical Dossier Modal */}
      <PropertyModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        onCreateLead={handleCreateLead}
      />
    </div>
  );
}
