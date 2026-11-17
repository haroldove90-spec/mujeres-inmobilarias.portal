export type OperationType = 'Venta' | 'Renta' | 'Terreno';
export type RegionState = 'Querétaro' | 'Yucatán' | 'Estado de México';

export interface PropertyListing {
  id: string;
  folio: string;
  title: string;
  operation: OperationType;
  category: 'Residencial' | 'Villa' | 'Terreno' | 'Corporativo';
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
  legalStatus: string;
  advisor: {
    name: string;
    role: string;
    license: string;
  };
  highlights: string[];
  description: string;
}

export const HERO_IMAGE = '/src/assets/images/hero_modern_residence_1794951601307.jpg';

export const PROPERTIES: PropertyListing[] = [
  {
    id: 'qro-campanario-01',
    folio: 'MIA-QRO-104',
    title: 'Residencia Patio de Olivos',
    operation: 'Venta',
    category: 'Residencial',
    state: 'Querétaro',
    zone: 'El Campanario, Santiago de Querétaro',
    priceMxn: 18900000,
    areaLandM2: 680,
    areaConstM2: 520,
    bedrooms: 4,
    bathrooms: 4.5,
    parking: 4,
    image: '/src/assets/images/prop_queretaro_campanario_1794951601828.jpg',
    legalStatus: 'Escritura pública · Libre de gravamen',
    advisor: {
      name: 'Sofía Mendoza Villalobos',
      role: 'Directora de Portafolio Residencial',
      license: 'Lic. Inmobiliaria Qro. 0418',
    },
    highlights: [
      'Doble altura en estancia principal con vigas de roble europeo',
      'Terraza perimetral en piedra caliza apomazada',
      'Cocina de autor equipada con cubierta de cuarcita natural',
      'Seguridad perimetral 24/7 y acceso a casa club',
    ],
    description:
      'Residencia contemporánea concebida alrededor de un patio central con olivos maduros y ventanales de piso a techo. Su orientación sur-oriente privilegia la iluminación natural sin ganancia térmica excesiva, integrando áreas sociales con jardín privado.',
  },
  {
    id: 'yuc-merida-02',
    folio: 'MIA-YUC-208',
    title: 'Villa Chukum & Espejo Esmeralda',
    operation: 'Venta',
    category: 'Villa',
    state: 'Yucatán',
    zone: 'Temozón Norte, Mérida',
    priceMxn: 11450000,
    areaLandM2: 540,
    areaConstM2: 390,
    bedrooms: 3,
    bathrooms: 3.5,
    parking: 3,
    image: '/src/assets/images/prop_merida_yucatan_1794951602848.jpg',
    legalStatus: 'Escritura definitiva · Dictamen predial al día',
    advisor: {
      name: 'Valentina Peón Escalante',
      role: 'Socia Regional Península',
      license: 'Registro Estatal Yuc. 1192',
    },
    highlights: [
      'Acabados artesanales en pasta de chukum y piedra macedonia',
      'Canal de nado de 14 metros con filtración salina',
      'Ventilación cruzada y celosías térmicas de madera tzalam',
      'Suite independiente en planta baja para visitas o estudio',
    ],
    description:
      'Arquitectura yucateca contemporánea ubicada en una privada arbolada de Temozón Norte, a doce minutos de la costa y cercana a centros hospitalarios y universidades de primer nivel.',
  },
  {
    id: 'mex-esmeralda-03',
    folio: 'MIA-MEX-312',
    title: 'Casa Mirador del Bosque',
    operation: 'Venta',
    category: 'Residencial',
    state: 'Estado de México',
    zone: 'Zona Esmeralda, Atizapán',
    priceMxn: 22600000,
    areaLandM2: 750,
    areaConstM2: 590,
    bedrooms: 4,
    bathrooms: 5,
    parking: 5,
    image: '/src/assets/images/prop_edomex_esmeralda_1794951603158.jpg',
    legalStatus: 'Escritura pública · Régimen en condominio',
    advisor: {
      name: 'Camila Aguirre Lozano',
      role: 'Socia Senior Valle de México',
      license: 'Certificación AMPI 2026',
    },
    highlights: [
      'Estructura híbrida de acero negro y piedra laja volcánica',
      'Terraza panorámica con chimenea exterior y vista a reserva',
      'Calefacción hidrónica y ventanería acústica doble vidrio',
      'Bodega de vinos climatizada y estudio privado con acceso propio',
    ],
    description:
      'Emplazada sobre una ladera rodeada de pinos en Zona Esmeralda, esta propiedad combina vistas limpias hacia la cañada con una distribución funcional de tres niveles y máxima privacidad.',
  },
  {
    id: 'qro-juriquilla-04',
    folio: 'MIA-QRO-119',
    title: 'Residencia Cantilever & Alberca Negra',
    operation: 'Renta',
    category: 'Residencial',
    state: 'Querétaro',
    zone: 'Cumbres del Lago, Juriquilla',
    priceMxn: 68000,
    priceSuffix: '/ mes',
    areaLandM2: 610,
    areaConstM2: 445,
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    image: '/src/assets/images/hero_modern_residence_1794951601307.jpg',
    legalStatus: 'Contrato con póliza jurídica incluida',
    advisor: {
      name: 'Sofía Mendoza Villalobos',
      role: 'Directora de Portafolio Residencial',
      license: 'Lic. Inmobiliaria Qro. 0418',
    },
    highlights: [
      'Voladizo arquitectónico en concreto aparente y piedra caliza',
      'Espejo de agua climatizado con sistema solar',
      'Ideal para directivos y familias en reubicación corporativa',
      'Mantenimiento de áreas comunes incluido en la renta mensual',
    ],
    description:
      'Disponible para arrendamiento habitacional de mediano o largo plazo. Ofrece recámara principal en planta baja, jardín xerófilo de bajo mantenimiento y conectividad inmediata hacia parques industriales y colegios internacionales.',
  },
  {
    id: 'qro-zibata-05',
    folio: 'MIA-QRO-131',
    title: 'Macrolote Parque Central · Reserva Sur',
    operation: 'Terreno',
    category: 'Terreno',
    state: 'Querétaro',
    zone: 'Valle de Zibatá, El Marqués',
    priceMxn: 4950000,
    areaLandM2: 920,
    areaConstM2: 0,
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    image: '/src/assets/images/prop_terreno_desarrollo_1794951602871.jpg',
    legalStatus: 'Título de propiedad · Uso de suelo H2 habitacional',
    advisor: {
      name: 'Renata Ibarra Domínguez',
      role: 'Especialista en Tierra & Desarrollos',
      license: 'Valuación & Factibilidad',
    },
    highlights: [
      'Frente de 23 metros hacia parque lineal y lago artificial',
      'Topografía plana lista para proyecto arquitectónico a medida',
      'Servicios subterráneos de media tensión, fibra óptica y agua tratada',
      'Plusvalía histórica sostenida superior al 11% anual en la zona',
    ],
    description:
      'Lote unifamiliar de gran formato frente a área verde consolidada. Nuestro equipo acompaña tanto la adquisición jurídica como la vinculación con despachos arquitectónicos y estudios de mecánica de suelos.',
  },
  {
    id: 'yuc-altabrisa-06',
    folio: 'MIA-YUC-224',
    title: 'Suite Corporativa & Piso Ejecutivo',
    operation: 'Renta',
    category: 'Corporativo',
    state: 'Yucatán',
    zone: 'Corredor Norte, Mérida',
    priceMxn: 44500,
    priceSuffix: '/ mes',
    areaLandM2: 240,
    areaConstM2: 240,
    bedrooms: 2,
    bathrooms: 2.5,
    parking: 2,
    image: '/src/assets/images/prop_queretaro_campanario_1794951601828.jpg',
    legalStatus: 'Facturación fiscal disponible · Contrato flexible',
    advisor: {
      name: 'Valentina Peón Escalante',
      role: 'Socia Regional Península',
      license: 'Registro Estatal Yuc. 1192',
    },
    highlights: [
      'Espacio adaptable para despacho boutique o residencia ejecutiva',
      'Terraza privada con iluminación natural filtrada',
      'Seguridad biométrica y recepción ejecutiva 24 horas',
      'A cinco minutos de Prolongación Montejo',
    ],
    description:
      'Propiedad versátil diseñada para firmas de consultoría, notarías o residencia temporal de alta gama en el corredor financiero de mayor dinamismo del sureste.',
  },
];

export type NosotrasTabId = 'mision' | 'vision' | 'valores' | 'alianzas';

export interface NosotrasPillar {
  id: NosotrasTabId;
  label: string;
  kicker: string;
  title: string;
  body: string;
  highlights: string[];
}

export const NOSOTRAS_PILLARS: NosotrasPillar[] = [
  {
    id: 'mision',
    label: 'Misión',
    kicker: '01 · Propósito Institucional',
    title: 'Impulsar el patrimonio de nuestros clientes y el liderazgo profesional en bienes raíces.',
    body: 'Construimos una organización centrada en inspirar y respaldar a nuestras asociadas y clientes, promoviendo buenas prácticas inmobiliarias, acompañamiento cercano y decisiones patrimoniales seguras.',
    highlights: [
      'Acompañamiento colaborativo en cada etapa de compra, venta o renta',
      'Prácticas profesionales enfocadas en la confianza y el trato humano',
      'Impulso continuo al desarrollo ético de mujeres especialistas del sector',
    ],
  },
  {
    id: 'vision',
    label: 'Visión',
    kicker: '02 · Proyección de Firma',
    title: 'Representar cada operación con transparencia, eficiencia y soluciones duraderas.',
    body: 'Nuestra meta es consolidar un estándar de servicio inmobiliario que responda con rigor a las exigencias del mercado actual, generando valor sostenible para familias, inversionistas y desarrolladores.',
    highlights: [
      'Representación honesta y clara ante compradores, propietarios y notarías',
      'Procesos ágiles respaldados por análisis de mercado y dictamen previo',
      'Crecimiento responsable con impacto positivo en Querétaro y la República Mexicana',
    ],
  },
  {
    id: 'valores',
    label: 'Valores',
    kicker: '03 · Principios Rectores',
    title: 'Seis compromisos no negociables en cada operación inmobiliaria.',
    body: 'Cada expediente, avalúo y negociación se rige por criterios verificables de integridad profesional y responsabilidad social.',
    highlights: [
      'Transparencia y Honestidad en condiciones, comisiones y documentación',
      'Ética y Profesionalismo acreditados durante toda la intermediación',
      'Eficiencia operativa y Responsabilidad social en cada comunidad donde operamos',
    ],
  },
  {
    id: 'alianzas',
    label: 'Alianzas',
    kicker: '04 · Red Estratégica',
    title: 'Alianzas sólidas con desarrolladores, notarías y firmas líderes del sector.',
    body: 'Colaboramos estrechamente con desarrolladores certificados, especialistas financieros, despachos jurídicos y redes inmobiliarias para garantizar operaciones excepcionales.',
    highlights: [
      'Acceso directo a desarrollos residenciales y tierra de inversión verificada',
      'Coordinación ágil con notarías públicas y peritos valuadores certificados',
      'Red de colaboración interestatal entre Querétaro, Yucatán y Estado de México',
    ],
  },
];

export const VALORES_LIST = [
  { number: '01', name: 'Transparencia', detail: 'Información clara en precios, gravámenes y costos notariales.' },
  { number: '02', name: 'Ética', detail: 'Actuación íntegra cuidando el patrimonio de todas las partes.' },
  { number: '03', name: 'Honestidad', detail: 'Valuaciones realistas sin falsas expectativas comerciales.' },
  { number: '04', name: 'Profesionalismo', detail: 'Asesoras capacitadas en normativa comercial, fiscal y registral.' },
  { number: '05', name: 'Eficiencia', detail: 'Procesos ordenados desde la prospección hasta la escrituración.' },
  { number: '06', name: 'Responsabilidad', detail: 'Empresa socialmente responsable enfocada en relaciones duraderas.' },
];

export interface ServiceItem {
  number: string;
  title: string;
  summary: string;
  deliverables: string[];
  contactIntent: string;
}

export const SERVICES_LIST: ServiceItem[] = [
  {
    number: '01.',
    title: 'Asesoría Gratuita y Personalizada',
    summary:
      'Diagnóstico inicial sin costo para compra, venta o renta. Filtramos opciones reales conforme a tu presupuesto, zona y horizonte patrimonial.',
    deliverables: [
      'Perfilamiento patrimonial y selección curada de inmuebles',
      'Acompañamiento presencial y coordinación de recorridos privados',
    ],
    contactIntent: 'Comprar propiedad',
  },
  {
    number: '02.',
    title: 'Gestión de Inmuebles, Terrenos y Desarrollos',
    summary:
      'Comercialización estratégica para propiedades residenciales, espacios corporativos, lotes habitacionales y tierra para desarrollo.',
    deliverables: [
      'Difusión calificada en portales y red de inversionistas',
      'Filtrado de prospectos y negociación directa de ofertas',
    ],
    contactIntent: 'Vender mi inmueble',
  },
  {
    number: '03.',
    title: 'Intermediación y Asesoría Legal',
    summary:
      'Blindaje jurídico en operaciones residenciales y comerciales para que compres, vendas o rentes con tranquilidad documental.',
    deliverables: [
      'Revisión de escrituras, libertad de gravamen y uso de suelo',
      'Contratos de compraventa, pólizas jurídicas y seguimiento notarial',
    ],
    contactIntent: 'Rentar residencia o espacio',
  },
  {
    number: '04.',
    title: 'Valuación Comercial y Estrategia de Salida',
    summary:
      'Análisis comparativo de mercado por colonia y metro cuadrado para definir precios competitivos y proteger tu plusvalía.',
    deliverables: [
      'Opinión de valor con comparables cerrados en escritura',
      'Orientación fiscal preliminar e integración de expediente completo',
    ],
    contactIntent: 'Inversión en terrenos y desarrollos',
  },
];

export function formatMxn(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount);
}

