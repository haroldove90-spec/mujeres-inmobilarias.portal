import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import {
  Advisor,
  OperationType,
  PropertyCategory,
  PropertyListing,
  PropertyStatus,
  RegionState,
} from '../../types/portal';

interface PropertyEditorModalProps {
  isOpen: boolean;
  initialProperty: PropertyListing | null;
  advisors: Advisor[];
  onClose: () => void;
  onSave: (property: PropertyListing) => Promise<void>;
}

const DEFAULT_FALLBACK_IMAGE = '/src/assets/images/prop_queretaro_campanario_1794951601828.jpg';

export const PropertyEditorModal: React.FC<PropertyEditorModalProps> = ({
  isOpen,
  initialProperty,
  advisors,
  onClose,
  onSave,
}) => {
  const [folio, setFolio] = useState('');
  const [title, setTitle] = useState('');
  const [operation, setOperation] = useState<OperationType>('Venta');
  const [category, setCategory] = useState<PropertyCategory>('Residencial');
  const [state, setState] = useState<RegionState>('Querétaro');
  const [zone, setZone] = useState('');
  const [priceMxn, setPriceMxn] = useState<string>('5000000');
  const [priceSuffix, setPriceSuffix] = useState('');
  const [areaLandM2, setAreaLandM2] = useState<string>('300');
  const [areaConstM2, setAreaConstM2] = useState<string>('240');
  const [bedrooms, setBedrooms] = useState<string>('3');
  const [bathrooms, setBathrooms] = useState<string>('3');
  const [parking, setParking] = useState<string>('2');
  const [status, setStatus] = useState<PropertyStatus>('Disponible');
  const [featured, setFeatured] = useState(false);
  const [legalStatus, setLegalStatus] = useState('Escritura pública · Libre de gravamen');
  const [advisorId, setAdvisorId] = useState(advisors[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [highlightsText, setHighlightsText] = useState('');
  const [gallery, setGallery] = useState<string[]>([DEFAULT_FALLBACK_IMAGE]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialProperty) {
      setFolio(initialProperty.folio);
      setTitle(initialProperty.title);
      setOperation(initialProperty.operation);
      setCategory(initialProperty.category);
      setState(initialProperty.state);
      setZone(initialProperty.zone);
      setPriceMxn(String(initialProperty.priceMxn));
      setPriceSuffix(initialProperty.priceSuffix ?? '');
      setAreaLandM2(String(initialProperty.areaLandM2));
      setAreaConstM2(String(initialProperty.areaConstM2));
      setBedrooms(String(initialProperty.bedrooms));
      setBathrooms(String(initialProperty.bathrooms));
      setParking(String(initialProperty.parking));
      setStatus(initialProperty.status);
      setFeatured(initialProperty.featured);
      setLegalStatus(initialProperty.legalStatus);
      setAdvisorId(initialProperty.advisorId || advisors[0]?.id || '');
      setDescription(initialProperty.description);
      setHighlightsText(initialProperty.highlights.join('\n'));
      setGallery(
        initialProperty.gallery.length > 0
          ? initialProperty.gallery
          : [initialProperty.image || DEFAULT_FALLBACK_IMAGE]
      );
    } else {
      const randomCode = Math.floor(400 + Math.random() * 500);
      setFolio(`MIA-QRO-${randomCode}`);
      setTitle('');
      setOperation('Venta');
      setCategory('Residencial');
      setState('Querétaro');
      setZone('');
      setPriceMxn('6500000');
      setPriceSuffix('');
      setAreaLandM2('320');
      setAreaConstM2('260');
      setBedrooms('3');
      setBathrooms('3.5');
      setParking('2');
      setStatus('Disponible');
      setFeatured(false);
      setLegalStatus('Escritura pública · Libre de gravamen');
      setAdvisorId(advisors[0]?.id ?? '');
      setDescription('');
      setHighlightsText('');
      setGallery([DEFAULT_FALLBACK_IMAGE]);
    }
    setNewImageUrl('');
    setError('');
  }, [isOpen, initialProperty, advisors]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setGallery((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    setGallery((prev) => [...prev, trimmed]);
    setNewImageUrl('');
  };

  const handleRemovePhoto = (index: number) => {
    setGallery((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length > 0 ? filtered : [DEFAULT_FALLBACK_IMAGE];
    });
  };

  const handleSetPrimary = (index: number) => {
    setGallery((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const picked = prev[index];
      return [picked, ...prev.filter((_, i) => i !== index)];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(priceMxn);
    if (!title.trim() || !zone.trim() || !folio.trim() || isNaN(numericPrice) || numericPrice <= 0) {
      setError('Completa folio, título, zona y un precio válido mayor a cero.');
      return;
    }

    setError('');
    setSaving(true);

    const selectedAdvisor =
      advisors.find((a) => a.id === advisorId) ??
      advisors[0] ?? {
        id: 'adv-default',
        name: 'Sofía Mendoza Villalobos',
        role: 'Asesora Inmobiliaria',
        license: 'Certificación Vigente',
      };

    const parsedHighlights = highlightsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const cleanGallery = gallery.length > 0 ? gallery : [DEFAULT_FALLBACK_IMAGE];

    const record: PropertyListing = {
      id: initialProperty?.id ?? `prop-${Date.now()}`,
      folio: folio.trim().toUpperCase(),
      title: title.trim(),
      operation,
      category,
      state,
      zone: zone.trim(),
      priceMxn: numericPrice,
      priceSuffix: operation === 'Renta' ? priceSuffix.trim() || '/ mes' : undefined,
      areaLandM2: Number(areaLandM2) || 0,
      areaConstM2: Number(areaConstM2) || 0,
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      parking: Number(parking) || 0,
      image: cleanGallery[0],
      gallery: cleanGallery,
      status,
      featured,
      legalStatus: legalStatus.trim() || 'Documentación verificada',
      advisorId: selectedAdvisor.id,
      advisor: {
        name: selectedAdvisor.name,
        role: selectedAdvisor.role,
        license: selectedAdvisor.license,
      },
      highlights:
        parsedHighlights.length > 0
          ? parsedHighlights
          : ['Asesoría jurídica y notarial incluida'],
      description:
        description.trim() ||
        'Propiedad verificada por el equipo de Mujer Inmobiliaria & Asociadas.',
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSave(record);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#161513]/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-property-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white border border-[#E6E2E8] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 sm:px-6 py-4 bg-white border-b border-[#E6E2E8]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#892B84] font-semibold">
              {initialProperty ? `Editar ${initialProperty.folio}` : 'Nueva Propiedad'}
            </p>
            <h2 id="editor-property-title" className="text-xl font-medium text-[#161513]">
              {initialProperty ? initialProperty.title : 'Alta de inmueble en el catálogo'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar editor"
            className="w-9 h-9 inline-flex items-center justify-center border border-[#E6E2E8] text-[#161513] hover:border-[#892B84] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          {/* Basic Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Folio</label>
              <input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Operación</label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as OperationType)}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              >
                <option value="Venta">Venta</option>
                <option value="Renta">Renta</option>
                <option value="Terreno">Terreno</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Estatus comercial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              >
                <option value="Disponible">Disponible</option>
                <option value="Apartada">Apartada</option>
                <option value="Vendida">Vendida</option>
                <option value="Rentada">Rentada</option>
                <option value="Oculta">Oculta (borrador)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Título del inmueble</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Residencia Jardines del Valle"
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PropertyCategory)}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              >
                <option value="Residencial">Residencial</option>
                <option value="Villa">Villa</option>
                <option value="Terreno">Terreno</option>
                <option value="Corporativo">Corporativo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Estado / Plaza</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value as RegionState)}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              >
                <option value="Querétaro">Querétaro</option>
                <option value="Yucatán">Yucatán</option>
                <option value="Estado de México">Estado de México</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Zona / Fraccionamiento</label>
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Ej. Juriquilla, Santiago de Querétaro"
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
            </div>
          </div>

          {/* Pricing & Dimensions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 sm:col-span-2">
              <label className="block text-xs text-[#57534E] mb-1">Precio (MXN)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={priceMxn}
                onChange={(e) => setPriceMxn(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Terreno (m²)</label>
              <input
                type="number"
                min={0}
                value={areaLandM2}
                onChange={(e) => setAreaLandM2(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Construcción (m²)</label>
              <input
                type="number"
                min={0}
                value={areaConstM2}
                onChange={(e) => setAreaConstM2(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Recámaras</label>
              <input
                type="number"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Baños</label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Estacionamiento</label>
              <input
                type="number"
                min={0}
                value={parking}
                onChange={(e) => setParking(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            {operation === 'Renta' && (
              <div className="col-span-3 sm:col-span-1">
                <label className="block text-xs text-[#57534E] mb-1">Periodicidad</label>
                <input
                  type="text"
                  value={priceSuffix}
                  onChange={(e) => setPriceSuffix(e.target.value)}
                  placeholder="/ mes"
                  className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
                />
              </div>
            )}
          </div>

          {/* Legal & Advisor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Situación jurídica</label>
              <input
                type="text"
                value={legalStatus}
                onChange={(e) => setLegalStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Asesora asignada</label>
              <select
                value={advisorId}
                onChange={(e) => setAdvisorId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              >
                {advisors.map((adv) => (
                  <option key={adv.id} value={adv.id}>
                    {adv.name} — {adv.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="inline-flex items-center gap-2.5 text-xs font-medium text-[#161513] cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="accent-[#892B84] w-4 h-4"
            />
            <span>Marcar como propiedad destacada (aparece primero en el catálogo)</span>
          </label>

          {/* Description & Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#57534E] mb-1">Descripción editorial</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe orientación, acabados, entorno y ventajas..."
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#57534E] mb-1">
                Atributos destacados (uno por línea)
              </label>
              <textarea
                rows={4}
                value={highlightsText}
                onChange={(e) => setHighlightsText(e.target.value)}
                placeholder={'Cocina equipada con barra de cuarcita\nSeguridad 24/7\nJardín privado'}
                className="w-full px-3 py-2 text-sm bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
            </div>
          </div>

          {/* Photo Gallery Manager */}
          <div className="border-t border-[#E6E2E8] pt-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-sans text-sm font-semibold text-[#161513]">
                  Galería fotográfica ({gallery.length})
                </h3>
                <p className="text-xs text-[#57534E]">
                  La primera imagen se muestra como portada en el catálogo.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#892B84] text-[#892B84] text-xs font-semibold hover:bg-[#892B84] hover:text-white transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir fotos desde equipo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="O pega la URL de una fotografía..."
                className="flex-1 px-3 py-2 text-xs bg-[#F9F8FA] border border-[#E6E2E8] text-[#161513] focus:outline-none focus:border-[#892B84]"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3.5 py-2 border border-[#E6E2E8] text-xs font-semibold text-[#161513] hover:border-[#892B84] hover:text-[#892B84] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar URL</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {gallery.map((url, idx) => (
                <div key={`${url}-${idx}`} className="border border-[#E6E2E8] bg-[#F9F8FA] p-2 space-y-2">
                  <div className="aspect-[4/3] overflow-hidden bg-white">
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    {idx === 0 ? (
                      <span className="font-semibold text-[#892B84]">Portada</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="text-[#57534E] hover:text-[#892B84] font-medium cursor-pointer"
                      >
                        Hacer portada
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      aria-label={`Quitar foto ${idx + 1}`}
                      className="text-[#DC2626] hover:opacity-80 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-[#DC2626]">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6E2E8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-[#E6E2E8] text-xs font-semibold text-[#161513] hover:border-[#892B84] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#892B84] text-white text-xs font-semibold hover:bg-[#6E206A] transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar inmueble'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
