import React, { useEffect, useState } from 'react';
import { X, Check, Building2 } from 'lucide-react';
import { PropertyListing, formatMxn } from '../data/properties';

interface PropertyModalProps {
  property: PropertyListing | null;
  onClose: () => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  property,
  onClose,
}) => {
  const [imgError, setImgError] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setImgError(false);
    setSubmitted(false);
    setFormError('');
    setVisitorName('');
    setVisitorEmail('');
    setVisitorPhone('');
    setPreferredDate('');
  }, [property?.id]);

  useEffect(() => {
    if (!property) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [property, onClose]);

  if (!property) return null;

  const handleTourRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorEmail.includes('@') || visitorPhone.trim().length < 8) {
      setFormError('Por favor ingresa tu nombre, correo válido y teléfono a 8+ dígitos.');
      return;
    }
    setFormError('');
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
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#F9F8F6] border border-[#E2DFD9] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 bg-[#F9F8F6]/95 border-b border-[#E2DFD9]">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-[#57534E] font-mono tabular-nums min-w-0">
            <span>{property.folio}</span>
            <span aria-hidden="true">·</span>
            <span>{property.operation}</span>
            <span aria-hidden="true">·</span>
            <span>{property.state}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha técnica"
            className="w-9 h-9 shrink-0 inline-flex items-center justify-center border border-[#E2DFD9] bg-white text-[#161513] hover:bg-[#EFECE7] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media header */}
        <div className="aspect-[16/9] w-full bg-[#EFECE7] overflow-hidden border-b border-[#E2DFD9]">
          {!imgError ? (
            <img
              src={property.image}
              alt={`${property.title} en ${property.zone}`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#57534E] bg-gradient-to-br from-[#EFECE7] to-[#E2DFD9]">
              <Building2 className="w-8 h-8" />
              <span className="text-sm font-medium">{property.title}</span>
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
              <p className="mt-2 font-mono text-2xl font-medium text-[#1B4332] tabular-nums">
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
            <div className="border-t border-b border-[#E2DFD9] py-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                    <span className="text-[#9A7B3E] mt-0.5" aria-hidden="true">
                      —
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Advisor & Private Tour Booking */}
          <div className="lg:col-span-5 bg-white border border-[#E2DFD9] p-6 self-start space-y-5">
            <div className="pb-4 border-b border-[#E2DFD9]">
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
                <div className="w-9 h-9 bg-[#1B4332] text-white inline-flex items-center justify-center">
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
                    className="w-full px-3 py-2 text-sm bg-[#F9F8F6] border border-[#E2DFD9] text-[#161513] focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="nombre@correo.com"
                    className="w-full px-3 py-2 text-sm bg-[#F9F8F6] border border-[#E2DFD9] text-[#161513] focus:outline-none focus:border-[#1B4332]"
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
                      className="w-full px-3 py-2 text-sm bg-[#F9F8F6] border border-[#E2DFD9] text-[#161513] focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#57534E] mb-1">Fecha sugerida</label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#F9F8F6] border border-[#E2DFD9] text-[#161513] focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>
                {formError && <p className="text-xs text-[#9A3412]">{formError}</p>}
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#1B4332] text-white text-xs font-semibold hover:bg-[#143326] transition-colors cursor-pointer"
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
