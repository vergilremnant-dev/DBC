import React, { useEffect, useState, useCallback, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleApi } from '../../services/article/articleService';
import { LogoutButton } from '../../components/auth/LogoutButton';
import { BrandLogo } from '../../components/common/BrandLogo';
import type { Article, BlogCategory, ArticleAnalyticsReport } from '../../types/article/articleTypes';

export function AdminArticlesPage() {
  const navigate = useNavigate();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [analytics, setAnalytics] = useState<ArticleAnalyticsReport | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [readTime, setReadTime] = useState('5');
  const [isPublished, setIsPublished] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Category Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [artList, cats, report] = await Promise.all([
        articleApi.adminListArticles(),
        articleApi.getCategories(),
        articleApi.adminGetAnalytics(),
      ]);
      setArticles(artList.articles);
      setCategories(cats);
      setAnalytics(report);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard parameters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      loadAllData();
    });
  }, [loadAllData]);

  const handleEditClick = (art: Article) => {
    setIsEditing(true);
    setEditingId(art.id);
    setTitle(art.title);
    setExcerpt(art.excerpt);
    setContent(art.content);
    setFeaturedImage(art.featuredImage || '');
    setCategoryId(String(art.categoryId));
    setTags(art.tags);
    setReadTime(String(art.readTime));
    setIsPublished(art.isPublished);
    setSeoTitle(art.seoTitle || '');
    setSeoDescription(art.seoDescription || '');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('');
    setExcerpt('');
    setContent('');
    setFeaturedImage('');
    setCategoryId('');
    setTags('');
    setReadTime('5');
    setIsPublished(false);
    setSeoTitle('');
    setSeoDescription('');
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) {
      setError('Title, content, and category are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      const payload = {
        title,
        excerpt,
        content,
        featuredImage: featuredImage.trim() || null,
        categoryId: Number(categoryId),
        tags,
        readTime: Number(readTime),
        isPublished,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
      };

      if (isEditing && editingId) {
        await articleApi.adminUpdateArticle(editingId, payload);
        setSuccessMsg('Article updated successfully.');
      } else {
        await articleApi.adminCreateArticle(payload);
        setSuccessMsg('Article created and registered.');
      }

      handleCancelEdit();
      await loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this educational article?')) return;
    try {
      setLoading(true);
      await articleApi.adminDeleteArticle(id);
      setSuccessMsg('Article removed successfully.');
      await loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setLoading(true);
      await articleApi.adminCreateCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
      });
      setNewCatName('');
      setNewCatDesc('');
      setShowCatModal(false);
      setSuccessMsg('New category added successfully.');
      await loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-cream text-stone-950 font-sans">
      <header className="sticky top-0 z-30 border-b border-light-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/blog')}>
            <BrandLogo variant="header" />
            <span className="rounded bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
              Writer Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/blog')}
              className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              Go to Blog Hub
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-10">
        
        {/* Status Alerts */}
        {error && <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-xs font-semibold text-red-700">{error}</div>}
        {successMsg && <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-xs font-semibold text-emerald-800">{successMsg}</div>}

        {/* Analytics Section */}
        {analytics && (
          <section className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Articles</span>
              <h4 className="text-2xl font-extrabold mt-1 text-stone-900 font-serif">{analytics.totalArticles}</h4>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Hub Views</span>
              <h4 className="text-2xl font-extrabold mt-1 text-stone-900 font-serif">👁️ {analytics.totalViews}</h4>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Consultation CVs</span>
              <h4 className="text-2xl font-extrabold mt-1 text-stone-900 font-serif">💬 {analytics.totalConsultationConversions}</h4>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Callback CVs</span>
              <h4 className="text-2xl font-extrabold mt-1 text-stone-900 font-serif">📞 {analytics.totalCallbackConversions}</h4>
            </div>
          </section>
        )}

        {/* Editor Form & Category Creation */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold text-stone-900 font-serif">
              {isEditing ? '✏️ Modify Handbook Article' : '📝 Compose Handbook Article'}
            </h2>
            <button
              onClick={() => setShowCatModal(true)}
              className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              + Create Category
            </button>
          </div>

          <form onSubmit={handleArticleSubmit} className="space-y-4 text-xs">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-bold text-stone-700">Article Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!isEditing) setSeoTitle(e.target.value);
                  }}
                  placeholder="e.g. How to Choose a Contractor"
                  required
                  className="mt-1 dbc-input text-stone-900"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="mt-1 dbc-input bg-white text-stone-900"
                >
                  <option value="">Select Topic Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700">Excerpt / SEO Summary</label>
              <textarea
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  if (!isEditing) setSeoDescription(e.target.value);
                }}
                placeholder="Brief excerpt summarising article content (100-200 characters)..."
                rows={2}
                className="mt-1 dbc-input text-stone-900"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700">Article Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Compose full markdown or plaintext educational guidelines..."
                rows={10}
                required
                className="mt-1 dbc-input text-stone-900 resize-y"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="font-bold text-stone-700">Featured Image URL</label>
                <input
                  type="text"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1 dbc-input"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="budget, contractor, tips"
                  className="mt-1 dbc-input"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700">Estimated Read Time (Minutes)</label>
                <input
                  type="number"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  min="1"
                  className="mt-1 dbc-input"
                />
              </div>
            </div>

            {/* SEO Section */}
            <div className="border-t border-stone-150 pt-4 space-y-3">
              <h3 className="font-bold text-stone-800">SEO Configuration</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-bold text-stone-700">SEO Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Search Engine Optimized Title"
                    className="mt-1 dbc-input"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700">SEO Meta Description</label>
                  <input
                    type="text"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Search Engine Meta Description"
                    className="mt-1 dbc-input"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 font-bold text-stone-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="dbc-checkbox"
                />
                Publish immediately (Draft if unchecked)
              </label>

              <div className="flex gap-2 ml-auto">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="dbc-btn dbc-btn-md dbc-btn-primary"
                >
                  {isEditing ? 'Save Updates' : 'Compose Article'}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Existing Articles Table */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm overflow-x-auto">
          <h2 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-3">
            📚 Composed Handbooks & Articles
          </h2>
          <table className="mt-4 w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider">
                <th className="pb-3 pr-2">Title</th>
                <th className="pb-3 pr-2">Category</th>
                <th className="pb-3 pr-2">Reads</th>
                <th className="pb-3 pr-2">Conversions (Consult/Call)</th>
                <th className="pb-3 pr-2">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-400">
                    No articles drafted yet.
                  </td>
                </tr>
              ) : (
                articles.map((art) => (
                  <tr key={art.id} className="hover:bg-stone-50">
                    <td className="py-3.5 pr-2 font-bold text-stone-900 max-w-xs truncate">{art.title}</td>
                    <td className="py-3.5 pr-2 text-stone-500">{art.category?.name}</td>
                    <td className="py-3.5 pr-2 text-stone-900 font-semibold">{art.viewsCount}</td>
                    <td className="py-3.5 pr-2 text-stone-500 font-semibold">
                      💬 {art.consultationConversions} / 📞 {art.callbackConversions}
                    </td>
                    <td className="py-3.5 pr-2">
                      <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        art.isPublished 
                          ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' 
                          : 'bg-amber-50 border border-amber-100 text-amber-800'
                      }`}>
                        {art.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => handleEditClick(art)}
                        className="rounded bg-stone-100 hover:bg-stone-200 text-stone-800 px-2 py-1 cursor-pointer font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(art.id)}
                        className="rounded bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 cursor-pointer font-bold border border-rose-100"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleCategoryCreate} className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl text-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">
              Add Blog Category
            </h3>
            
            <div>
              <label className="font-bold text-stone-700">Category Name</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Electrical Planning"
                required
                className="mt-1 dbc-input text-stone-900"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700">Description</label>
              <textarea
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Short description of the topic..."
                rows={3}
                className="mt-1 dbc-input text-stone-900"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="dbc-btn dbc-btn-sm dbc-btn-primary"
              >
                Create Category
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
