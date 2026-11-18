import React, { useState } from "react";
import { Box, ImageOff, ShoppingBag, X } from "lucide-react";
import type { FurnitureDemoItem } from "../data/furnitureCatalog";

interface ProductDetailModalProps {
  product: FurnitureDemoItem | null;
  onClose: () => void;
  onExplore3D: (product: FurnitureDemoItem) => void;
  onAddToInquiry: (product: FurnitureDemoItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onExplore3D,
  onAddToInquiry,
}) => {
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#30272A]/45"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#FFF9F5] border gold-hairline-strong shadow-2xl grid grid-cols-1 md:grid-cols-12">
        {/* Large Photograph */}
        <div className="md:col-span-7 bg-[#F8E4EA]/50 min-h-[280px] md:min-h-[440px] relative">
          {!imgError ? (
            <img
              src={product.photoUrl}
              alt={product.photoAlt}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[#67575C]">
              <ImageOff className="w-8 h-8 text-[#8A604B]" />
              <p className="mt-3 text-sm font-medium text-[#30272A]">
                Photograph unavailable
              </p>
            </div>
          )}
        </div>

        {/* Details Column */}
        <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8A604B]">
                  {product.category} · {product.demoLabel}
                </p>
                <h2 className="mt-1.5 font-display text-3xl font-medium text-[#30272A] leading-tight">
                  {product.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[#F8E4EA] text-[#30272A] transition-colors cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-4 text-sm text-[#67575C] leading-relaxed">
              {product.description}
            </p>

            <div className="mt-6 pt-5 border-t gold-hairline space-y-3 text-xs">
              <div>
                <span className="font-semibold text-[#30272A] block">
                  Pricing &amp; Availability
                </span>
                <span className="text-[#67575C]">
                  Showroom Demo Item · Bespoke pricing available upon inquiry
                </span>
              </div>
              <div>
                <span className="font-semibold text-[#30272A] block">
                  Verified Asset &amp; Materials
                </span>
                <span className="text-[#67575C]">{product.verifiedMaterials}</span>
              </div>
              <div>
                <span className="font-semibold text-[#30272A] block">
                  3D Interactive Capability
                </span>
                <span className="text-[#67575C]">
                  {product.supports3D
                    ? product.mechanicSummary
                    : "Interactive 3D model is not yet available for this piece."}
                </span>
              </div>
              <div>
                <span className="font-semibold text-[#30272A] block">
                  Asset Reference
                </span>
                <span className="text-[#67575C]">{product.assetSourceNote}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t gold-hairline flex flex-col gap-2.5">
            {product.supports3D && (
              <button
                type="button"
                onClick={() => {
                  onExplore3D(product);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-lg btn-royal-gold text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Box className="w-4 h-4" />
                <span>Explore in 3D</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onAddToInquiry(product);
                onClose();
              }}
              className="w-full py-3 px-4 rounded-lg btn-ivory-gold text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
              <span>Add to Showroom Inquiry</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
