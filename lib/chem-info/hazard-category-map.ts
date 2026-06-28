/** Canonical hazard category codes (UPPERCASE) used in compatibility rules and chemical seed data. */
export const CANONICAL_HAZARD_CATEGORIES = [
  "ACID",
  "BASE",
  "OXIDIZER",
  "ORGANIC_SOLVENT",
  "FLAMMABLE_LIQUID",
  "CYANIDE",
  "SULFIDE",
  "NITRIC_ACID",
  "REACTIVE_METAL",
  "WATER",
  "WATER_REACTIVE",
  "ORGANIC",
  "ORGANIC_ACID",
  "ORGANIC_PEROXIDE",
  "AMMONIA",
  "HYPOCHLORITE",
  "HALOGENATED_SOLVENT",
  "TOXIC",
  "SALT",
  "CORROSIVE",
  "REDUCING_AGENT",
  "HALOGEN",
  "INERT_GAS",
  "PYROPHORIC",
  "AIR",
] as const;

export type CanonicalHazardCategory = (typeof CANONICAL_HAZARD_CATEGORIES)[number];

const LEGACY_ID_MAP: Record<string, string> = {
  reducer: "REDUCING_AGENT",
  flammable_solvent: "FLAMMABLE_LIQUID",
};

/** Normalize UI / legacy slug to canonical UPPERCASE id. */
export function normalizeGroupId(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (LEGACY_ID_MAP[lower]) return LEGACY_ID_MAP[lower];
  return trimmed.toUpperCase();
}

/** UI / legacy slug → canonical slug(s) for rule matching. */
export const CATEGORY_ALIASES: Record<string, readonly CanonicalHazardCategory[]> = {
  STRONG_ACID: ["ACID"],
  strong_acid: ["ACID"],
  WEAK_ACID: ["ACID"],
  weak_acid: ["ACID"],
  STRONG_BASE: ["BASE"],
  strong_base: ["BASE"],
  WEAK_BASE: ["BASE"],
  weak_base: ["BASE"],
  ACID: ["ACID"],
  acid: ["ACID"],
  BASE: ["BASE"],
  base: ["BASE"],
  OXIDIZER: ["OXIDIZER"],
  oxidizer: ["OXIDIZER"],
  REDUCING_AGENT: ["REDUCING_AGENT"],
  REDUCER: ["REDUCING_AGENT"],
  reducer: ["REDUCING_AGENT"],
  FLAMMABLE_LIQUID: ["FLAMMABLE_LIQUID"],
  flammable_solvent: ["FLAMMABLE_LIQUID"],
  ORGANIC_SOLVENT: ["ORGANIC_SOLVENT"],
  organic_solvent: ["ORGANIC_SOLVENT"],
  ORGANIC: ["ORGANIC"],
  organic: ["ORGANIC"],
  ORGANIC_ACID: ["ORGANIC_ACID"],
  organic_acid: ["ORGANIC_ACID"],
  REACTIVE_METAL: ["REACTIVE_METAL"],
  reactive_metal: ["REACTIVE_METAL"],
  WATER_REACTIVE: ["WATER_REACTIVE"],
  water_reactive: ["WATER_REACTIVE"],
  WATER: ["WATER"],
  water: ["WATER"],
  ORGANIC_PEROXIDE: ["ORGANIC_PEROXIDE"],
  organic_peroxide: ["ORGANIC_PEROXIDE"],
  CYANIDE: ["CYANIDE"],
  cyanide: ["CYANIDE"],
  SULFIDE: ["SULFIDE"],
  sulfide: ["SULFIDE"],
  NITRIC_ACID: ["NITRIC_ACID"],
  nitric_acid: ["NITRIC_ACID"],
  HALOGENATED_SOLVENT: ["HALOGENATED_SOLVENT"],
  halogenated_solvent: ["HALOGENATED_SOLVENT"],
  HALOGEN: ["HALOGEN"],
  halogen: ["HALOGEN"],
  AMMONIA: ["AMMONIA"],
  ammonia: ["AMMONIA"],
  HYPOCHLORITE: ["HYPOCHLORITE"],
  hypochlorite: ["HYPOCHLORITE"],
  BLEACH: ["HYPOCHLORITE"],
  bleach: ["HYPOCHLORITE"],
  TOXIC: ["TOXIC"],
  toxic: ["TOXIC"],
  SALT: ["SALT"],
  salt: ["SALT"],
  CORROSIVE: ["CORROSIVE"],
  corrosive: ["CORROSIVE"],
  INERT_GAS: ["INERT_GAS"],
  inert_gas: ["INERT_GAS"],
  PYROPHORIC: ["PYROPHORIC"],
  pyrophoric: ["PYROPHORIC"],
  AIR: ["AIR"],
  air: ["AIR"],
};

const CATEGORY_LABELS_VI: Record<string, string> = {
  STRONG_ACID: "Acid mạnh",
  WEAK_ACID: "Acid yếu",
  STRONG_BASE: "Base mạnh",
  WEAK_BASE: "Base yếu",
  ACID: "Acid",
  BASE: "Base",
  OXIDIZER: "Chất oxy hóa",
  REDUCING_AGENT: "Chất khử",
  FLAMMABLE_LIQUID: "Dung môi dễ cháy",
  ORGANIC_SOLVENT: "Dung môi hữu cơ",
  ORGANIC: "Hợp chất hữu cơ",
  ORGANIC_ACID: "Acid hữu cơ",
  REACTIVE_METAL: "Kim loại hoạt động",
  WATER_REACTIVE: "Phản ứng với nước",
  WATER: "Nước / dung dịch aqueous",
  ORGANIC_PEROXIDE: "Peroxide hữu cơ",
  CYANIDE: "Cyanide",
  SULFIDE: "Sulfide",
  NITRIC_ACID: "Acid nitric",
  HALOGENATED_SOLVENT: "Dung môi halogen",
  HALOGEN: "Halogen",
  AMMONIA: "Ammonia / ammonium",
  HYPOCHLORITE: "Bleach / hypochlorite",
  TOXIC: "Độc hại",
  SALT: "Muối",
  CORROSIVE: "Ăn mòn",
  INERT_GAS: "Khí trơ",
  PYROPHORIC: "Pyrophoric",
  AIR: "Không khí / oxy",
};

/** Dropdown options for compatibility checker (UI ids are UPPERCASE codes). */
export const HAZARD_CATEGORY_OPTIONS = [
  { id: "STRONG_ACID", label: "Acid mạnh" },
  { id: "STRONG_BASE", label: "Base mạnh" },
  { id: "WEAK_ACID", label: "Acid yếu" },
  { id: "WEAK_BASE", label: "Base yếu" },
  { id: "ACID", label: "Acid" },
  { id: "BASE", label: "Base" },
  { id: "OXIDIZER", label: "Chất oxy hóa" },
  { id: "REDUCING_AGENT", label: "Chất khử" },
  { id: "FLAMMABLE_LIQUID", label: "Dung môi dễ cháy" },
  { id: "ORGANIC_SOLVENT", label: "Dung môi hữu cơ" },
  { id: "ORGANIC_ACID", label: "Acid hữu cơ" },
  { id: "REACTIVE_METAL", label: "Kim loại hoạt động" },
  { id: "WATER_REACTIVE", label: "Phản ứng với nước" },
  { id: "WATER", label: "Nước / aqueous" },
  { id: "ORGANIC_PEROXIDE", label: "Peroxide hữu cơ" },
  { id: "CYANIDE", label: "Cyanide" },
  { id: "SULFIDE", label: "Sulfide" },
  { id: "NITRIC_ACID", label: "Acid nitric" },
  { id: "HYPOCHLORITE", label: "Bleach / hypochlorite" },
  { id: "AMMONIA", label: "Ammonia / ammonium" },
  { id: "HALOGEN", label: "Halogen" },
  { id: "INERT_GAS", label: "Khí trơ" },
  { id: "PYROPHORIC", label: "Pyrophoric" },
  { id: "AIR", label: "Không khí / oxy" },
] as const;

export type HazardCategoryOptionId = (typeof HAZARD_CATEGORY_OPTIONS)[number]["id"];

export function resolveCategorySlug(slug: string): CanonicalHazardCategory[] {
  const normalized = normalizeGroupId(slug);
  if (!normalized) return [];

  const mapped =
    CATEGORY_ALIASES[normalized] ??
    CATEGORY_ALIASES[slug.trim().toLowerCase()] ??
    CATEGORY_ALIASES[slug.trim()];
  if (mapped?.length) return [...mapped];

  if ((CANONICAL_HAZARD_CATEGORIES as readonly string[]).includes(normalized)) {
    return [normalized as CanonicalHazardCategory];
  }
  return [];
}

export function expandCategorySlugs(slugs: string[]): CanonicalHazardCategory[] {
  const out = new Set<CanonicalHazardCategory>();
  for (const slug of slugs) {
    for (const canonical of resolveCategorySlug(slug)) {
      out.add(canonical);
    }
  }
  return [...out];
}

export function getCategoryLabel(slug: string): string {
  const normalized = normalizeGroupId(slug);
  return CATEGORY_LABELS_VI[normalized] ?? slug;
}
