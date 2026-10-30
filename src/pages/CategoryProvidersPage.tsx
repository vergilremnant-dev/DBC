import { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { categoryApi } from '../services/category/categoryService';

/**
 * Legacy route /category/:id/providers → /services/:slug (query string preserved).
 * Retired or unknown categories are still forwarded by slug when resolvable, otherwise to /services.
 */
export function CategoryProvidersPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { search } = useLocation();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const numericId = Number(id);
    (async () => {
      let slug: string | undefined;
      try {
        const active = await categoryApi.getCategories();
        slug = active.find((c) => c.id === numericId)?.slug;
        if (!slug && Number.isInteger(numericId) && numericId > 0) slug = (await categoryApi.getCategory(String(numericId)))?.slug;
      } catch {
        slug = undefined;
      }
      if (alive) setTarget(slug ? `/services/${encodeURIComponent(slug)}${search}` : `/services${search}`);
    })();
    return () => {
      alive = false;
    };
  }, [id, search]);

  if (!target) {
    return (
      <div className="dbc-container py-10" role="status">
        <span className="text-sm text-stone-600">Opening service…</span>
      </div>
    );
  }
  return <Navigate to={target} replace />;
}
