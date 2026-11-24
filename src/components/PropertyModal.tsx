import React, { useEffect, useState } from 'react';
import { X, Check, Building2 } from 'lucide-react';
import { ClientSession, LeadRecord, PropertyListing } from '../types/portal';
import { formatMxn } from '../data/properties';

interface PropertyModalProps {
  property: PropertyListing | null;
  clientSession?: ClientSession | null;
  onClose: () => void;
  onCreateLead: (
    lead: Omit<LeadRecord, 'id' | 'createdAt' | 'status' | 'internalNotes'>
  ) => Promise<void>;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  property,
  clientSession,
  onClose,
  onCreateLead,
}) => {
  const [imgError, setImgError] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setImgError(false);
    setActivePhotoIndex(0);
    setSubmitted(false);
    setFormError('');
    setVisitorName(clientSession?.fullName ?? '');
    setVisitorEmail(clientSession?.email ?? '');
    setVisitorPhone(clientSession?.whatsapp ?? '');
    setPreferredDate('');
  }, [property?.id, clientSession]);

  useEffect(() => {
    if (!property) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [property, onClose]);

  if (!property) return null;

  const photos =
    property.gallery && property.gallery.length > 0 ? property.gallery : [property.image];
  const currentPhoto = photos[activePhotoIndex] ?? property.image;

  const handleTourRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorEmail.includes('@') || visitorPhone.trim().length < 8) {
      setFormError('Por favor ingresa tu nombre, correo válido y teléfono a 8+ dígitos.');
      return;
    }
    setFormError('');
    await onCreateLead({
      name: visitorName.trim(),
      email: visitorEmail.trim(),
      phone: visitorPhone.trim(),
      intent: 'Recorrido privado',
      source: 'Ficha de propiedad',
      propertyId: property.id,
      propertyTitle: property.title,
      propertyFolio: property.folio,
      preferredDate: preferredDate || undefined,
      notes: `Solicitud de visita para ${property.title} (${property.folio}).`,
      assignedAdvisor: property.advisor.name,
    });
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#161513]/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-property-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white border border-[#E6E2E8] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 bg-white/95 border-b border-[#E6E2E8]">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-[#57534E] font-mono tabular-nums min-w-0">
            <span className="text-[#892B84] font-semibold">{property.folio}</span>
            <span aria-hidden="true">·</span>
            <span>{property.operation}</span>
            <span aria-hidden="true">·</span>
            <span>{property.state}</span>
            {property.status !== 'Disponible' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#D97706] font-sans font-semibold">{property.status}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha técnica"
            className="w-9 h-9 shrink-0 inline-flex items-center justify-center border border-[#E6E2E8] bg-white text-[#161513] hover:border-[#892B84] hover:text-[#892B84] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media header */}
        <div className="bg-[#F9F8FA] border-b border-[#E6E2E8]">
          <div className="aspect-[16/9] w-full overflow-hidden">
            {!imgError && currentPhoto ? (
              <img
                src={currentPhoto}
                alt={`${property.title} en ${property.zone}`}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#57534E] bg-gradient-to-br from-[#F9F8FA] to-[#E6E2E8]">
                <Building2 className="w-8 h-8" />
                <span className="text-sm font-medium">{property.title}</span>
              </div>
            )}
          </div>

          {photos.length > 1 && (
            <div className="px-4 sm:px-6 py-3 flex items-center gap-2.5 overflow-x-auto border-t border-[#E6E2E8] bg-white">
              {photos.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => {
                    setActivePhotoIndex(index);
                    setImgError(false);
                  }}
                  aria-label={`Ver fotografía ${index + 1}`}
                  className={`w-16 h-12 shrink-0 overflow-hidden border transition-colors cursor-pointer ${
                    index === activePhotoIndex
                      ? 'border-[#892B84] ring-1 ring-[#892B84]'
                      : 'border-[#E6E2E8] opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt={`${property.title} vista ${index + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#57534E]">
                {property.zone}
              </p>
              <h2
                id="modal-property-title"
                className="mt-2 text-3xl font-medium tracking-tight text-[#161513]"
              >
                {property.title}
              </h2>
              <p className="mt-2 font-mono text-2xl font-medium text-[#892B84] tabular-nums">
                {formatMxn(property.priceMxn)}
                {property.priceSuffix ? (
                  <span className="text-sm font-sans text-[#57534E] ml-1">
                    {property.priceSuffix}
                  </span>
                ) : null}
              </p>
            </div>

            <p className="text-[15px] leading-relaxed text-[#44403C]">{property.description}</p>

            {/* Technical specs table */}
            <div className="border-t border-b border-[#E6E2E8] py-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#57534E]">Terreno</p>
                <p className="mt-1 font-mono text-sm font-medium text-[#161513] tabular-nums">
                  {property.areaLandM2} m²
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#57534E]">
                  Construcción
                </p>
                <p className="mt-1 font-mono text-sm font-medium text-[#161513] tabular-nums">
                  {property.areaConstM2 > 0 ? `${property.areaConstM2} m²` : 'Lote urbano'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#57534E]">
                  Recámaras / Baños
                </p>
                <p className="mt-1 font-mono text-sm font-medium text-[#161513] tabular-nums">
                  {property.bedrooms > 0
                    ? `${property.bedrooms} Rec · ${property.bathrooms} Baños`
                    : 'Uso habitacional'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#57534E]">
                  Estacionamiento
                </p>
                <p className="mt-1 font-mono text-sm font-medium text-[#161513] tabular-nums">
                  {property.parking > 0 ? `${property.parking} autos` : 'Por proyecto'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#57534E]">
                  Situación Jurídica
                </p>
                <p className="mt-1 text-sm font-medium text-[#161513]">{property.legalStatus}</p>
              </div>
            </div>

            {/* Highlights */}
            <div>
              <h3 className="font-sans text-xs uppercase tracking-[0.18em] text-[#57534E] font-semibold">
                Atributos destacados
              </h3>
              <ul className="mt-3 space-y-2">
                {property.highlights.map((item) => (
                  <li key={item} className="text-sm text-[#44403C] flex items-start gap-2.5">
                    <span className="text-[#892B84] mt-0.5" aria-hidden="true">
                      —
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Advisor & Private Tour Booking */}
          <div className="lg:col-span-5 bg-[#F9F8FA] border border-[#E6E2E8] p-6 self-start space-y-5">
            <div className="pb-4 border-b border-[#E6E2E8]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#57534E]">
                Asesora asignada
              </p>
              <p className="mt-1 text-base font-semibold text-[#161513]">
                {property.advisor.name}
              </p>
              <p className="text-xs text-[#57534E]">
                {property.advisor.role} · {property.advisor.license}
              </p>
            </div>

            {submitted ? (
              <div className="py-6 space-y-3">
                <div className="w-9 h-9 bg-[#892B84] text-white inline-flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <h3 className="font-sans text-base font-semibold text-[#161513]">
                  Recorrido solicitado con éxito
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  {property.advisor.name} se pondrá en contacto contigo al correo{' '}
                  <span className="font-medium text-[#161513]">{visitorEmail}</span> para
                  confirmar horario y enviarte el expediente técnico de{' '}
                  <span className="font-mono text-xs">{property.folio}</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleTourRequest} className="space-y-3.5">
                <h3 className="font-sans text-sm font-semibold text-[#161513]">
                  Agendar recorrido privado
                </h3>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Nombre completo</label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Ej. Mariana Ortega"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="nombre@correo.com"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#57534E] mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      placeholder="442 000 0000"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#57534E] mb-1">Fecha sugerida</label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                    />
                  </div>
                </div>
                {formError && <p className="text-xs text-[#9A3412]">{formError}</p>}
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors cursor-pointer"
                >
                  Solicitar visita y dossier
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
