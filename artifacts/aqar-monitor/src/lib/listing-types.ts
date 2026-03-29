export type ListingTypeEntry = {
  value: string;
  label: string;
  short: string;
  color: string;
  group: string;
};

export const LISTING_TYPES: ListingTypeEntry[] = [
  { value: "sale",          label: "للبيع",           short: "بيع",      color: "#0F7BA0", group: "بيع" },
  { value: "installment",   label: "بيع بالتقسيط",    short: "تقسيط",    color: "#1565C0", group: "بيع" },
  { value: "auction",       label: "مزاد علني",        short: "مزاد",     color: "#C62828", group: "بيع" },
  { value: "rent",          label: "للإيجار",          short: "إيجار",    color: "#5B8DB8", group: "إيجار" },
  { value: "rent_annual",   label: "إيجار سنوي",       short: "سنوي",     color: "#4A7DA8", group: "إيجار" },
  { value: "rent_monthly",  label: "إيجار شهري",       short: "شهري",     color: "#3D6D98", group: "إيجار" },
  { value: "rent_daily",    label: "إيجار يومي",       short: "يومي",     color: "#7A9FCB", group: "إيجار" },
  { value: "rent_seasonal", label: "إيجار موسمي",      short: "موسمي",    color: "#6B8FBB", group: "إيجار" },
  { value: "investment",    label: "استثماري",          short: "استثمار",  color: "#D4A017", group: "استثماري / أخرى" },
  { value: "partnership",   label: "شراكة / مشاركة",  short: "شراكة",    color: "#8E44AD", group: "استثماري / أخرى" },
];

export const LISTING_TYPE_GROUPS = [
  { label: "بيع",               types: LISTING_TYPES.filter(t => t.group === "بيع") },
  { label: "إيجار",             types: LISTING_TYPES.filter(t => t.group === "إيجار") },
  { label: "استثماري / أخرى",  types: LISTING_TYPES.filter(t => t.group === "استثماري / أخرى") },
];

export const LISTING_TYPE_MAP: Record<string, string> = Object.fromEntries(
  LISTING_TYPES.map(t => [t.value, t.label])
);

export const LISTING_TYPE_SHORT_MAP: Record<string, string> = Object.fromEntries(
  LISTING_TYPES.map(t => [t.value, t.short])
);

export const LISTING_TYPE_COLOR_MAP: Record<string, string> = Object.fromEntries(
  LISTING_TYPES.map(t => [t.value, t.color])
);

export const LISTING_TYPE_VALUES = LISTING_TYPES.map(t => t.value) as [string, ...string[]];

export function getListingLabel(value: string): string {
  return LISTING_TYPE_MAP[value] ?? value;
}

export function getListingColor(value: string): string {
  return LISTING_TYPE_COLOR_MAP[value] ?? "#94A3B8";
}
