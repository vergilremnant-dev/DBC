import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleApi } from '../../services/article/articleService';
import { BRAND } from '../../config/branding';
import type { Article, BlogCategory } from '../../types/article/articleTypes';
import { useAuth } from '../../hooks/auth/useAuth';

export function BlogCatalog() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [featured, setFeatured] = useState<{ latest: Article[]; popular: Article[] } | null>(null);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [cats, featData] = await Promise.all([
          articleApi.getCategories(),
          articleApi.getFeaturedArticles(),
        ]);
        setCategories(cats);
        setFeatured(featData);
      } catch (err) {
        console.error('Failed to load blog parameters', err);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true);
        const response = await articleApi.listArticles({
          categorySlug: selectedCategory || undefined,
          query: search || undefined,
        });
        setArticles(response.articles);
      } catch (err) {
        console.error('Failed to load articles list', err);
      } finally {
        setLoading(false);
      }
    }
    const delayDebounce = setTimeout(() => {
      fetchArticles();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, selectedCategory]);

  return (
    <div className="bg-warm-cream text-stone-900 font-sans">
      {/* Main Layout */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        
        {/* Banner Section */}
        <section className="text-center max-w-2xl mx-auto py-6">
          <h1 className="text-3xl font-extrabold text-stone-900 font-display leading-tight sm:text-4xl">
            {BRAND.fullName} Knowledge Hub
          </h1>
          {user?.role === 'ROLE_ADMIN' && (
            <button
              onClick={() => navigate('/admin/articles')}
              className="mt-3 inline-block rounded-lg bg-stone-900 hover:bg-stone-850 px-3.5 py-1.5 text-xs font-bold text-white transition shadow cursor-pointer"
            >
              Writer Portal
            </button>
          )}
          <p className="mt-3 text-sm text-stone-600 leading-relaxed">
            Your home improvement and service handbook. Educate yourself before hiring experts. Plan budgets, review designs, and get verified structural guides.
          </p>
        </section>

        {/* Search & Categories Bar */}
        <section className="mt-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guides, planning tips, and checklists..."
              className="w-full rounded-full border border-stone-200 bg-white pl-9 pr-4 py-2.5 text-xs text-stone-900 focus:border-stone-450 focus:outline-none focus:ring-1 focus:ring-stone-400 transition"
            />
          </div>

          {/* Categories Pill List */}
          <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar justify-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                selectedCategory === null
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-105 bg-stone-100 text-stone-600 hover:bg-stone-150'
              }`}
            >
              All Topics
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-105 bg-stone-100 text-stone-600 hover:bg-stone-150'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Section (visible when no filters) */}
        {!selectedCategory && !search && featured && featured.popular.length > 0 && (
          <section className="mt-12 space-y-6">
            <h2 className="text-lg font-bold text-stone-900 font-display border-b border-stone-100 pb-2">
              🔥 Popular Handbooks & Guides
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {featured.popular.slice(0, 3).map((art) => (
                <div
                  key={art.id}
                  onClick={() => navigate(`/blog/${art.slug}`)}
                  className="group flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-stone-300 transition cursor-pointer"
                >
                  {art.featuredImage ? (
                    <img
                      src={art.featuredImage}
                      alt={art.title}
                      className="h-40 w-full object-cover group-hover:scale-102 transition duration-300"
                    />
                  ) : (
                    <div className="h-40 w-full bg-stone-100 flex items-center justify-center text-stone-400 font-bold uppercase tracking-wider text-2xs">
                      {BRAND.name} Guide
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-3xs font-black uppercase tracking-wider text-amber-600">
                        {art.category?.name}
                      </span>
                      <h3 className="mt-1 text-sm font-extrabold text-stone-900 font-display group-hover:text-amber-700 transition leading-snug">
                        {art.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-2xs text-stone-400 font-bold uppercase tracking-wider border-t border-stone-50 pt-3">
                      <span>⏱️ {art.readTime} Min Read</span>
                      <span>👁️ {art.viewsCount} Reads</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Regular Articles Feed */}
        <section className="mt-12 space-y-6">
          <h2 className="text-lg font-bold text-stone-900 font-display border-b border-stone-100 pb-2">
            {selectedCategory
              ? `📚 Guides on ${categories.find((c) => c.slug === selectedCategory)?.name}`
              : search
              ? `🔍 Search results for "${search}"`
              : '📝 Handbooks & Practical Tips'}
          </h2>

          {loading ? (
            <div className="space-y-4">
              <div className="h-28 bg-stone-100 rounded-xl animate-pulse" />
              <div className="h-28 bg-stone-100 rounded-xl animate-pulse" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-10 bg-white border border-stone-200 rounded-xl">
              <p className="text-xs text-stone-500 font-semibold">No educational guides found matching your filters.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {articles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => navigate(`/blog/${art.slug}`)}
                  className="group flex flex-col sm:flex-row bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-stone-300 transition cursor-pointer"
                >
                  {art.featuredImage && (
                    <img
                      src={art.featuredImage}
                      alt={art.title}
                      className="h-36 sm:h-full sm:w-36 object-cover"
                    />
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-3xs font-black uppercase tracking-wider text-emerald-700">
                          {art.category?.name}
                        </span>
                        <span className="text-2xs text-stone-400 font-semibold">
                          {new Date(art.publishedAt || art.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <h3 className="mt-1 text-xs font-bold text-stone-900 group-hover:text-emerald-800 transition leading-snug">
                        {art.title}
                      </h3>
                      <p className="mt-1 text-2xs text-stone-500 line-clamp-2 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-3xs text-stone-450 text-stone-500 font-bold uppercase tracking-wider">
                      <span>⏱️ {art.readTime} Min Read</span>
                      {art.authorProvider?.fullName && (
                        <span>✍️ {art.authorProvider.fullName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-stone-200 bg-stone-50 py-10 text-center">
        <p className="text-2xs text-stone-400 font-bold uppercase tracking-wider">
          {BRAND.name} © {new Date().getFullYear()} — Building Trust, Educating Communities.
        </p>
      </footer>
    </div>
  );
}
