import React, { useState } from "react";
import { Download, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react";
import type { FurnitureDemoItem } from "../data/furnitureCatalog";

export type RenderResolution = "1K" | "2K" | "4K";
export type RenderAspectRatio = "16:9" | "4:3" | "1:1";

interface RoomVisualizerSectionProps {
  product: FurnitureDemoItem;
  selectedVariant: string | null;
}

const ROOM_ARCHITECTURES = [
  "Sunlit Parisian Haussmann Salon",
  "Warm Ivory Travertine Penthouse",
  "Soft Blush Plaster Sanctuary",
  "Walnut & Limestone Gallery",
];

const LIGHTING_MOODS = [
  "Morning Natural Sunlight",
  "Golden Hour Architectural Glow",
  "Soft Diffused Atelier Daylight",
];

const RESOLUTIONS: { value: RenderResolution; label: string; detail: string }[] = [
  { value: "1K", label: "1K", detail: "1024px studio preview" },
  { value: "2K", label: "2K", detail: "2048px architectural print" },
  { value: "4K", label: "4K", detail: "4096px master render" },
];

const ASPECT_RATIOS: RenderAspectRatio[] = ["16:9", "4:3", "1:1"];

export const RoomVisualizerSection: React.FC<RoomVisualizerSectionProps> = ({
  product,
  selectedVariant,
}) => {
  const [roomStyle, setRoomStyle] = useState(ROOM_ARCHITECTURES[0]);
  const [lightingMood, setLightingMood] = useState(LIGHTING_MOODS[0]);
  const [imageSize, setImageSize] = useState<RenderResolution>("2K");
  const [aspectRatio, setAspectRatio] = useState<RenderAspectRatio>("16:9");
  const [customNotes, setCustomNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renderedImage, setRenderedImage] = useState<{
    url: string;
    size: RenderResolution;
    aspectRatio: RenderAspectRatio;
    furnitureName: string;
  } | null>(null);

  const materialsSummary = selectedVariant
    ? `${selectedVariant} (${product.verifiedMaterials})`
    : product.verifiedMaterials;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/generate-room-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          furnitureName: product.name.replace(" (Demo Item)", ""),
          category: product.category,
          materialsSummary,
          roomStyle,
          lightingMood,
          imageSize,
          aspectRatio,
          customNotes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "Unable to generate interior visualization."
        );
      }

      setRenderedImage({
        url: data.imageUrl,
        size: data.imageSize ?? imageSize,
        aspectRatio: data.aspectRatio ?? aspectRatio,
        furnitureName: product.name,
      });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while generating the room render."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section
      id="room-studio"
      className="py-20 lg:py-24 pink-ivory-soft-section border-y gold-hairline"
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Configuration Column */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#FFF9F5] border gold-hairline rounded-2xl p-7 lg:p-9">
            <div>
              <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#8A604B]">
                Bespoke Room Visualization
              </p>
              <h2 className="mt-2 font-display text-3xl lg:text-4xl font-medium text-[#30272A] leading-tight text-balance">
                Visualize Your Piece in Sunlit Architecture
              </h2>
              <p className="mt-3 text-sm text-[#67575C] leading-relaxed">
                Generate a photorealistic architectural room visualization
                featuring{" "}
                <strong className="text-[#30272A] font-semibold">
                  {product.name}
                </strong>{" "}
                in 1K, 2K, or 4K resolution.
              </p>

              <form onSubmit={handleGenerate} className="mt-7 space-y-5">
                <div>
                  <label
                    htmlFor="room-architecture"
                    className="block text-xs font-semibold tracking-wide text-[#30272A] mb-2"
                  >
                    Architectural Setting
                  </label>
                  <select
                    id="room-architecture"
                    value={roomStyle}
                    onChange={(e) => setRoomStyle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F5] border gold-hairline text-sm text-[#30272A] focus:outline-none focus:border-[#D4AF37]"
                  >
                    {ROOM_ARCHITECTURES.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="lighting-mood"
                    className="block text-xs font-semibold tracking-wide text-[#30272A] mb-2"
                  >
                    Natural Light Direction
                  </label>
                  <select
                    id="lighting-mood"
                    value={lightingMood}
                    onChange={(e) => setLightingMood(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F5] border gold-hairline text-sm text-[#30272A] focus:outline-none focus:border-[#D4AF37]"
                  >
                    {LIGHTING_MOODS.map((mood) => (
                      <option key={mood} value={mood}>
                        {mood}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image Size Selector (1K, 2K, 4K) */}
                <div>
                  <span className="block text-xs font-semibold tracking-wide text-[#30272A] mb-2">
                    Output Resolution
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {RESOLUTIONS.map((res) => {
                      const active = imageSize === res.value;
                      return (
                        <button
                          key={res.value}
                          type="button"
                          onClick={() => setImageSize(res.value)}
                          className={`px-3 py-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                            active
                              ? "bg-[#30272A] text-[#FFF9F5] border-[#D4AF37]"
                              : "bg-[#F8E4EA]/45 text-[#30272A] gold-hairline hover:bg-[#F8E4EA]"
                          }`}
                          aria-pressed={active}
                        >
                          <div className="text-sm font-semibold tabular-nums">
                            {res.label}
                          </div>
                          <div
                            className={`text-[11px] truncate ${
                              active ? "text-[#F8E4EA]" : "text-[#67575C]"
                            }`}
                          >
                            {res.detail}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold tracking-wide text-[#30272A] mb-2">
                    Frame Aspect Ratio
                  </span>
                  <div className="flex items-center gap-2">
                    {ASPECT_RATIOS.map((ratio) => {
                      const active = aspectRatio === ratio;
                      return (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setAspectRatio(ratio)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors tabular-nums cursor-pointer ${
                            active
                              ? "bg-[#D4AF37] text-[#241C1E] border-[#B89228]"
                              : "bg-[#FFF9F5] text-[#30272A] gold-hairline hover:bg-[#F8E4EA]"
                          }`}
                          aria-pressed={active}
                        >
                          {ratio}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="custom-styling-notes"
                    className="block text-xs font-semibold tracking-wide text-[#30272A] mb-2"
                  >
                    Bespoke Room Notes (Optional)
                  </label>
                  <input
                    id="custom-styling-notes"
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. Wool area rug, olive tree, brass floor lamp"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F5] border gold-hairline text-sm text-[#30272A] placeholder:text-[#67575C]/65 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3.5 px-6 rounded-lg btn-royal-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-65 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rendering {imageSize} Interior...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      <span>Generate {imageSize} Room Render</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Preview Frame */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#FFF9F5] border gold-hairline rounded-2xl p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4 pb-4 border-b gold-hairline">
              <div>
                <p className="text-xs font-medium tracking-[0.08em] uppercase text-[#8A604B]">
                  Architectural Render Output
                </p>
                <p className="text-sm font-medium text-[#30272A] mt-0.5">
                  {renderedImage
                    ? `${renderedImage.furnitureName} · ${renderedImage.size} (${renderedImage.aspectRatio})`
                    : `${product.name} · Ready for ${imageSize} render`}
                </p>
              </div>
              {renderedImage && (
                <a
                  href={renderedImage.url}
                  download={`maison-rose-${product.id}-${renderedImage.size}.png`}
                  className="px-3.5 py-2 rounded-lg btn-ivory-gold text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Download {renderedImage.size}</span>
                </a>
              )}
            </div>

            <div className="relative mt-5 flex-1 min-h-[380px] rounded-xl overflow-hidden border gold-hairline pink-ivory-gradient flex items-center justify-center">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                  <p className="mt-4 font-display text-2xl text-[#30272A]">
                    Composing {imageSize} Architectural Light
                  </p>
                  <p className="mt-1.5 text-xs text-[#67575C] max-w-sm">
                    Rendering natural daylight reflections across {product.name}.
                  </p>
                </div>
              ) : errorMessage ? (
                <div className="max-w-md p-6 text-center">
                  <p className="font-display text-2xl text-[#30272A]">
                    Visualization Unavailable
                  </p>
                  <p className="mt-2 text-sm text-[#67575C] leading-relaxed">
                    {errorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="mt-5 px-4 py-2 rounded-lg btn-ivory-gold text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Retry Render</span>
                  </button>
                </div>
              ) : renderedImage ? (
                <img
                  src={renderedImage.url}
                  alt={`${renderedImage.furnitureName} visualized in ${roomStyle}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-8 text-center max-w-md">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-[#F8E4EA] border gold-hairline">
                    <ImageIcon className="w-5 h-5 text-[#8A604B]" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl text-[#30272A]">
                    Architectural Preview Canvas
                  </h3>
                  <p className="mt-2 text-sm text-[#67575C] leading-relaxed">
                    Select your preferred resolution (
                    <span className="font-semibold text-[#30272A]">1K</span>,{" "}
                    <span className="font-semibold text-[#30272A]">2K</span>, or{" "}
                    <span className="font-semibold text-[#30272A]">4K</span>) and
                    interior setting to preview this furniture piece in sunlit
                    architecture.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
