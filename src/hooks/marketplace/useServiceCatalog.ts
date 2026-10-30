import { useEffect, useMemo, useState } from 'react';
import { categoryApi } from '../../services/category/categoryService';
import type { CategoryType, ServiceCategory } from '../../types/category/categoryTypes';

export type Workforce = CategoryType;

export const WORKFORCE_GROUPS: ReadonlyArray<{ type: Workforce; label: string; short: string; description: string }> = [
  { type: 'WHITE_COLLAR', label: 'Design & Consultancy', short: 'Design', description: 'Architects, engineers, consultants and project managers' },
  { type: 'BLUE_COLLAR', label: 'Construction Trades', short: 'Trades', description: 'Skilled trades for building, finishing and fitting' },
];

export const isWorkforce = (v: string | null | undefined): v is Workforce => v === 'WHITE_COLLAR' || v === 'BLUE_COLLAR';
export const workforceLabel = (t?: string | null) => WORKFORCE_GROUPS.find((g) => g.type === t)?.label ?? '';

const byGroupThenOrder = (a: ServiceCategory, b: ServiceCategory) =>
  (a.categoryType === b.categoryType ? 0 : a.categoryType === 'WHITE_COLLAR' ? -1 : 1) || a.displayOrder - b.displayOrder;

/**
 * The live service catalog from GET /api/categories (the only source of labels and order).
 * Top-level, active categories only.
 */
export function useServiceCatalog() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let alive = true;
    categoryApi
      .getCategories()
      .then((list) => {
        if (!alive) return;
        setCategories(list.filter((c) => c.isActive !== false && !c.parentId).sort(byGroupThenOrder));
        setStatus('ready');
      })
      .catch(() => alive && setStatus('error'));
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    const groups = Object.fromEntries(WORKFORCE_GROUPS.map((g) => [g.type, categories.filter((c) => c.categoryType === g.type)])) as Record<Workforce, ServiceCategory[]>;
    const bySlug = new Map(categories.map((c) => [c.slug, c]));
    const byId = new Map(categories.map((c) => [c.id, c]));
    return { categories, groups, bySlug, byId, status };
  }, [categories, status]);
}
