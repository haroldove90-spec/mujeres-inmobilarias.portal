import React, { useEffect, useState } from 'react';
import { Check, Image as ImageIcon, Plus, Star, Trash2, Upload } from 'lucide-react';
import { PropertyListing, SiteContent } from '../../types/portal';
import { compressImageFile } from '../../lib/imageUtils';

interface AdminPhotosManagerProps {
  siteContent: SiteContent;
  properties: PropertyListing[];
  onSaveSiteContent: (content: SiteContent) => Promise<void>;
  onSaveProperty: (property: PropertyListing) => Promise<void>;
}

export const AdminPhotosManager: React.FC<AdminPhotosManagerProps> = ({
  siteContent,
  properties,
  onSaveSiteContent,
  onSaveProperty,
}) => {
  const initialGallery =
    siteContent.heroGallery && siteContent.heroGallery.length > 0
      ? siteContent.heroGallery
      : [siteContent.heroImage].filter(Boolean);

  const [heroGallery, setHeroGallery] = useState<string[]>(initialGallery);
  const [captionZone, setCaptionZone] = useState(siteContent.heroImageCaptionZone);
  const [captionTitle, setCaptionTitle] = useState(siteContent.heroImageCaptionTitle);
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [savingCover, setSavingCover] = useState(false);
  const [coverSaved, setCoverSaved] = useState(false);
  const [coverError, setCoverError] = useState('');

  const [propUrlDrafts, setPropUrlDrafts] = useState<Record<string, string>>({});
  const [propSavingId, setPropSavingId] = useState<string | null>(null);
  const [propSavedId, setPropSavedId] = useState<string | null>(null);
  const [propError, setPropError] = useState('');

  useEffect(() => {
    const g =
      siteContent.heroGallery && siteContent.heroGallery.length > 0
        ? siteContent.heroGallery
        : [siteContent.heroImage].filter(Boolean);
    setHeroGallery(g);
    setCaptionZone(siteContent.heroImageCaptionZone);
    setCaptionTitle(siteContent.heroImageCaptionTitle);
  }, [siteContent]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setCoverError('');
    try {
      const compressedList = await Promise.all(
        Array.from(files).map((file) => compressImageFile(file))
      );
      setHeroGallery((prev) => [...compressedList, ...prev]);
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'No se pudo procesar la imagen.');
    }
    e.target.value = '';
  };

  const handleAddCoverUrl = () => {
    const trimmed = newCoverUrl.trim();
    if (!trimmed) return;
    setHeroGallery((prev) => [trimmed, ...prev]);
    setNewCoverUrl('');
  };

  const handleSetPrimaryCover = (idx: number) => {
    setHeroGallery((prev) => {
      if (idx <= 0 || idx >= prev.length) return prev;
      const picked = prev[idx];
      return [picked, ...prev.filter((_, i) => i !== idx)];
    });
  };

  const handleRemoveCover = (idx: number) => {
    setHeroGallery((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSaveCoverChanges = async () => {
    setCoverError('');
    setCoverSaved(false);
    const cleanGallery = heroGallery.filter(Boolean);
    if (cleanGallery.length === 0) {
      setCoverError('Debe haber al menos una foto de portada.');
      return;
    }
    setSavingCover(true);
    try {
      await onSaveSiteContent({
        ...siteContent,
        heroImage: cleanGallery[0],
        heroGallery: cleanGallery,
        heroImageCaptionZone: captionZone,
        heroImageCaptionTitle: captionTitle,
      });
      setCoverSaved(true);
      window.setTimeout(() => setCoverSaved(false), 3000);
    } catch (err) {
      setCoverError(
        err instanceof Error ? err.message : 'No se pudieron guardar las fotos en Supabase.'
      );
    } finally {
      setSavingCover(false);
    }
  };

  const updatePropertyGallery = async (prop: PropertyListing, nextGallery: string[]) => {
    setPropError('');
    const clean = nextGallery.filter(Boolean);
    if (clean.length === 0) return;
    setPropSavingId(prop.id);
    try {
      await onSaveProperty({
        ...prop,
        image: clean[0],
        gallery: clean,
        updatedAt: new Date().toISOString(),
      });
      setPropSavedId(prop.id);
      window.setTimeout(() => setPropSavedId(null), 2500);
    } catch (err) {
      setPropError(
        err instanceof Error ? err.message : 'No se pudieron actualizar las fotos del inmueble.'
      );
    } finally {
      setPropSavingId(null);
    }
  };

  const handlePropertyUpload = async (
    prop: PropertyListing,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const uploaded = await Promise.all(
        Array.from(files).map((file) => compressImageFile(file))
      );
      const baseGallery = prop.gallery && prop.gallery.length > 0 ? prop.gallery : [prop.image];
      await updatePropertyGallery(prop, [...baseGallery, ...uploaded]);
    } catch (err) {
      setPropError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Block 1: Portal Cover & Hero Gallery */}
      <section className="bg-white border border-[#E6E2E8] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E6E2E8]">
          <div>
            <h2 className="font-sans text-base font-semibold text-[#161513] inline-flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#892B84]" />
              <span>Foto principal y galería de portada del portal</span>
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              La primera foto marcada como <strong>Portada principal</strong> aparece en grande al abrir el portal. Si agregas más, el visitante podrá recorrerlas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#892B84] text-[#892B84] text-xs font-semibold hover:bg-[#892B84] hover:text-white transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Subir foto de portada</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleCoverUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleSaveCoverChanges}
              disabled={savingCover}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] disabled:opacity-60 cursor-pointer"
            >
              {coverSaved ? <Check className="w-3.5 h-3.5" /> : null}
              <span>
                {savingCover
                  ? 'Guardando en Supabase...'
                  : coverSaved
                  ? 'Portada guardada'
                  : 'Guardar portada y publicar'}
              </span>
            </button>
          </div>
        </div>

        {coverError && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
            {coverError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Active Cover Preview */}
          <div className="lg:col-span-5 space-y-3">
            <div className="relative aspect-[16/10] bg-[#F9F8FA] border border-[#E6E2E8] overflow-hidden">
              {heroGallery[0] && (
                <img
                  src={heroGallery[0]}
                  alt="Portada principal actual"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4">
                <p className="text-[11px] text-white/80">{captionZone}</p>
                <p className="text-sm font-medium text-white">{captionTitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#57534E] mb-1">Pie de foto · Zona</label>
                <input
                  type="text"
                  value={captionZone}
                  onChange={(e) => setCaptionZone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#57534E] mb-1">Pie de foto · Título</label>
                <input
                  type="text"
                  value={captionTitle}
                  onChange={(e) => setCaptionTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                />
              </div>
            </div>
          </div>

          {/* Cover Gallery List + Add by URL */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={newCoverUrl}
                onChange={(e) => setNewCoverUrl(e.target.value)}
                placeholder="Pega la URL de una foto de portada..."
                className="flex-1 px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
              />
              <button
                type="button"
                onClick={handleAddCoverUrl}
                className="px-3.5 py-2 border border-[#E6E2E8] text-xs font-semibold text-[#161513] hover:border-[#892B84] hover:text-[#892B84] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar URL</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {heroGallery.map((url, idx) => (
                <div
                  key={`${url.slice(0, 32)}-${idx}`}
                  className={`border p-2 space-y-2 ${
                    idx === 0 ? 'border-[#892B84] bg-[#F9F5F9]' : 'border-[#E6E2E8] bg-[#F9F8FA]'
                  }`}
                >
                  <div className="aspect-[16/10] bg-white overflow-hidden">
                    <img
                      src={url}
                      alt={`Portada ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    {idx === 0 ? (
                      <span className="font-semibold text-[#892B84] inline-flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Principal</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryCover(idx)}
                        className="text-[#57534E] hover:text-[#892B84] font-medium cursor-pointer"
                      >
                        Usar de portada
                      </button>
                    )}
                    {heroGallery.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCover(idx)}
                        aria-label={`Quitar foto ${idx + 1}`}
                        className="text-[#DC2626] hover:opacity-80 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Block 2: All Property Photos */}
      <section className="bg-white border border-[#E6E2E8] p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="font-sans text-base font-semibold text-[#161513]">
            Fotos de las propiedades del catálogo
          </h3>
          <p className="text-xs text-[#57534E] mt-0.5">
            Cambia la portada o agrega más fotografías a cualquier inmueble directamente desde aquí.
          </p>
        </div>

        {propError && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
            {propError}
          </div>
        )}

        <div className="space-y-4">
          {properties.map((prop) => {
            const gallery = prop.gallery && prop.gallery.length > 0 ? prop.gallery : [prop.image];
            const urlVal = propUrlDrafts[prop.id] ?? '';
            const isSaving = propSavingId === prop.id;
            const isSaved = propSavedId === prop.id;

            return (
              <div
                key={prop.id}
                className="border border-[#E6E2E8] bg-[#F9F8FA] p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] text-[#892B84] font-semibold">
                      {prop.folio} · {prop.operation}
                    </p>
                    <h4 className="text-sm font-semibold text-[#161513]">{prop.title}</h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isSaving && (
                      <span className="text-xs text-[#57534E]">Guardando fotos...</span>
                    )}
                    {isSaved && (
                      <span className="text-xs font-semibold text-[#16A34A] inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Guardado</span>
                      </span>
                    )}
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#892B84] text-[#892B84] text-xs font-semibold hover:bg-[#892B84] hover:text-white transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir fotos</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handlePropertyUpload(prop, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlVal}
                    onChange={(e) =>
                      setPropUrlDrafts((prev) => ({ ...prev, [prop.id]: e.target.value }))
                    }
                    placeholder="Pega URL de fotografía para este inmueble..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E6E2E8] focus:outline-none focus:border-[#892B84]"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const trimmed = urlVal.trim();
                      if (!trimmed) return;
                      setPropUrlDrafts((prev) => ({ ...prev, [prop.id]: '' }));
                      await updatePropertyGallery(prop, [...gallery, trimmed]);
                    }}
                    className="px-3 py-1.5 bg-white border border-[#E6E2E8] text-xs font-semibold text-[#161513] hover:border-[#892B84] cursor-pointer"
                  >
                    Agregar URL
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {gallery.map((photo, idx) => (
                    <div
                      key={`${prop.id}-${idx}`}
                      className="bg-white border border-[#E6E2E8] p-1.5 space-y-1.5"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-[#F9F8FA]">
                        <img
                          src={photo}
                          alt={`${prop.title} foto ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        {idx === 0 ? (
                          <span className="font-semibold text-[#892B84]">Portada</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const reordered = [
                                photo,
                                ...gallery.filter((_, i) => i !== idx),
                              ];
                              updatePropertyGallery(prop, reordered);
                            }}
                            className="text-[#57534E] hover:text-[#892B84] font-medium cursor-pointer"
                          >
                            Hacer portada
                          </button>
                        )}
                        {gallery.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              updatePropertyGallery(
                                prop,
                                gallery.filter((_, i) => i !== idx)
                              )
                            }
                            aria-label="Eliminar foto"
                            className="text-[#DC2626] cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
