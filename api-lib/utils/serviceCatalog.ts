/**
 * DBC customer-facing service catalog — the single reference for:
 *   - the 23 active services (exact labels and order are a product decision; do not edit casually),
 *   - search synonyms used to resolve free text to services,
 *   - the catalog migration plan (prisma/migrate_service_catalog.ts).
 *
 * This file intentionally has NO imports so the migration script can load it
 * directly with `node --experimental-strip-types`.
 *
 * Slugs reuse the existing `service_categories.slug` values where a category
 * already existed, so existing URLs, provider links and seed references keep working.
 */

export type Workforce = 'WHITE_COLLAR' | 'BLUE_COLLAR';

export interface CatalogService {
  /** Stable slug stored in service_categories.slug. */
  slug: string;
  /** Exact customer-facing label stored in service_categories.name. */
  label: string;
  workforce: Workforce;
  /** 1-based order inside its workforce group (service_categories.display_order). */
  order: number;
  /** Other slugs that refer to the same service (older seeds, duplicates). */
  aliasSlugs?: string[];
  /** Search terms, aliases and common spellings. */
  synonyms: string[];
}

export const SERVICE_CATALOG: readonly CatalogService[] = [
  // White-collar — design, consultancy, engineering, project management
  { slug: 'vastu-consultant', label: 'Vastu', workforce: 'WHITE_COLLAR', order: 1, aliasSlugs: ['vastu'], synonyms: ['vastu consultant', 'vasthu', 'vaastu', 'vastu shastra', 'vastu expert'] },
  { slug: 'architect', label: 'Architect', workforce: 'WHITE_COLLAR', order: 2, aliasSlugs: ['architecture'], synonyms: ['architecture', 'architectural design', 'building design', 'house plan', 'floor plan', 'elevation design', 'blueprint'] },
  { slug: 'interior-designer', label: 'Interior Designer', workforce: 'WHITE_COLLAR', order: 3, aliasSlugs: ['interior-design'], synonyms: ['interior', 'interiors', 'interior design', 'interior decorator', 'home decor', 'modular kitchen', 'wardrobe design'] },
  { slug: 'structural-engineer', label: 'Structured Engineer', workforce: 'WHITE_COLLAR', order: 4, synonyms: ['structural engineer', 'structural', 'structural design', 'structure design', 'structural consultant', 'rcc design'] },
  { slug: 'project-management', label: 'Project Management', workforce: 'WHITE_COLLAR', order: 5, synonyms: ['project manager', 'project management consultant', 'pmc', 'construction management', 'site supervision', 'site supervisor'] },
  { slug: 'quantity-surveyor', label: 'Quantity Surveyor', workforce: 'WHITE_COLLAR', order: 6, synonyms: ['quantity survey', 'qs', 'cost estimation', 'estimation', 'boq', 'bill of quantities', 'costing'] },
  { slug: 'quality-controller', label: 'Quality Controller', workforce: 'WHITE_COLLAR', order: 7, synonyms: ['quality control', 'quality check', 'quality inspection', 'qa qc', 'qc engineer', 'site inspection'] },
  { slug: 'landscape-designer', label: 'Landscape Engineer', workforce: 'WHITE_COLLAR', order: 8, synonyms: ['landscape', 'landscape designer', 'landscaping', 'garden design', 'terrace garden', 'lawn'] },
  { slug: 'geotechnical', label: 'Geotechnical', workforce: 'WHITE_COLLAR', order: 9, synonyms: ['geotechnical engineer', 'geotech', 'soil test', 'soil testing', 'soil investigation', 'foundation investigation'] },

  // Blue-collar — skilled construction trades
  { slug: 'carpentry', label: 'Carpenter', workforce: 'BLUE_COLLAR', order: 1, aliasSlugs: ['carpenter'], synonyms: ['carpentry', 'wood work', 'woodwork', 'furniture', 'wooden'] },
  { slug: 'painting', label: 'Painter', workforce: 'BLUE_COLLAR', order: 2, aliasSlugs: ['painter'], synonyms: ['painting', 'paint', 'wall painting', 'texture painting', 'putty'] },
  { slug: 'false-ceiling', label: 'Fall Ceiling', workforce: 'BLUE_COLLAR', order: 3, aliasSlugs: ['fall-ceiling'], synonyms: ['false ceiling', 'fall ceiling', 'ceiling', 'gypsum', 'gypsum ceiling', 'pop', 'pop ceiling', 'grid ceiling'] },
  { slug: 'granite-mason', label: 'Granite Mason', workforce: 'BLUE_COLLAR', order: 4, synonyms: ['granite', 'granite fitting', 'granite installation', 'marble', 'stone work', 'kitchen platform'] },
  { slug: 'waterproofing', label: 'Water Proofing', workforce: 'BLUE_COLLAR', order: 5, aliasSlugs: ['water-proofing'], synonyms: ['waterproofing', 'waterproof', 'leak protection', 'water leak', 'leakage', 'leak', 'seepage', 'damp', 'dampness', 'terrace leak'] },
  { slug: 'pest-control', label: 'Pest Control', workforce: 'BLUE_COLLAR', order: 6, synonyms: ['pest', 'termite', 'anti termite', 'cockroach', 'rodent', 'bed bug'] },
  { slug: 'door-fitter', label: 'Door Fitter', workforce: 'BLUE_COLLAR', order: 7, synonyms: ['door', 'door fitting', 'door installation', 'door frame', 'shutter fitting'] },
  { slug: 'plumbing', label: 'Plumber', workforce: 'BLUE_COLLAR', order: 8, aliasSlugs: ['plumber'], synonyms: ['plumbing', 'pipe', 'pipeline', 'tap', 'sanitary', 'bathroom fitting', 'drainage'] },
  { slug: 'electrical', label: 'Electrician', workforce: 'BLUE_COLLAR', order: 9, aliasSlugs: ['electrician'], synonyms: ['electrical', 'electric', 'electric work', 'wiring', 'rewiring', 'switch board', 'lighting'] },
  { slug: 'tiles', label: 'Tiles Mason', workforce: 'BLUE_COLLAR', order: 10, aliasSlugs: ['tiles-mason'], synonyms: ['tiles', 'tile', 'tiling', 'tile fitting', 'flooring', 'wall tiles', 'floor tiles'] },
  { slug: 'masonry', label: 'Brick Mason', workforce: 'BLUE_COLLAR', order: 11, aliasSlugs: ['brick-mason'], synonyms: ['brick', 'brick work', 'brickwork', 'masonry', 'bricklayer', 'plastering', 'block work'] },
  { slug: 'farm-work-centering', label: 'Farm Work/Centering', workforce: 'BLUE_COLLAR', order: 12, synonyms: ['formwork', 'form work', 'farm work', 'centering', 'centring', 'shuttering', 'slab shuttering'] },
  { slug: 'glass-worker', label: 'Glass Worker', workforce: 'BLUE_COLLAR', order: 13, synonyms: ['glass', 'glass work', 'glazing', 'toughened glass', 'glass partition', 'mirror'] },
  { slug: 'upvc', label: 'UPVC', workforce: 'BLUE_COLLAR', order: 14, synonyms: ['upvc windows', 'upvc doors', 'pvc doors', 'pvc windows', 'pvc', 'u pvc', 'windows'] },
];

/** Former customer-facing services that are retired (kept, never deleted). */
export const RETIRED_SLUGS: readonly string[] = ['ac-repair', 'cctv-installation', 'cleaning', 'civil-engineer'];

const WORKFORCE_RANK: Record<string, number> = { WHITE_COLLAR: 0, BLUE_COLLAR: 1 };

/* ------------------------------------------------------------------ */
/* Text normalization                                                 */
/* ------------------------------------------------------------------ */

/** Whole-word stop words. Never applied inside words. */
export const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'for', 'in', 'at', 'on', 'near', 'by', 'with', 'from',
  'i', 'me', 'my', 'we', 'our', 'need', 'needed', 'needs', 'want', 'wanted', 'looking', 'find', 'get',
  'some', 'someone', 'any', 'good', 'best', 'top', 'expert', 'experts', 'professional', 'professionals',
  'service', 'services', 'please', 'urgent', 'under', 'below', 'less', 'than', 'within', 'around',
  'verified', 'certified', 'approved', 'year', 'years', 'yr', 'yrs', 'experience', 'experienced',
  'lakh', 'lakhs', 'lac', 'lacs', 'rs', 'inr',
]);

/** Words too generic to identify a service on their own ("granite work" must not match Farm Work). */
const GENERIC_WORDS = new Set([
  'work', 'works', 'worker', 'workers', 'job', 'contractor', 'contractors', 'specialist', 'company',
  'repair', 'repairs', 'installation', 'install', 'fitting', 'fitter', 'design', 'designer', 'consultant',
  'engineer', 'engineering', 'mason', 'home', 'house', 'new', 'old',
]);

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Light singularization for common English plurals (tiles → tile, ceilings → ceiling). */
export function singularize(word: string): string {
  if (word.length <= 3 || word.endsWith('ss')) return word;
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (/(ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('us') && !word.endsWith('is')) return word.slice(0, -1);
  return word;
}

/** Normalized, singularized tokens with whole-word stop words removed. */
export function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter((t) => t && !STOP_WORDS.has(t) && !/^\d+$/.test(t))
    .map(singularize);
}

/** Levenshtein distance with an early exit above `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/* ------------------------------------------------------------------ */
/* Resolver                                                           */
/* ------------------------------------------------------------------ */

export interface ServiceMatch {
  service: CatalogService;
  /** 100 exact · 90 phrase · 70 word · 50 prefix · 40 spelling variant */
  score: number;
}

interface IndexedService {
  service: CatalogService;
  phrases: string[][];
}

const INDEX: IndexedService[] = SERVICE_CATALOG.map((service) => {
  const raw = [service.label, service.slug.replace(/-/g, ' '), ...(service.aliasSlugs ?? []).map((s) => s.replace(/-/g, ' ')), ...service.synonyms];
  const phrases = raw.map((p) => normalizeText(p).split(' ').filter(Boolean).map(singularize)).filter((p) => p.length);
  return { service, phrases };
});

const containsSequence = (hay: string[], needle: string[]) => {
  if (!needle.length || needle.length > hay.length) return false;
  for (let i = 0; i + needle.length <= hay.length; i++) {
    if (needle.every((t, k) => hay[i + k] === t)) return true;
  }
  return false;
};

function scoreService(entry: IndexedService, tokens: string[]): number {
  // Generic words ("work", "mason") only count when the query has nothing more specific.
  const specific = tokens.filter((t) => t.length >= 2 && !GENERIC_WORDS.has(t));
  const significant = specific.length ? specific : tokens.filter((t) => t.length >= 3);
  let best = 0;
  for (const phrase of entry.phrases) {
    if (phrase.join(' ') === tokens.join(' ')) return 100;
    // A multi-word catalog phrase inside the query ("water leak protection" ⊃ "leak protection"),
    // or the whole query inside a catalog phrase ("brick work" ⊂ ... ).
    if ((phrase.length > 1 && containsSequence(tokens, phrase)) || (tokens.length > 1 && containsSequence(phrase, tokens))) {
      best = Math.max(best, 90);
      continue;
    }
    for (const q of significant) {
      for (const p of phrase) {
        if (GENERIC_WORDS.has(p) && phrase.length > 1 && specific.length) continue;
        if (q === p) best = Math.max(best, 70);
        else if (q.length >= 3 && p.startsWith(q)) best = Math.max(best, 50);
        else if (q.length >= 5 && p.length >= 5) {
          const allowed = q.length >= 8 ? 2 : 1;
          if (editDistance(q, p, allowed) <= allowed) best = Math.max(best, 40);
        }
      }
    }
  }
  return best;
}

/**
 * Resolve free text to catalog services, best first.
 * Only weak (prefix / spelling) matches are dropped when a strong match exists,
 * so "interior" → Interior Designer, "electrical work" → Electrician, "mason" → all masons.
 */
export function resolveServices(query: string, options: { limit?: number; workforce?: Workforce } = {}): ServiceMatch[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  let matches = INDEX.filter((e) => !options.workforce || e.service.workforce === options.workforce)
    .map((e) => ({ service: e.service, score: scoreService(e, tokens) }))
    .filter((m) => m.score > 0);
  const top = Math.max(0, ...matches.map((m) => m.score));
  if (top >= 70) matches = matches.filter((m) => m.score >= 70 || m.score >= top - 20);
  matches.sort((a, b) => b.score - a.score || compareCatalogOrder(a.service, b.service));
  return options.limit ? matches.slice(0, options.limit) : matches;
}

export function findCatalogService(slugOrLabel: string): CatalogService | undefined {
  const key = normalizeText(slugOrLabel);
  return SERVICE_CATALOG.find(
    (s) => s.slug === slugOrLabel || normalizeText(s.label) === key || (s.aliasSlugs ?? []).includes(slugOrLabel),
  );
}

export function compareCatalogOrder(a: { workforce: string; order: number }, b: { workforce: string; order: number }) {
  return (WORKFORCE_RANK[a.workforce] ?? 9) - (WORKFORCE_RANK[b.workforce] ?? 9) || a.order - b.order;
}

/** Sort DB category rows: white-collar first, then display order, then name. */
export function sortCategoriesForDisplay<T extends { categoryType: string; displayOrder: number; name: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      (WORKFORCE_RANK[a.categoryType] ?? 9) - (WORKFORCE_RANK[b.categoryType] ?? 9) ||
      a.displayOrder - b.displayOrder ||
      a.name.localeCompare(b.name),
  );
}

/* ------------------------------------------------------------------ */
/* Migration planner (pure — used by prisma/migrate_service_catalog.ts) */
/* ------------------------------------------------------------------ */

export interface ExistingCategoryRow {
  id: number;
  name: string;
  slug: string;
  categoryType: string;
  workforceTypeId: string | null;
  isActive: boolean;
  deletedAt: Date | string | null;
  displayOrder: number;
  providerCount: number;
}

export type PlanAction =
  | { kind: 'UPDATE'; id: number; slug: string; from: Partial<ExistingCategoryRow>; to: { name: string; categoryType: Workforce; displayOrder: number; isActive: true }; providerCount: number }
  | { kind: 'UNCHANGED'; id: number; slug: string; name: string; providerCount: number }
  | { kind: 'CREATE'; slug: string; name: string; categoryType: Workforce; displayOrder: number }
  | { kind: 'MERGE_DUPLICATE'; id: number; slug: string; name: string; intoId: number; intoSlug: string; providerCount: number; /** set when the duplicate holds the label the canonical row needs */ renameTo?: string }
  | { kind: 'RETIRE'; id: number; slug: string; name: string; reason: 'retired' | 'not-in-catalog'; providerCount: number }
  | { kind: 'ALREADY_RETIRED'; id: number; slug: string; name: string; providerCount: number };

export interface CatalogPlan {
  actions: PlanAction[];
  /** Blocking problems; the migration must not be applied while any exist. */
  conflicts: string[];
}

export function planCatalogMigration(existing: ExistingCategoryRow[]): CatalogPlan {
  const actions: PlanAction[] = [];
  const conflicts: string[] = [];
  const bySlug = new Map(existing.map((r) => [r.slug, r]));
  const byName = new Map(existing.map((r) => [normalizeText(r.name), r]));
  const claimed = new Set<number>();

  for (const svc of SERVICE_CATALOG) {
    const candidates = [svc.slug, ...(svc.aliasSlugs ?? [])].map((s) => bySlug.get(s)).filter((r): r is ExistingCategoryRow => !!r);
    const byLabel = byName.get(normalizeText(svc.label));
    if (byLabel && !candidates.includes(byLabel)) candidates.push(byLabel);
    // Canonical row: the catalog slug if present, else the first alias / label match.
    const canonical = candidates.find((r) => r.slug === svc.slug) ?? candidates[0];

    if (!canonical) {
      actions.push({ kind: 'CREATE', slug: svc.slug, name: svc.label, categoryType: svc.workforce, displayOrder: svc.order });
      continue;
    }
    if (claimed.has(canonical.id)) {
      conflicts.push(`Category #${canonical.id} (${canonical.slug}) matches more than one catalog service.`);
      continue;
    }
    claimed.add(canonical.id);

    const needsUpdate =
      canonical.name !== svc.label ||
      canonical.categoryType !== svc.workforce ||
      canonical.displayOrder !== svc.order ||
      !canonical.isActive ||
      canonical.deletedAt !== null;
    if (needsUpdate) {
      actions.push({
        kind: 'UPDATE',
        id: canonical.id,
        slug: canonical.slug,
        from: { name: canonical.name, categoryType: canonical.categoryType, displayOrder: canonical.displayOrder, isActive: canonical.isActive },
        to: { name: svc.label, categoryType: svc.workforce, displayOrder: svc.order, isActive: true },
        providerCount: canonical.providerCount,
      });
    } else {
      actions.push({ kind: 'UNCHANGED', id: canonical.id, slug: canonical.slug, name: canonical.name, providerCount: canonical.providerCount });
    }

    for (const dup of candidates) {
      if (dup.id === canonical.id || claimed.has(dup.id)) continue;
      claimed.add(dup.id);
      // Already merged on a previous run: inactive and empty — nothing left to do.
      if ((!dup.isActive || dup.deletedAt !== null) && dup.providerCount === 0) {
        actions.push({ kind: 'ALREADY_RETIRED', id: dup.id, slug: dup.slug, name: dup.name, providerCount: 0 });
        continue;
      }
      const holdsLabel = normalizeText(dup.name) === normalizeText(svc.label);
      actions.push({
        kind: 'MERGE_DUPLICATE', id: dup.id, slug: dup.slug, name: dup.name, intoId: canonical.id, intoSlug: canonical.slug, providerCount: dup.providerCount,
        ...(holdsLabel ? { renameTo: `${dup.name} (duplicate #${dup.id})` } : {}),
      });
    }
  }

  for (const row of existing) {
    if (claimed.has(row.id)) continue;
    if (!row.isActive || row.deletedAt !== null) {
      actions.push({ kind: 'ALREADY_RETIRED', id: row.id, slug: row.slug, name: row.name, providerCount: row.providerCount });
    } else {
      actions.push({ kind: 'RETIRE', id: row.id, slug: row.slug, name: row.name, reason: RETIRED_SLUGS.includes(row.slug) ? 'retired' : 'not-in-catalog', providerCount: row.providerCount });
    }
  }

  return { actions, conflicts };
}

/** Active categories the plan leaves behind (used by tests and the dry-run summary). */
export function activeCountAfterPlan(plan: CatalogPlan): number {
  return plan.actions.filter((a) => a.kind === 'UPDATE' || a.kind === 'UNCHANGED' || a.kind === 'CREATE').length;
}
