import React, { useEffect, useState } from 'react';
import { Check, RotateCcw, Upload } from 'lucide-react';
import { SiteContent } from '../../types/portal';

interface AdminCmsEditorProps {
  content: SiteContent;
  onSave: (updated: SiteContent) => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

type CmsTab = 'portada' | 'nosotras' | 'servicios' | 'contacto';

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

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E6E2E8]">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F9F8FA] border border-[#E6E2E8]">
          {(
            [
              { id: 'portada', label: 'Portada (Inicio)' },
              { id: 'nosotras', label: 'Nosotras' },
              { id: 'servicios', label: 'Servicios' },
              { id: 'contacto', label: 'Contacto y Oficina' },
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
                  Cintillo de plazas (superior)
                </label>
                <input
                  type="text"
                  value={draft.heroEyebrow}
                  onChange={(e) => setDraft({ ...draft, heroEyebrow: e.target.value })}
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
                <label className="block text-xs text-[#57534E] mb-1">Descripción de firma</label>
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
                  <label className="text-xs text-[#57534E]">Imagen destacada de portada</label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#892B84] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir archivo</span>
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
                  className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
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
            <h3 className="font-sans text-sm font-semibold text-[#161513]">
              Cuatro pilares bajo portada
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {draft.capabilities.map((cap, idx) => (
                <div key={cap.number} className="p-4 bg-[#F9F8FA] border border-[#E6E2E8] space-y-2">
                  <p className="font-mono text-xs text-[#892B84] font-semibold">{cap.number}</p>
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

      {/* Tab 2: Nosotras */}
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
                <p className="font-mono text-xs text-[#892B84] font-semibold uppercase">
                  {pillar.label}
                </p>
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
                {pillar.id !== 'valores' && (
                  <div>
                    <label className="block text-[11px] text-[#57534E] mb-1">
                      Puntos clave (uno por línea)
                    </label>
                    <textarea
                      rows={3}
                      value={pillar.highlights.join('\n')}
                      onChange={(e) => {
                        const next = [...draft.nosotrasPillars];
                        next[idx] = {
                          ...pillar,
                          highlights: e.target.value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        };
                        setDraft({ ...draft, nosotrasPillars: next });
                      }}
                      className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#E6E2E8] p-5 sm:p-6 space-y-3">
            <h3 className="font-sans text-sm font-semibold text-[#161513]">
              Lista de 6 Valores Institucionales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {draft.valoresList.map((val, idx) => (
                <div key={val.number} className="p-3.5 bg-[#F9F8FA] border border-[#E6E2E8] space-y-2">
                  <p className="font-mono text-[11px] text-[#892B84] font-semibold">{val.number}</p>
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

      {/* Tab 3: Servicios */}
      {activeTab === 'servicios' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E6E2E8] p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Titular de servicios</label>
              <input
                type="text"
                value={draft.servicesHeading}
                onChange={(e) => setDraft({ ...draft, servicesHeading: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Subtítulo de servicios</label>
              <input
                type="text"
                value={draft.servicesSubheading}
                onChange={(e) => setDraft({ ...draft, servicesSubheading: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {draft.servicesList.map((srv, idx) => (
              <div key={srv.number} className="bg-white border border-[#E6E2E8] p-5 space-y-3">
                <p className="font-mono text-xs text-[#892B84] font-semibold">{srv.number}</p>
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
                <div>
                  <label className="block text-[11px] text-[#57534E] mb-1">
                    Entregables (uno por línea)
                  </label>
                  <textarea
                    rows={2}
                    value={srv.deliverables.join('\n')}
                    onChange={(e) => {
                      const next = [...draft.servicesList];
                      next[idx] = {
                        ...srv,
                        deliverables: e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      };
                      setDraft({ ...draft, servicesList: next });
                    }}
                    className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Contacto */}
      {activeTab === 'contacto' && (
        <div className="bg-white border border-[#E6E2E8] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
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
              <label className="block text-xs text-[#57534E] mb-1">Texto descriptivo</label>
              <textarea
                rows={3}
                value={draft.contactSubtitle}
                onChange={(e) => setDraft({ ...draft, contactSubtitle: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
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
                <label className="block text-xs text-[#57534E] mb-1">Teléfono oficial</label>
                <input
                  type="text"
                  value={draft.officePhone}
                  onChange={(e) => setDraft({ ...draft, officePhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#57534E] mb-1">Correo oficial</label>
                <input
                  type="email"
                  value={draft.officeEmail}
                  onChange={(e) => setDraft({ ...draft, officeEmail: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
