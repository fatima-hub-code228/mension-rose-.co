import React, { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Box,
  Check,
  DoorOpen,
  Eye,
  ImageOff,
  Layers,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import {
  CATEGORIES,
  FURNITURE_CATALOG,
  type FurnitureCategory,
  type FurnitureDemoItem,
} from "./data/furnitureCatalog";
import { ShowroomViewport } from "./three/ShowroomViewport";
import { RoomVisualizerSection } from "./components/RoomVisualizerSection";
import { BagDrawer, type InquiryItem } from "./components/BagDrawer";
import { ProductDetailModal } from "./components/ProductDetailModal";

export default function App() {
  const [selectedCategory, setSelectedCategory] =
    useState<FurnitureCategory>("All");
  const [activeProduct, setActiveProduct] = useState<FurnitureDemoItem>(
    FURNITURE_CATALOG[1]
  );
  const [detailModalProduct, setDetailModalProduct] =
    useState<FurnitureDemoItem | null>(null);

  // Authentic GLB/GLTF Interactive State
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [drawersOpen, setDrawersOpen] = useState(false);
  const [cushionsRemoved, setCushionsRemoved] = useState(false);
  const [undersideMode, setUndersideMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);

  // Embedded GLB KHR_materials_variants
  const [availableVariants, setAvailableVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Missing-image honest tracking
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Showroom Inquiry Drawer State
  const [bagOpen, setBagOpen] = useState(false);
  const [inquiryItems, setInquiryItems] = useState<InquiryItem[]>([]);
  const [addedToast, setAddedToast] = useState(false);

  const atelierRef = useRef<HTMLElement | null>(null);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return FURNITURE_CATALOG;
    return FURNITURE_CATALOG.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const totalInquiryCount = inquiryItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const selectProductForViewer = (
    product: FurnitureDemoItem,
    scroll = true
  ) => {
    setActiveProduct(product);
    setDoorsOpen(false);
    setDrawersOpen(false);
    setCushionsRemoved(false);
    setUndersideMode(false);
    setSelectedVariant(null);
    setAvailableVariants([]);
    if (scroll && atelierRef.current) {
      atelierRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const resetAllMechanics = () => {
    setDoorsOpen(false);
    setDrawersOpen(false);
    setCushionsRemoved(false);
    setUndersideMode(false);
    setAutoRotate(false);
  };

  const handleAddToInquiry = (product: FurnitureDemoItem, variantNote?: string) => {
    const note =
      variantNote ||
      (selectedVariant && product.id === activeProduct.id
        ? `Selected GLB Finish: ${selectedVariant}`
        : product.verifiedMaterials);
    const key = `${product.id}__${note}`;
    setInquiryItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          category: product.category,
          variantNote: note,
          quantity: 1,
        },
      ];
    });
    setAddedToast(true);
    window.setTimeout(() => setAddedToast(false), 2200);
  };

  const handleUpdateQty = (key: string, delta: number) => {
    setInquiryItems((prev) =>
      prev
        .map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (key: string) => {
    setInquiryItems((prev) => prev.filter((item) => item.key !== key));
  };

  const markImageFailed = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#30272A]">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FFF9F5]/95 border-b gold-hairline">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-[72px] flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-2xl font-semibold tracking-tight text-[#30272A] whitespace-nowrap shrink-0"
          >
            Maison Rosé <span className="text-[#D4AF37]">&amp;</span> Co.
          </a>

          <nav
            aria-label="Primary Showroom Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#67575C]"
          >
            <a
              href="#collection"
              className="nav-link-gold hover:text-[#30272A] transition-colors whitespace-nowrap shrink-0"
            >
              Showroom
            </a>
            <a
              href="#atelier-3d"
              className="nav-link-gold hover:text-[#30272A] transition-colors whitespace-nowrap shrink-0"
            >
              3D Viewer
            </a>
            <a
              href="#room-studio"
              className="nav-link-gold hover:text-[#30272A] transition-colors whitespace-nowrap shrink-0"
            >
              Room Studio
            </a>
            <a
              href="#craftsmanship"
              className="nav-link-gold hover:text-[#30272A] transition-colors whitespace-nowrap shrink-0"
            >
              Craftsmanship
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setBagOpen(true)}
              className="px-4 py-2 rounded-lg btn-ivory-gold text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="tabular-nums">
                Inquiry ({totalInquiryCount})
              </span>
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero Architectural Showroom Banner */}
        <section className="pink-ivory-gradient border-b gold-hairline">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-5 flex flex-col justify-center">
                <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8A604B]">
                  Architectural Furniture Showroom
                </p>
                <h1 className="mt-4 font-display text-[clamp(2.5rem,4.3vw,4rem)] font-medium leading-[1.06] text-[#30272A] text-balance">
                  Timeless Interiors, Photorealistic Form
                </h1>
                <p className="mt-5 text-[15px] lg:text-base text-[#67575C] leading-relaxed max-w-prose">
                  Explore curated showroom demo pieces across twelve residential
                  categories—from beds, sofas, and dining sets to wardrobes,
                  dressing tables, cabinets, and consoles—paired with authentic
                  GLB/GLTF 3D inspection.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <a
                    href="#collection"
                    className="px-6 py-3.5 rounded-lg btn-royal-gold text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <span>Browse Showroom</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="#atelier-3d"
                    className="px-6 py-3.5 rounded-lg btn-ivory-gold text-sm font-semibold whitespace-nowrap shrink-0"
                  >
                    Open 3D Viewer
                  </a>
                </div>

                <div className="mt-10 pt-6 border-t gold-hairline flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#67575C]">
                  <span>12 Furniture Categories</span>
                  <span aria-hidden="true" className="text-[#D4AF37]">
                    ·
                  </span>
                  <span>Authentic GLB/GLTF 3D Models</span>
                  <span aria-hidden="true" className="text-[#D4AF37]">
                    ·
                  </span>
                  <span>Showroom Demo Showcase</span>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="relative h-full min-h-[340px] lg:min-h-[480px] rounded-2xl overflow-hidden border gold-hairline-strong shadow-lg bg-[#F8E4EA]">
                  {!failedImages["hero"] ? (
                    <img
                      src="/src/assets/images/hero_showroom_atelier_1795001002715.jpg"
                      alt="Sunlit luxury furniture showroom interior with warm ivory arches, soft blush plaster walls, brushed gold brass trim, and walnut boucle sofa"
                      referrerPolicy="no-referrer"
                      onError={() => markImageFailed("hero")}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[#67575C]">
                      <ImageOff className="w-8 h-8 text-[#8A604B]" />
                      <p className="mt-3 text-sm font-medium text-[#30272A]">
                        Showroom photograph unavailable
                      </p>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#30272A]/65 via-[#30272A]/20 to-transparent" />
                  <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-4 text-[#FFF9F5]">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#E8CF78]">
                        Sunlit Atelier Gallery
                      </p>
                      <p className="font-display text-2xl font-medium">
                        Curated Living, Bedroom &amp; Storage Suites
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full 12-Category Showroom Catalog with Large Photorealistic Photography */}
        <section id="collection" className="py-20 lg:py-24 bg-[#FFF9F5]">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="flex flex-col gap-6 pb-8 border-b gold-hairline">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#8A604B]">
                    Showroom Catalog · Demo Collection
                  </p>
                  <h2 className="mt-2 font-display text-3xl lg:text-4xl font-medium text-[#30272A] text-balance">
                    All Furniture Categories
                  </h2>
                </div>
                <p className="text-xs text-[#67575C] tabular-nums">
                  Showing {filteredProducts.length} of {FURNITURE_CATALOG.length}{" "}
                  demo items
                </p>
              </div>

              {/* 12 Category Filter Bar */}
              <div
                role="tablist"
                aria-label="Furniture Categories"
                className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-[#F8E4EA]/60 border gold-hairline"
              >
                {CATEGORIES.map((category) => {
                  const active = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? "bg-[#30272A] text-[#FFF9F5] shadow-sm"
                          : "text-[#30272A] hover:bg-[#FFF9F5]/85"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Cards Grid: Large Photography + Soft Baby Pink Surface + Royal Gold Accents */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const isSelected = activeProduct.id === product.id;
                const imgBroken = Boolean(failedImages[product.id]);

                return (
                  <article
                    key={product.id}
                    className={`rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col justify-between bg-[#F8E4EA]/45 ${
                      isSelected
                        ? "border-[#D4AF37] shadow-lg ring-1 ring-[#D4AF37]/60"
                        : "border-[#D4AF37]/35 hover:border-[#D4AF37] hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    <div>
                      {/* Large Photorealistic Furniture Photograph (Dominant Card Visual) */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F8E4EA] border-b gold-hairline">
                        {!imgBroken ? (
                          <img
                            src={product.photoUrl}
                            alt={product.photoAlt}
                            referrerPolicy="no-referrer"
                            onError={() => markImageFailed(product.id)}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#F8E4EA] text-[#67575C]">
                            <ImageOff className="w-7 h-7 text-[#8A604B]" />
                            <p className="mt-2 text-xs font-medium text-[#30272A]">
                              Product photograph unavailable
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card Typography & Honest Metadata */}
                      <div className="p-6 bg-[#FFF9F5]/85">
                        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A604B]">
                          <span>{product.category}</span>
                          <span aria-hidden="true" className="text-[#D4AF37]">
                            ·
                          </span>
                          <span>{product.demoLabel}</span>
                        </div>

                        <h3 className="mt-2 font-display text-2xl font-medium text-[#30272A] leading-snug">
                          {product.name}
                        </h3>

                        <p className="mt-2 text-xs text-[#67575C] leading-relaxed">
                          {product.supports3D
                            ? product.mechanicSummary
                            : "Interactive 3D model not yet available — photography preview only."}
                        </p>
                      </div>
                    </div>

                    {/* Card Action Buttons: View Details + Conditional Explore in 3D */}
                    <div className="px-6 pb-6 pt-4 bg-[#FFF9F5]/85 border-t gold-hairline flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setDetailModalProduct(product)}
                        className="flex-1 py-2.5 px-3.5 rounded-lg btn-ivory-gold text-xs font-semibold text-center whitespace-nowrap cursor-pointer"
                      >
                        View Details
                      </button>

                      {product.supports3D ? (
                        <button
                          type="button"
                          onClick={() => selectProductForViewer(product, true)}
                          className={`flex-1 py-2.5 px-3.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            isSelected ? "btn-royal-gold" : "btn-royal-gold"
                          }`}
                        >
                          <Box className="w-3.5 h-3.5" />
                          <span>
                            {isSelected ? "Viewing in 3D" : "Explore in 3D"}
                          </span>
                        </button>
                      ) : (
                        <span className="flex-1 py-2.5 px-3 rounded-lg bg-[#F8E4EA]/60 border gold-hairline text-[11px] font-medium text-[#67575C] text-center whitespace-nowrap">
                          3D Not Available
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Authentic 360° GLB / GLTF Interactive Product Viewer */}
        <section
          id="atelier-3d"
          ref={atelierRef}
          className="py-20 lg:py-24 bg-[#FAF2EC]/65 border-t gold-hairline"
        >
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#8A604B]">
                  Interactive 3D GLB / GLTF Product Viewer
                </p>
                <h2 className="mt-2 font-display text-3xl lg:text-4xl font-medium text-[#30272A]">
                  {activeProduct.name}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#67575C]">
                  <span>{activeProduct.category}</span>
                  <span aria-hidden="true" className="text-[#D4AF37]">
                    ·
                  </span>
                  <span>{activeProduct.assetSourceNote}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* 3D GLB/GLTF Viewport (Left 8 Columns) */}
              <div className="lg:col-span-8">
                <ShowroomViewport
                  product={activeProduct}
                  doorsOpen={doorsOpen}
                  drawersOpen={drawersOpen}
                  cushionsRemoved={cushionsRemoved}
                  undersideMode={undersideMode}
                  autoRotate={autoRotate}
                  selectedVariant={selectedVariant}
                  onVariantsDiscovered={setAvailableVariants}
                  onSelectVariant={setSelectedVariant}
                  onToggleDoors={() => setDoorsOpen((v) => !v)}
                  onToggleDrawers={() => setDrawersOpen((v) => !v)}
                  onToggleCushions={() => setCushionsRemoved((v) => !v)}
                  onToggleUnderside={() => setUndersideMode((v) => !v)}
                  onToggleAutoRotate={() => setAutoRotate((v) => !v)}
                  onResetAll={resetAllMechanics}
                />
              </div>

              {/* Honest Inspector Sidebar (Right 4 Columns) */}
              <aside className="lg:col-span-4 bg-[#FFF9F5] border gold-hairline rounded-2xl p-6 space-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A604B]">
                    {activeProduct.demoLabel}
                  </p>
                  <p className="mt-2 text-sm text-[#67575C] leading-relaxed">
                    {activeProduct.description}
                  </p>
                </div>

                {/* Supported 3D Mechanics for Current GLB/GLTF Asset */}
                <div className="pt-4 border-t gold-hairline">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8A604B]">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>3D Geometry Controls</span>
                  </div>

                  {activeProduct.supports3D ? (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => setUndersideMode((v) => !v)}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          undersideMode
                            ? "bg-[#D4AF37] text-[#241C1E] border-[#B89228]"
                            : "bg-[#F8E4EA]/45 text-[#30272A] gold-hairline hover:bg-[#F8E4EA]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Underside Inspection</span>
                        </span>
                        <span>{undersideMode ? "Active" : "Inspect"}</span>
                      </button>

                      {activeProduct.supportsDoors && (
                        <button
                          type="button"
                          onClick={() => setDoorsOpen((v) => !v)}
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            doorsOpen
                              ? "bg-[#30272A] text-[#FFF9F5] border-[#D4AF37]"
                              : "bg-[#F8E4EA]/45 text-[#30272A] gold-hairline hover:bg-[#F8E4EA]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <DoorOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Hinged Cabinet Doors</span>
                          </span>
                          <span>{doorsOpen ? "Open" : "Closed"}</span>
                        </button>
                      )}

                      {activeProduct.supportsDrawers && (
                        <button
                          type="button"
                          onClick={() => setDrawersOpen((v) => !v)}
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            drawersOpen
                              ? "bg-[#30272A] text-[#FFF9F5] border-[#D4AF37]"
                              : "bg-[#F8E4EA]/45 text-[#30272A] gold-hairline hover:bg-[#F8E4EA]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Sliding Storage Drawers</span>
                          </span>
                          <span>{drawersOpen ? "Open" : "Closed"}</span>
                        </button>
                      )}

                      {activeProduct.supportsCushionRemoval && (
                        <button
                          type="button"
                          onClick={() => setCushionsRemoved((v) => !v)}
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            cushionsRemoved
                              ? "bg-[#30272A] text-[#FFF9F5] border-[#D4AF37]"
                              : "bg-[#F8E4EA]/45 text-[#30272A] gold-hairline hover:bg-[#F8E4EA]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Separate Cushion Meshes</span>
                          </span>
                          <span>{cushionsRemoved ? "Removed" : "Seated"}</span>
                        </button>
                      )}

                      {!activeProduct.supportsDoors &&
                        !activeProduct.supportsDrawers &&
                        !activeProduct.supportsCushionRemoval && (
                          <p className="text-xs text-[#67575C] leading-relaxed pt-1">
                            {activeProduct.mechanicSummary}
                          </p>
                        )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[#67575C] leading-relaxed">
                      Interactive 3D model is not yet available for this piece.
                    </p>
                  )}
                </div>

                {/* Embedded GLB KHR_materials_variants when supported */}
                {availableVariants.length > 0 && (
                  <div className="pt-4 border-t gold-hairline">
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8A604B] block">
                      Embedded GLB Material Variants
                    </span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {availableVariants.map((variant) => {
                        const active = selectedVariant === variant;
                        return (
                          <button
                            key={variant}
                            type="button"
                            onClick={() => setSelectedVariant(variant)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                              active
                                ? "bg-[#D4AF37] text-[#241C1E] border-[#B89228]"
                                : "bg-[#F8E4EA]/45 text-[#30272A] gold-hairline hover:bg-[#F8E4EA]"
                            }`}
                          >
                            {variant}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Honest Verified Specifications */}
                <div className="pt-4 border-t gold-hairline space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-[#30272A] block">
                      Verified Materials
                    </span>
                    <span className="text-[#67575C]">
                      {activeProduct.verifiedMaterials}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#30272A] block">
                      Pricing
                    </span>
                    <span className="text-[#67575C]">
                      Demo Showcase · Bespoke pricing upon showroom inquiry
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t gold-hairline">
                  <button
                    type="button"
                    onClick={() => handleAddToInquiry(activeProduct)}
                    className="w-full py-3.5 px-5 rounded-lg btn-royal-gold text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {addedToast ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Showroom Inquiry</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add Demo Item to Inquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* High-Resolution Room Studio (gemini-3-pro-image-preview with 1K / 2K / 4K) */}
        <RoomVisualizerSection
          product={activeProduct}
          selectedVariant={selectedVariant}
        />

        {/* Craftsmanship & Material Provenance */}
        <section id="craftsmanship" className="py-20 lg:py-24 bg-[#FFF9F5]">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#8A604B]">
                Material Provenance
              </p>
              <h2 className="mt-2 font-display text-3xl lg:text-4xl font-medium text-[#30272A] text-balance">
                Authentic Materials &amp; Architectural Joinery
              </h2>
              <p className="mt-3 text-sm text-[#67575C] leading-relaxed">
                From natural timber grain and stone veining to tailored textiles
                and brushed metal fittings, every surface in our photography and
                3D GLB/GLTF models preserves true material fidelity.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <article className="card-luxury rounded-2xl overflow-hidden flex flex-col">
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#F8E4EA]">
                  {!failedImages["craft-1"] ? (
                    <img
                      src="/src/assets/images/craftsmanship_joinery_detail_1795001004167.jpg"
                      alt="Solid American walnut mortise-and-tenon joinery with brushed brass inlay and hand-stitched saddle leather"
                      referrerPolicy="no-referrer"
                      onError={() => markImageFailed("craft-1")}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 text-xs text-[#67575C]">
                      Craftsmanship photograph unavailable
                    </div>
                  )}
                </div>
                <div className="p-7">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-[#8A604B]">
                    01. Architectural Joinery
                  </p>
                  <h3 className="mt-1.5 font-display text-2xl font-medium text-[#30272A]">
                    Mortise, Tenon &amp; Articulated Hardware
                  </h3>
                  <p className="mt-2 text-sm text-[#67575C] leading-relaxed">
                    Inspect hinged cabinet doors, sliding drawers, underside
                    stretchers, and maker labels directly on our genuine 3D
                    GLB/GLTF assets.
                  </p>
                </div>
              </article>

              <article className="card-luxury rounded-2xl overflow-hidden flex flex-col">
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#F8E4EA]">
                  {!failedImages["craft-2"] ? (
                    <img
                      src="/src/assets/images/material_atelier_swatches_1795001003636.jpg"
                      alt="Curated material library featuring oiled walnut, Belgian oat boucle, cognac saddle leather, Roman travertine, and brushed brass"
                      referrerPolicy="no-referrer"
                      onError={() => markImageFailed("craft-2")}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 text-xs text-[#67575C]">
                      Material swatches photograph unavailable
                    </div>
                  )}
                </div>
                <div className="p-7">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-[#8A604B]">
                    02. Honest Material Presentation
                  </p>
                  <h3 className="mt-1.5 font-display text-2xl font-medium text-[#30272A]">
                    Natural Wood, Leather, Stone &amp; Velvet
                  </h3>
                  <p className="mt-2 text-sm text-[#67575C] leading-relaxed">
                    Real interior photography presents every category in natural
                    sunlight, while our 3D viewer renders physically based GLB
                    and GLTF textures true to their authentic finish.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Luxury Footer */}
      <footer className="border-t gold-hairline bg-[#F8E4EA]/40 py-10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#67575C]">
          <p className="font-display text-lg font-medium text-[#30272A]">
            Maison Rosé <span className="text-[#D4AF37]">&amp;</span> Co.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#collection"
              className="hover:text-[#30272A] transition-colors"
            >
              Showroom
            </a>
            <a
              href="#atelier-3d"
              className="hover:text-[#30272A] transition-colors"
            >
              3D Viewer
            </a>
            <a
              href="#room-studio"
              className="hover:text-[#30272A] transition-colors"
            >
              Room Studio
            </a>
            <a
              href="#craftsmanship"
              className="hover:text-[#30272A] transition-colors"
            >
              Craftsmanship
            </a>
          </div>
          <p>
            © {new Date().getFullYear()} Maison Rosé &amp; Co. Demo Showroom.
          </p>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailModalProduct}
        onClose={() => setDetailModalProduct(null)}
        onExplore3D={(p) => selectProductForViewer(p, true)}
        onAddToInquiry={(p) => handleAddToInquiry(p)}
      />

      {/* Slide-Over Showroom Inquiry Drawer */}
      <BagDrawer
        open={bagOpen}
        items={inquiryItems}
        onClose={() => setBagOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearBag={() => setInquiryItems([])}
      />
    </div>
  );
}
