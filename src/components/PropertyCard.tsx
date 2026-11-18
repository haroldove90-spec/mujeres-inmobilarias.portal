import React, { useState } from 'react';
import { Bookmark, Building2, ArrowUpRight } from 'lucide-react';
import { PropertyListing, formatMxn } from '../data/properties';

interface PropertyCardProps {
  property: PropertyListing;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onSelect: (property: PropertyListing) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isSaved,
  onToggleSave,
  onSelect,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <article className="group bg-white border border-[#E6E2E8] flex flex-col transition-colors duration-200 hover:border-[#892B84]/50">
      {/* 4:3 Architectural Thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F9F8FA] border-b border-[#E6E2E8]">
        <button
          type="button"
          onClick={() => onSelect(property)}
          className="block w-full h-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#892B84]"
          aria-label={`Ver ficha técnica de ${property.title}`}
        >
          {!imgError ? (
            <img
              src={property.image}
              alt={`${property.title} en ${property.zone}`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#57534E] bg-gradient-to-br from-[#F9F8FA] to-[#E6E2E8] p-4">
              <Building2 className="w-7 h-7" />
              <span className="text-xs font-medium text-center">{property.title}</span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onToggleSave(property.id)}
          aria-label={isSaved ? 'Quitar de guardadas' : 'Guardar propiedad'}
          aria-pressed={isSaved}
          className={`absolute top-3 right-3 w-9 h-9 inline-flex items-center justify-center border transition-colors cursor-pointer ${
            isSaved
              ? 'bg-[#892B84] border-[#892B84] text-white'
              : 'bg-white/95 border-[#E6E2E8] text-[#161513] hover:border-[#892B84] hover:text-[#892B84]'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Body — Zero-pill unboxed metadata */}
      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-5 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-[#57534E]">
            <span className="font-semibold text-[#892B84]">{property.operation}</span>
            <span aria-hidden="true">·</span>
            <span>{property.state}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px] tabular-nums">{property.folio}</span>
          </div>

          <h3 className="mt-2.5 text-xl sm:text-2xl font-medium tracking-tight text-[#161513] leading-snug">
            <button
              type="button"
              onClick={() => onSelect(property)}
              className="text-left hover:text-[#892B84] transition-colors cursor-pointer"
            >
              {property.title}
            </button>
          </h3>

          <p className="mt-1 text-xs text-[#57534E] truncate">{property.zone}</p>
        </div>

        <div className="pt-4 border-t border-[#E6E2E8] space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-lg font-medium text-[#161513] tabular-nums">
              {formatMxn(property.priceMxn)}
              {property.priceSuffix ? (
                <span className="font-sans text-xs text-[#57534E] ml-1">
                  {property.priceSuffix}
                </span>
              ) : null}
            </p>
            <span className="text-[11px] text-[#57534E] font-mono tabular-nums whitespace-nowrap shrink-0">
              {property.areaLandM2} m² terr.
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-[#57534E] min-w-0">
            <span className="tabular-nums truncate min-w-0">
              {property.areaConstM2 > 0
                ? `${property.areaConstM2} m² const. · ${property.bedrooms} Rec. · ${property.bathrooms} Baños`
                : 'Macrolote urbanizado · Uso H2'}
            </span>
            <button
              type="button"
              onClick={() => onSelect(property)}
              className="inline-flex items-center gap-1 font-semibold text-[#892B84] hover:text-[#6E206A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Ver ficha</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
