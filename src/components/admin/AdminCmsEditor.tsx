import React, { useEffect, useState } from 'react';
import { Check, MessageCircle, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import { SiteContent } from '../../types/portal';
import { buildWhatsAppHref } from '../WhatsAppButton';

interface AdminCmsEditorProps {
  content: SiteContent;
  onSave: (updated: SiteContent) => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

type CmsTab = 'secciones' | 'portada' | 'nosotras' | 'servicios' | 'contacto' | 'whatsapp';

export const AdminCmsEditor: React.FC<AdminCmsEditorProps> = ({
  content,
  onSave,
  onResetDefaults,
}) => {
  const [draft, setDraft] = useState<SiteContent>(content);
  const [activeTab, setActiveTab] = useState<CmsTab>('portada');
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setDraft(content);
  }, [content]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(draft);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleHeroImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft((prev) => ({ ...prev, heroImage: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleSection = (key: keyof SiteContent['sectionsEnabled']) => {
    setDraft((prev) => ({
      ...prev,
      sectionsEnabled: {
        ...prev.sectionsEnabled,
        [key]: !prev.sectionsEnabled[key],
      },
    }));
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Sub-tabs & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E6E2E8]">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F9F8FA] border border-[#E6E2E8]">
          {(
            [
              { id: 'portada', label: 'Portada e Imagen' },
              { id: 'secciones', label: 'Secciones y Botones' },
              { id: 'nosotras', label: 'Nosotras y Viñetas' },
              { id: 'servicios', label: 'Servicios e Inmuebles' },
              { id: 'contacto', label: 'Contacto y Datos' },
              { id: 'whatsapp', label: 'Botón WhatsApp' },
            ] as { id: CmsTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#892B84] text-white'
                  : 'text-[#57534E] hover:text-[#161513]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#57534E]">¿Restaurar textos iniciales?</span>
              <button
                type="button"
                onClick={async () => {
                  await onResetDefaults();
                  setConfirmReset(false);
                }}
                className="px-2.5 py-1.5 bg-[#DC2626] text-white text-xs font-semibold cursor-pointer"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2.5 py-1.5 border border-[#E6E2E8] text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E6E2E8] text-xs font-medium text-[#57534E] hover:text-[#161513] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar base</span>
            </button>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors cursor-pointer"
          >
            {savedNotice ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{savedNotice ? 'Cambios publicados' : 'Guardar y publicar'}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Portada */}
      {activeTab === 'portada' && (
        <div className="space-y-6 bg-white border border-[#E6E2E8] p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#57534E] mb-1">
                  Cintillo superior de plazas
                </label>
                <input
                  type="text"
                  value={draft.heroEyebrow}
                  onChange={(e) => setDraft({ ...draft, heroEyebrow: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#57534E] mb-1">
                  Mensaje de bienvenida (opcional, déjalo vacío para ocultarlo)
                </label>
                <input
                  type="text"
                  value={draft.heroWelcomeMessage}
                  onChange={(e) => setDraft({ ...draft, heroWelcomeMessage: e.target.value })}
                  placeholder="Ej. Bienvenida a Mujer Inmobiliaria & Asociadas"
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#57534E] mb-1">Titular principal</label>
                <textarea
                  rows={2}
                  value={draft.heroTitle}
                  onChange={(e) => setDraft({ ...draft, heroTitle: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#57534E] mb-1">
                  Subtítulo / Descripción de firma
                </label>
                <textarea
                  rows={3}
                  value={draft.heroSubtitle}
                  onChange={(e) => setDraft({ ...draft, heroSubtitle: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[#57534E]">Imagen principal de portada</label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#892B84] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir nueva imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageFile}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={draft.heroImage}
                  onChange={(e) => setDraft({ ...draft, heroImage: e.target.value })}
                  placeholder="URL o archivo cargado..."
                  className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>

              {draft.heroImage && (
                <div className="border border-[#E6E2E8] bg-[#F9F8FA] overflow-hidden h-44">
                  <img
                    src={draft.heroImage}
                    alt="Vista previa de portada"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Pie de foto · Zona</label>
                  <input
                    type="text"
                    value={draft.heroImageCaptionZone}
                    onChange={(e) => setDraft({ ...draft, heroImageCaptionZone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">Pie de foto · Título</label>
                  <input
                    type="text"
                    value={draft.heroImageCaptionTitle}
                    onChange={(e) =>
                      setDraft({ ...draft, heroImageCaptionTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6E2E8] space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-sans text-sm font-semibold text-[#161513]">
                Franja de pilares bajo portada
              </h3>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    capabilities: [
                      ...draft.capabilities,
                      {
                        number: String(draft.capabilities.length + 1).padStart(2, '0'),
                        title: 'Nuevo pilar de servicio',
                        description: 'Descripción breve del beneficio para tus clientes.',
                      },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#892B84] text-[#892B84] text-xs font-semibold hover:bg-[#892B84] hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar pilar</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {draft.capabilities.map((cap, idx) => (
                <div
                  key={`${cap.number}-${idx}`}
                  className="p-4 bg-[#F9F8FA] border border-[#E6E2E8] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={cap.number}
                      onChange={(e) => {
                        const next = [...draft.capabilities];
                        next[idx] = { ...cap, number: e.target.value };
                        setDraft({ ...draft, capabilities: next });
                      }}
                      className="w-16 px-2 py-1 font-mono text-xs text-[#892B84] font-semibold bg-white border border-[#E6E2E8]"
                    />
                    {draft.capabilities.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            capabilities: draft.capabilities.filter((_, i) => i !== idx),
                          })
                        }
                        aria-label="Eliminar pilar"
                        className="p-1 text-[#57534E] hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={cap.title}
                    onChange={(e) => {
                      const next = [...draft.capabilities];
                      next[idx] = { ...cap, title: e.target.value };
                      setDraft({ ...draft, capabilities: next });
                    }}
                    className="w-full px-2.5 py-1.5 text-sm font-medium bg-white border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                  <textarea
                    rows={2}
                    value={cap.description}
                    onChange={(e) => {
                      const next = [...draft.capabilities];
                      next[idx] = { ...cap, description: e.target.value };
                      setDraft({ ...draft, capabilities: next });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Secciones activas y Textos de Botones */}
      {activeTab === 'secciones' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E6E2E8] p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="font-sans text-sm font-semibold text-[#161513]">
                Activar o desactivar secciones del portal
              </h3>
              <p className="mt-1 text-xs text-[#57534E]">
                Oculta temporalmente cualquier bloque sin perder sus textos ni propiedades.
              </p>
            </div>
            <div className="divide-y divide-[#E6E2E8] border-t border-[#E6E2E8]">
              {(
                [
                  {
                    key: 'capabilities',
                    label: 'Franja de pilares bajo la portada',
                    desc: 'Bloques numerados 01–04 debajo de la portada.',
                  },
                  {
                    key: 'nosotras',
                    label: 'Sección Nosotras',
                    desc: 'Misión, Visión, Valores y Alianzas institucionales.',
                  },
                  {
                    key: 'servicios',
                    label: 'Sección Servicios',
                    desc: 'Tarjetas de servicios especializados y entregables.',
                  },
                  {
                    key: 'inmuebles',
                    label: 'Sección Inmuebles',
                    desc: 'Catálogo público de propiedades con filtros.',
                  },
                  {
                    key: 'contacto',
                    label: 'Sección Contacto',
                    desc: 'Datos de oficina y formulario de solicitud de asesoría.',
                  },
                ] as { key: keyof SiteContent['sectionsEnabled']; label: string; desc: string }[]
              ).map((sec) => {
                const active = draft.sectionsEnabled[sec.key];
                return (
                  <div key={sec.key} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#161513]">{sec.label}</p>
                      <p className="text-xs text-[#57534E]">{sec.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSection(sec.key)}
                      aria-pressed={active}
                      className={`px-3 py-1.5 text-xs font-semibold border transition-colors shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#892B84] text-white border-[#892B84]'
                          : 'bg-[#F9F8FA] text-[#57534E] border-[#E6E2E8]'
                      }`}
                    >
                      {active ? 'Activa' : 'Oculta'}
                    </button>
                  </div>
                );
              })}

              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#161513]">Botón flotante de WhatsApp</p>
                  <p className="text-xs text-[#57534E]">
                    Acceso directo para que los clientes escriban por WhatsApp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({ ...draft, whatsappEnabled: !draft.whatsappEnabled })
                  }
                  aria-pressed={draft.whatsappEnabled}
                  className={`px-3 py-1.5 text-xs font-semibold border transition-colors shrink-0 cursor-pointer ${
                    draft.whatsappEnabled
                      ? 'bg-[#16A34A] text-white border-[#16A34A]'
                      : 'bg-[#F9F8FA] text-[#57534E] border-[#E6E2E8]'
                  }`}
                >
                  {draft.whatsappEnabled ? 'Activo' : 'Oculto'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E6E2E8] p-5 sm:p-6 space-y-4">
            <h3 className="font-sans text-sm font-semibold text-[#161513]">
              Textos de botones y pie de página
            </h3>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">
                Botón principal en barra superior
              </label>
              <input
                type="text"
                value={draft.headerCtaLabel}
                onChange={(e) => setDraft({ ...draft, headerCtaLabel: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#57534E] mb-1">
                  Botón primario de portada
                </label>
                <input
                  type="text"
                  value={draft.heroPrimaryCtaLabel}
                  onChange={(e) => setDraft({ ...draft, heroPrimaryCtaLabel: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#57534E] mb-1">
                  Botón secundario de portada
                </label>
                <input
                  type="text"
                  value={draft.heroSecondaryCtaLabel}
                  onChange={(e) => setDraft({ ...draft, heroSecondaryCtaLabel: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#57534E] mb-1">
                  Botón en tarjetas de servicio
                </label>
                <input
                  type="text"
                  value={draft.serviceCtaLabel}
                  onChange={(e) => setDraft({ ...draft, serviceCtaLabel: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#57534E] mb-1">
                  Botón de envío en Contacto
                </label>
                <input
                  type="text"
                  value={draft.contactSubmitLabel}
                  onChange={(e) => setDraft({ ...draft, contactSubmitLabel: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">
                Texto legal del pie de página (Footer)
              </label>
              <input
                type="text"
                value={draft.footerText}
                onChange={(e) => setDraft({ ...draft, footerText: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Nosotras & Valores */}
      {activeTab === 'nosotras' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E6E2E8] p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Etiqueta superior</label>
              <input
                type="text"
                value={draft.nosotrasKicker}
                onChange={(e) => setDraft({ ...draft, nosotrasKicker: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Titular de sección</label>
              <input
                type="text"
                value={draft.nosotrasHeading}
                onChange={(e) => setDraft({ ...draft, nosotrasHeading: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {draft.nosotrasPillars.map((pillar, idx) => (
              <div key={pillar.id} className="bg-white border border-[#E6E2E8] p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#57534E] mb-1">Pestaña</label>
                    <input
                      type="text"
                      value={pillar.label}
                      onChange={(e) => {
                        const next = [...draft.nosotrasPillars];
                        next[idx] = { ...pillar, label: e.target.value };
                        setDraft({ ...draft, nosotrasPillars: next });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold text-[#892B84] bg-[#F9F8FA] border border-[#E6E2E8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#57534E] mb-1">Subtítulo / Kicker</label>
                    <input
                      type="text"
                      value={pillar.kicker}
                      onChange={(e) => {
                        const next = [...draft.nosotrasPillars];
                        next[idx] = { ...pillar, kicker: e.target.value };
                        setDraft({ ...draft, nosotrasPillars: next });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#F9F8FA] border border-[#E6E2E8]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[#57534E] mb-1">Título del bloque</label>
                  <input
                    type="text"
                    value={pillar.title}
                    onChange={(e) => {
                      const next = [...draft.nosotrasPillars];
                      next[idx] = { ...pillar, title: e.target.value };
                      setDraft({ ...draft, nosotrasPillars: next });
                    }}
                    className="w-full px-3 py-2 text-sm font-medium bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#57534E] mb-1">Párrafo descriptivo</label>
                  <textarea
                    rows={3}
                    value={pillar.body}
                    onChange={(e) => {
                      const next = [...draft.nosotrasPillars];
                      next[idx] = { ...pillar, body: e.target.value };
                      setDraft({ ...draft, nosotrasPillars: next });
                    }}
                    className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
                {pillar.id !== 'valores' && (
                  <div className="space-y-2 pt-2 border-t border-[#E6E2E8]">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-[#57534E]">
                        Viñetas / Puntos clave
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...draft.nosotrasPillars];
                          next[idx] = {
                            ...pillar,
                            highlights: [...pillar.highlights, 'Nuevo punto destacado'],
                          };
                          setDraft({ ...draft, nosotrasPillars: next });
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#892B84] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Agregar viñeta</span>
                      </button>
                    </div>
                    {pillar.highlights.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            const nextHighlights = [...pillar.highlights];
                            nextHighlights[bIdx] = e.target.value;
                            const next = [...draft.nosotrasPillars];
                            next[idx] = { ...pillar, highlights: nextHighlights };
                            setDraft({ ...draft, nosotrasPillars: next });
                          }}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-[#F9F8FA] border border-[#E6E2E8]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextHighlights = pillar.highlights.filter((_, i) => i !== bIdx);
                            const next = [...draft.nosotrasPillars];
                            next[idx] = { ...pillar, highlights: nextHighlights };
                            setDraft({ ...draft, nosotrasPillars: next });
                          }}
                          aria-label="Eliminar viñeta"
                          className="p-1 text-[#57534E] hover:text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#E6E2E8] p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-sans text-sm font-semibold text-[#161513]">
                Valores Institucionales
              </h3>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    valoresList: [
                      ...draft.valoresList,
                      {
                        number: String(draft.valoresList.length + 1).padStart(2, '0'),
                        name: 'Nuevo valor',
                        detail: 'Descripción del compromiso institucional.',
                      },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#892B84] text-[#892B84] text-xs font-semibold hover:bg-[#892B84] hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar valor</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {draft.valoresList.map((val, idx) => (
                <div
                  key={`${val.number}-${idx}`}
                  className="p-3.5 bg-[#F9F8FA] border border-[#E6E2E8] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={val.number}
                      onChange={(e) => {
                        const next = [...draft.valoresList];
                        next[idx] = { ...val, number: e.target.value };
                        setDraft({ ...draft, valoresList: next });
                      }}
                      className="w-14 px-2 py-0.5 font-mono text-[11px] text-[#892B84] font-semibold bg-white border border-[#E6E2E8]"
                    />
                    {draft.valoresList.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            valoresList: draft.valoresList.filter((_, i) => i !== idx),
                          })
                        }
                        aria-label="Eliminar valor"
                        className="p-1 text-[#57534E] hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={val.name}
                    onChange={(e) => {
                      const next = [...draft.valoresList];
                      next[idx] = { ...val, name: e.target.value };
                      setDraft({ ...draft, valoresList: next });
                    }}
                    className="w-full px-2.5 py-1.5 text-sm font-medium bg-white border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                  <textarea
                    rows={2}
                    value={val.detail}
                    onChange={(e) => {
                      const next = [...draft.valoresList];
                      next[idx] = { ...val, detail: e.target.value };
                      setDraft({ ...draft, valoresList: next });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Servicios e Inmuebles */}
      {activeTab === 'servicios' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E6E2E8] p-5 sm:p-6 space-y-4">
            <h3 className="font-sans text-sm font-semibold text-[#161513]">
              Encabezados de Servicios e Inmuebles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#57534E] mb-1">Etiqueta Servicios</label>
                <input
                  type="text"
                  value={draft.servicesKicker}
                  onChange={(e) => setDraft({ ...draft, servicesKicker: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#57534E] mb-1">Titular Servicios</label>
                <input
                  type="text"
                  value={draft.servicesHeading}
                  onChange={(e) => setDraft({ ...draft, servicesHeading: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#57534E] mb-1">Subtítulo Servicios</label>
                <input
                  type="text"
                  value={draft.servicesSubheading}
                  onChange={(e) => setDraft({ ...draft, servicesSubheading: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E6E2E8]">
              <div>
                <label className="block text-xs text-[#57534E] mb-1">Etiqueta Inmuebles</label>
                <input
                  type="text"
                  value={draft.inmueblesKicker}
                  onChange={(e) => setDraft({ ...draft, inmueblesKicker: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#57534E] mb-1">Titular Inmuebles</label>
                <input
                  type="text"
                  value={draft.inmueblesHeading}
                  onChange={(e) => setDraft({ ...draft, inmueblesHeading: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <h3 className="font-sans text-sm font-semibold text-[#161513]">
              Tarjetas de Servicios y Viñetas
            </h3>
            <button
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  servicesList: [
                    ...draft.servicesList,
                    {
                      number: `${String(draft.servicesList.length + 1).padStart(2, '0')}.`,
                      title: 'Nuevo Servicio Especializado',
                      summary: 'Describe en un párrafo en qué consiste este servicio.',
                      deliverables: ['Primer entregable incluido', 'Segundo entregable incluido'],
                      contactIntent: 'Comprar propiedad',
                    },
                  ],
                })
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#892B84] text-[#892B84] text-xs font-semibold hover:bg-[#892B84] hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar servicio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {draft.servicesList.map((srv, idx) => (
              <div
                key={`${srv.number}-${idx}`}
                className="bg-white border border-[#E6E2E8] p-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={srv.number}
                    onChange={(e) => {
                      const next = [...draft.servicesList];
                      next[idx] = { ...srv, number: e.target.value };
                      setDraft({ ...draft, servicesList: next });
                    }}
                    className="w-16 px-2 py-1 font-mono text-xs text-[#892B84] font-semibold bg-[#F9F8FA] border border-[#E6E2E8]"
                  />
                  {draft.servicesList.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          servicesList: draft.servicesList.filter((_, i) => i !== idx),
                        })
                      }
                      aria-label="Eliminar servicio"
                      className="p-1 text-[#57534E] hover:text-[#DC2626] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={srv.title}
                  onChange={(e) => {
                    const next = [...draft.servicesList];
                    next[idx] = { ...srv, title: e.target.value };
                    setDraft({ ...draft, servicesList: next });
                  }}
                  className="w-full px-3 py-2 text-sm font-medium bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
                <textarea
                  rows={3}
                  value={srv.summary}
                  onChange={(e) => {
                    const next = [...draft.servicesList];
                    next[idx] = { ...srv, summary: e.target.value };
                    setDraft({ ...draft, servicesList: next });
                  }}
                  className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
                <div className="space-y-2 pt-2 border-t border-[#E6E2E8]">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[#57534E]">
                      Viñetas de entregables
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...draft.servicesList];
                        next[idx] = {
                          ...srv,
                          deliverables: [...srv.deliverables, 'Nuevo entregable'],
                        };
                        setDraft({ ...draft, servicesList: next });
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#892B84] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Agregar viñeta</span>
                    </button>
                  </div>
                  {srv.deliverables.map((del, dIdx) => (
                    <div key={dIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={del}
                        onChange={(e) => {
                          const nextDel = [...srv.deliverables];
                          nextDel[dIdx] = e.target.value;
                          const next = [...draft.servicesList];
                          next[idx] = { ...srv, deliverables: nextDel };
                          setDraft({ ...draft, servicesList: next });
                        }}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-[#F9F8FA] border border-[#E6E2E8]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextDel = srv.deliverables.filter((_, i) => i !== dIdx);
                          const next = [...draft.servicesList];
                          next[idx] = { ...srv, deliverables: nextDel };
                          setDraft({ ...draft, servicesList: next });
                        }}
                        aria-label="Eliminar entregable"
                        className="p-1 text-[#57534E] hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Contacto y Oficina */}
      {activeTab === 'contacto' && (
        <div className="bg-white border border-[#E6E2E8] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Etiqueta de contacto</label>
              <input
                type="text"
                value={draft.contactKicker}
                onChange={(e) => setDraft({ ...draft, contactKicker: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Titular de contacto</label>
              <input
                type="text"
                value={draft.contactHeading}
                onChange={(e) => setDraft({ ...draft, contactHeading: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Párrafo descriptivo</label>
              <textarea
                rows={3}
                value={draft.contactSubtitle}
                onChange={(e) => setDraft({ ...draft, contactSubtitle: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">
                Nota al pie del formulario
              </label>
              <input
                type="text"
                value={draft.contactPrivacyNote}
                onChange={(e) => setDraft({ ...draft, contactPrivacyNote: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Nombre de oficina</label>
              <input
                type="text"
                value={draft.officeTitle}
                onChange={(e) => setDraft({ ...draft, officeTitle: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Dirección completa</label>
              <input
                type="text"
                value={draft.officeAddress}
                onChange={(e) => setDraft({ ...draft, officeAddress: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#57534E] mb-1">Teléfono principal</label>
                <input
                  type="text"
                  value={draft.officePhone}
                  onChange={(e) => setDraft({ ...draft, officePhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#57534E] mb-1">
                  Teléfono adicional (opcional)
                </label>
                <input
                  type="text"
                  value={draft.officeSecondaryPhone}
                  onChange={(e) => setDraft({ ...draft, officeSecondaryPhone: e.target.value })}
                  placeholder="+52 56 2337 3050"
                  className="w-full px-3 py-2 text-sm font-mono bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#57534E] mb-1">Correo principal</label>
                <input
                  type="email"
                  value={draft.officeEmail}
                  onChange={(e) => setDraft({ ...draft, officeEmail: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#57534E] mb-1">
                  Segundo correo (opcional)
                </label>
                <input
                  type="email"
                  value={draft.officeSecondaryEmail}
                  onChange={(e) => setDraft({ ...draft, officeSecondaryEmail: e.target.value })}
                  placeholder="ventas@mujerinmobiliaria.com"
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Botón de WhatsApp */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white border border-[#E6E2E8] p-5 sm:p-6 space-y-5 max-w-2xl">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E6E2E8]">
            <div>
              <h3 className="font-sans text-sm font-semibold text-[#161513]">
                Botón de contacto directo por WhatsApp
              </h3>
              <p className="mt-0.5 text-xs text-[#57534E]">
                Muestra un botón flotante en todo el portal y en las fichas de propiedades.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, whatsappEnabled: !draft.whatsappEnabled })}
              className={`px-3.5 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                draft.whatsappEnabled
                  ? 'bg-[#16A34A] text-white border-[#16A34A]'
                  : 'bg-[#F9F8FA] text-[#57534E] border-[#E6E2E8]'
              }`}
            >
              {draft.whatsappEnabled ? 'Activo en portal' : 'Desactivado'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#57534E] mb-1">
                Número con lada de país (sin signos)
              </label>
              <input
                type="text"
                value={draft.whatsappNumber}
                onChange={(e) => setDraft({ ...draft, whatsappNumber: e.target.value })}
                placeholder="525623373050"
                className="w-full px-3 py-2 text-sm font-mono bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Texto del botón</label>
              <input
                type="text"
                value={draft.whatsappLabel}
                onChange={(e) => setDraft({ ...draft, whatsappLabel: e.target.value })}
                placeholder="WhatsApp"
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#57534E] mb-1">
              Mensaje automático para el cliente
            </label>
            <textarea
              rows={3}
              value={draft.whatsappMessage}
              onChange={(e) => setDraft({ ...draft, whatsappMessage: e.target.value })}
              placeholder="Qué tal, me gustaría informes sobre un inmueble."
              className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
            />
          </div>

          <div className="p-4 bg-[#F9F8FA] border border-[#E6E2E8] flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#57534E] font-semibold">
                Vista previa de enlace
              </p>
              <p className="mt-1 font-mono text-xs text-[#161513] break-all">
                {buildWhatsAppHref(draft.whatsappNumber, draft.whatsappMessage)}
              </p>
            </div>
            <a
              href={buildWhatsAppHref(draft.whatsappNumber, draft.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Probar enlace</span>
            </a>
          </div>
        </div>
      )}
    </form>
  );
};
