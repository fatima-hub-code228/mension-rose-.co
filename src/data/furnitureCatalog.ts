export type FurnitureCategory =
  | "All"
  | "Beds"
  | "Sofas"
  | "Chairs"
  | "Dining Sets"
  | "Wardrobes"
  | "Dressing Tables"
  | "Coffee Tables"
  | "TV Consoles"
  | "Office Furniture"
  | "Recliners"
  | "Cabinets"
  | "Side Tables";

export interface FurnitureDemoItem {
  id: string;
  name: string;
  category: Exclude<FurnitureCategory, "All">;
  demoLabel: "Showroom Demo Item";
  photoUrl: string;
  photoAlt: string;
  modelUrl: string | null;
  assetSourceNote: string;
  description: string;
  verifiedMaterials: string;
  supports3D: boolean;
  supportsDoors: boolean;
  supportsDrawers: boolean;
  supportsCushionRemoval: boolean;
  supportsMattressLift: boolean;
  supportsVariants: boolean;
  mechanicSummary: string;
}

export const CATEGORIES: FurnitureCategory[] = [
  "All",
  "Beds",
  "Sofas",
  "Chairs",
  "Dining Sets",
  "Wardrobes",
  "Dressing Tables",
  "Coffee Tables",
  "TV Consoles",
  "Office Furniture",
  "Recliners",
  "Cabinets",
  "Side Tables",
];

export const FURNITURE_CATALOG: FurnitureDemoItem[] = [
  {
    id: "demo-bed-01",
    name: "Carved Timber & Tufted Bed (Demo Item)",
    category: "Beds",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/cat_bed_luxury_1795001726237.jpg",
    photoAlt:
      "Carved solid timber and upholstered bed with ivory linen bedding in a sunlit luxury bedroom",
    modelUrl: "/src/assets/models/GothicBed_01/GothicBed_01_1k.gltf",
    assetSourceNote: "Verified 3D Asset: Poly Haven GothicBed_01 (CC0 GLTF)",
    description:
      "Architectural carved hardwood bed frame with sculpted headboard and draped linen bedding shown in natural morning light.",
    verifiedMaterials: "PBR textures embedded in 3D GLTF asset (Carved Timber & Linen)",
    supports3D: true,
    supportsDoors: false,
    supportsDrawers: false,
    supportsCushionRemoval: false,
    supportsMattressLift: false,
    supportsVariants: false,
    mechanicSummary:
      "360° orbit, zoom, and underside frame inspection (this unified 3D mesh does not include a hydraulic lift mechanism).",
  },
  {
    id: "demo-sofa-velvet",
    name: "Velvet Curved Salon Sofa (Demo Item)",
    category: "Sofas",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/cat_sofa_luxury_1795001727053.jpg",
    photoAlt:
      "Tailored curved velvet sofa with throw pillows on herringbone oak flooring in a sunlit salon",
    modelUrl: "/src/assets/models/glb/GlamVelvetSofa.glb",
    assetSourceNote: "Verified 3D Asset: Khronos GlamVelvetSofa (CC-BY GLB)",
    description:
      "Curved salon sofa with tailored velvet upholstery, solid wood legs, and metallic feet gliders.",
    verifiedMaterials:
      "Built-in GLB PBR variants: Champagne, Pale Pink, Navy, Gray, and Black Velvet",
    supports3D: true,
    supportsDoors: false,
    supportsDrawers: false,
    supportsCushionRemoval: false,
    supportsMattressLift: false,
    supportsVariants: true,
    mechanicSummary:
      "360° orbit, zoom, underside leg/frame inspection, and 5 genuine GLB material variants.",
  },
  {
    id: "demo-sofa-cushions",
    name: "Carved Wood & Cushion Sofa (Demo Item)",
    category: "Sofas",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/hero_showroom_atelier_1795001002715.jpg",
    photoAlt:
      "Sculptural showroom sofa in a sunlit limestone and blush plaster architectural salon",
    modelUrl: "/src/assets/models/glb/SheenWoodLeatherSofa.glb",
    assetSourceNote: "Verified 3D Asset: Khronos SheenWoodLeatherSofa (CC-BY GLB)",
    description:
      "Carved hardwood sofa frame with separate patterned throw cushions, seat cushions, and woven fringe trim.",
    verifiedMaterials:
      "Embedded GLB PBR wood frame, leather/fabric cushions, and woven upholstery",
    supports3D: true,
    supportsDoors: false,
    supportsDrawers: false,
    supportsCushionRemoval: true,
    supportsMattressLift: false,
    supportsVariants: false,
    mechanicSummary:
      "360° orbit, zoom, underside inspection, and removable separate GLB cushion & pillow meshes.",
  },
  {
    id: "demo-chair-01",
    name: "Sculpted Velvet Accent Chair (Demo Item)",
    category: "Chairs",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/cat_chair_luxury_1795001726328.jpg",
    photoAlt:
      "Upholstered velvet accent lounge chair with walnut frame beside a sunlit window",
    modelUrl: "/src/assets/models/glb/SheenChair.glb",
    assetSourceNote: "Verified 3D Asset: Khronos SheenChair (CC-BY GLB)",
    description:
      "Upholstered lounge chair featuring contoured fabric sheen, solid wood legs, metal brackets, and underside maker's label.",
    verifiedMaterials:
      "Built-in GLB PBR variants: Mango Velvet & Peacock Velvet with Wood & Metal",
    supports3D: true,
    supportsDoors: false,
    supportsDrawers: false,
    supportsCushionRemoval: false,
    supportsMattressLift: false,
    supportsVariants: true,
    mechanicSummary:
      "360° orbit, zoom, underside label & bracket inspection, and genuine GLB velvet variants.",
  },
  {
    id: "demo-dining-01",
    name: "Solid Timber Architectural Dining Table (Demo Item)",
    category: "Dining Sets",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/cat_dining_set_1795001727209.jpg",
    photoAlt:
      "Solid walnut architectural dining table with upholstered chairs in a sunlit dining room",
    modelUrl: "/src/assets/models/WoodenTable_01/WoodenTable_01_1k.gltf",
    assetSourceNote: "Verified 3D Asset: Poly Haven WoodenTable_01 (CC0 GLTF)",
    description:
      "Classic solid timber dining table with beveled plank tabletop and tapered joinery legs.",
    verifiedMaterials: "PBR wood grain & roughness maps embedded in GLTF asset",
    supports3D: true,
    supportsDoors: false,
    supportsDrawers: false,
    supportsCushionRemoval: false,
    supportsMattressLift: false,
    supportsVariants: false,
    mechanicSummary: "360° orbit, zoom, and underside stretcher joinery inspection.",
  },
  {
    id: "demo-wardrobe-01",
    name: "Four-Door Architectural Wardrobe (Demo Item)",
    category: "Wardrobes",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/cat_wardrobe_luxury_1795001728357.jpg",
    photoAlt:
      "Tall bespoke solid wood four-door paneled wardrobe armoire in a sunlit dressing suite",
    modelUrl: "/src/assets/models/GothicCabinet_01/GothicCabinet_01_1k.gltf",
    assetSourceNote: "Verified 3D Asset: Poly Haven GothicCabinet_01 (CC0 GLTF)",
    description:
      "Full-height paneled timber armoire wardrobe featuring four individually hinged cabinet doors.",
    verifiedMaterials: "Carved hardwood & iron hardware PBR maps from GLTF asset",
    supports3D: true,
    supportsDoors: true,
    supportsDrawers: false,
    supportsCushionRemoval: false,
    supportsMattressLift: false,
    supportsVariants: false,
    mechanicSummary:
      "360° orbit, zoom, underside inspection, and 4 hinged opening GLTF doors.",
  },
  {
    id: "demo-dressing-01",
    name: "Multi-Drawer Dressing Table (Demo Item)",
    category: "Dressing Tables",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/cat_dressing_table_1795001728283.jpg",
    photoAlt:
      "Wooden dressing vanity table with brass drawer pulls, mirror, and boucle stool in sunlit suite",
    modelUrl: "/src/assets/models/WoodenTable_03/WoodenTable_03_1k.gltf",
    assetSourceNote: "Verified 3D Asset: Poly Haven WoodenTable_03 (CC0 GLTF)",
    description:
      "Artisanal solid wood vanity and dressing desk fitted with four sliding drawers and a hinged side compartment door.",
    verifiedMaterials: "Aged timber & iron hardware PBR maps from GLTF asset",
    supports3D: true,
    supportsDoors: true,
    supportsDrawers: true,
    supportsCushionRemoval: false,
    supportsMattressLift: false,
    supportsVariants: false,
    mechanicSummary:
      "360° orbit, zoom, underside inspection, 4 sliding drawers, and 1 hinged door.",
  },
  {
    id: "demo-coffee-01",
    name: "Round Timber Coffee Table (Demo Item)",
    category: "Coffee Tables",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/cat_coffee_table_1795001729026.jpg",
    photoAlt:
      "Round travertine and timber coffee table styled on a natural wool rug in a sunlit living room",
    modelUrl:
      "/src/assets/models/coffee_table_round_01/coffee_table_round_01_1k.gltf",
    assetSourceNote:
      "Verified 3D Asset: Poly Haven coffee_table_round_01 (CC0 GLTF)",
    description:
      "Circular center coffee table with lower display shelf and sculpted turned legs.",
    verifiedMaterials: "Natural wood grain & normal maps embedded in GLTF asset",
    supports3D: true,
    supportsDoors: false,
    supportsDrawers: false,
    supportsCushionRemoval: false,
    supportsMattressLift: false,
    supportsVariants: false,
    mechanicSummary: "360° orbit, zoom, and underside pedestal joinery inspection.",
  },
  {
    id: "demo-tv-console-01",
    name: "Three-Tier Media TV Console (Demo Item)",
    category: "TV Consoles",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/cat_tv_console_1795001729065.jpg",
    photoAlt:
      "Low architectural dark walnut media TV console with paneled doors and brass hardware",
    modelUrl: "/src/assets/models/GothicCommode_01/GothicCommode_01_1k.gltf",
    assetSourceNote: "Verified 3D Asset: Poly Haven GothicCommode_01 (CC0 GLTF)",
    description:
      "Architectural storage console featuring three full-width pull-out compartments and carved trim.",
    verifiedMaterials: "Hardwood & forged metal hardware PBR maps from GLTF asset",
    supports3D: true,
    supportsDoors: false,
    supportsDrawers: true,
    supportsCushionRemoval: false,
    supportsMattressLift: false,
    supportsVariants: false,
    mechanicSummary:
      "360° orbit, zoom, underside inspection, and 3 sliding GLTF drawer tiers.",
  },
  {
    id: "demo-office-01",
    name: "Architectural Console Study Desk (Demo Item)",
    category: "Office Furniture",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/cat_office_desk_1795001729114.jpg",
    photoAlt:
      "Solid walnut executive office desk with leather blotter and tailored chair in sunlit study",
    modelUrl: "/src/assets/models/ClassicConsole_01/ClassicConsole_01_1k.gltf",
    assetSourceNote: "Verified 3D Asset: Poly Haven ClassicConsole_01 (CC0 GLTF)",
    description:
      "Architectural study console table with turned legs, carved apron molding, and stretcher rails.",
    verifiedMaterials: "Turned hardwood PBR maps embedded in GLTF asset",
    supports3D: true,
    supportsDoors: false,
    supportsDrawers: false,
    supportsCushionRemoval: false,
    supportsMattressLift: false,
    supportsVariants: false,
    mechanicSummary: "360° orbit, zoom, and underside apron & stretcher inspection.",
  },
  {
    id: "demo-recliner-01",
    name: "Full-Grain Leather Lounge Recliner (Demo Item)",
    category: "Recliners",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/cat_recliner_luxury_1795001730074.jpg",
    photoAlt:
      "Tailored cognac saddle leather lounge recliner and ottoman in a sunlit limestone reading corner",
    modelUrl: null,
    assetSourceNote: "Interactive 3D GLB/GLTF asset not yet available",
    description:
      "Tufted full-grain leather lounge recliner and matching ottoman photographed in natural daylight.",
    verifiedMaterials: "Photography preview only — 3D recliner mesh in preparation",
    supports3D: false,
    supportsDoors: false,
    supportsDrawers: false,
    supportsCushionRemoval: false,
    supportsMattressLift: false,
    supportsVariants: false,
    mechanicSummary:
      "Interactive 3D model is not yet available for this piece. High-resolution showroom photography is presented.",
  },
  {
    id: "demo-cabinet-01",
    name: "Double-Door & Drawer Gallery Cabinet (Demo Item)",
    category: "Cabinets",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/cat_cabinet_luxury_1795001731090.jpg",
    photoAlt:
      "Heirloom solid wood storage cabinet with paneled doors and drawers in a sunlit limestone gallery",
    modelUrl: "/src/assets/models/chinese_cabinet/chinese_cabinet_1k.gltf",
    assetSourceNote: "Verified 3D Asset: Poly Haven chinese_cabinet (CC0 GLTF)",
    description:
      "Tall heirloom storage cabinet combining two hinged upper doors with two lower sliding drawers and brass hardware.",
    verifiedMaterials: "Lacquered hardwood & brass fittings PBR maps from GLTF asset",
    supports3D: true,
    supportsDoors: true,
    supportsDrawers: true,
    supportsCushionRemoval: false,
    supportsMattressLift: false,
    supportsVariants: false,
    mechanicSummary:
      "360° orbit, zoom, underside inspection, 2 hinged doors, and 2 sliding drawers.",
  },
  {
    id: "demo-side-table-01",
    name: "Classic Timber Bedside Side Table (Demo Item)",
    category: "Side Tables",
    demoLabel: "Showroom Demo Item",
    photoUrl: "/src/assets/images/cat_side_table_1795001731164.jpg",
    photoAlt:
      "Solid walnut bedside side table nightstand with drawer and ceramic lamp beside linen drapery",
    modelUrl:
      "/src/assets/models/ClassicNightstand_01/ClassicNightstand_01_1k.gltf",
    assetSourceNote:
      "Verified 3D Asset: Poly Haven ClassicNightstand_01 (CC0 GLTF)",
    description:
      "Compact bedside and lounge side table with sculpted molding, lower shelf, and tapered legs.",
    verifiedMaterials: "Hardwood & brass pull PBR maps embedded in GLTF asset",
    supports3D: true,
    supportsDoors: false,
    supportsDrawers: false,
    supportsCushionRemoval: false,
    supportsMattressLift: false,
    supportsVariants: false,
    mechanicSummary: "360° orbit, zoom, and underside frame inspection.",
  },
];
