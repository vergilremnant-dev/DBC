import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articleApi } from '../../services/article/articleService';
import { BRAND } from '../../config/branding';
import type { Article } from '../../types/article/articleTypes';

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const startTimestampRef = useRef<number>(0);

  useEffect(() => {
    startTimestampRef.current = Date.now();
  }, []);

  // Handle Scroll Progress Bar
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height > 0) {
        const scrolled = (winScroll / height) * 100;
        setScrollProgress(scrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Article Details
  useEffect(() => {
    if (!slug) return;
    async function loadArticle() {
      try {
        setLoading(true);
        const art = await articleApi.getArticleDetail(slug);
        setArticle(art);
        
        // Dynamically update document title for SEO
        document.title = art.seoTitle || art.title;

        // Fetch related articles in the same category
        const relData = await articleApi.listArticles({
          categorySlug: art.category?.slug,
          limit: 3,
        });
        // Exclude current article
        setRelated(relData.articles.filter((a) => a.id !== art.id));

        // Reset read time timer
        startTimestampRef.current = Date.now();
      } catch (err) {
        console.error('Failed to load article detail', err);
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [slug]);

  // Track Reading Duration on Unmount or Route Change
  useEffect(() => {
    return () => {
      if (article?.id) {
        const elapsedSeconds = Math.round((Date.now() - startTimestampRef.current) / 1000);
        // Limit tracking up to 10 minutes to exclude idle noise
        if (elapsedSeconds > 2 && elapsedSeconds < 600) {
          articleApi.trackInteraction(article.id, 'read_time', elapsedSeconds).catch((err) => {
            console.error('Failed to track reading time', err);
          });
        }
      }
    };
  }, [article?.id]);

  // Track CTA Conversions
  const handleCtaClick = async (ctaType: 'consultation' | 'callback' | 'browse') => {
    if (!article) return;
    try {
      if (ctaType === 'consultation') {
        await articleApi.trackInteraction(article.id, 'consultation');
        navigate('/book-service');
      } else if (ctaType === 'callback') {
        await articleApi.trackInteraction(article.id, 'callback');
        navigate('/request-callback');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to register conversion', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-xs text-stone-600 animate-pulse">🔄 Loading educational guide...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-lg font-bold text-stone-900 font-display">Guide Not Found</h2>
        <p className="text-xs text-stone-600 mt-2">The article you are looking for may have been retired or moved.</p>
        <button
          onClick={() => navigate('/blog')}
          className="mt-4 rounded bg-stone-900 px-4 py-2 text-xs font-bold text-white cursor-pointer"
        >
          Back to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-cream text-stone-900 font-sans relative">
      {/* Sticky Reading Progress Indicator */}
      <div
        className="fixed top-0 left-0 z-50 h-1 bg-brand-emerald transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Article Content Layout */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button
          onClick={() => navigate('/blog')}
          className="mb-4 text-xs font-bold text-stone-600 hover:text-stone-905 transition cursor-pointer"
        >
          ← Back to Articles
        </button>
        <article className="space-y-6">
          {/* Tag and Category */}
          <div className="flex items-center gap-2">
            <span className="text-2xs font-black uppercase tracking-wider bg-emerald-50 border border-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              {article.category?.name}
            </span>
            <span className="text-xs text-stone-400 font-semibold">• {article.readTime} Min Read</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-extrabold text-stone-900 font-display leading-tight sm:text-4xl">
            {article.title}
          </h1>

          {/* Meta Detail */}
          <div className="flex items-center justify-between border-y border-stone-100 py-3 text-xs text-stone-600 font-medium">
            <div className="flex items-center gap-2">
              <span>✍️ Authored by:</span>
              <span className="font-bold text-stone-900">
                {article.authorProvider?.fullName || `${BRAND.name} Editorial Team`}
              </span>
            </div>
            <span>
              Published:{' '}
              {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Featured Image */}
          {article.featuredImage && (
            <div className="rounded-xl overflow-hidden shadow border border-stone-200">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full object-cover max-h-[350px]"
              />
            </div>
          )}

          {/* Body Content */}
          <div
            className="prose prose-stone max-w-none text-stone-850 text-[14px] leading-relaxed space-y-4 whitespace-pre-line"
            style={{ fontSize: '13.5px' }}
          >
            {article.content}
          </div>

          {/* Tags */}
          {article.tags && (
            <div className="flex flex-wrap gap-1.5 pt-4 border-t border-stone-100">
              {article.tags.split(',').map((tag) => (
                <span
                  key={tag}
                  className="bg-stone-100 border border-stone-200 text-stone-600 px-2 py-0.5 rounded text-2xs font-bold"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Action CTAs Section */}
        <section className="mt-12 rounded-2xl border border-stone-200 bg-stone-900 p-6 sm:p-8 text-white shadow-xl text-center space-y-6">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold font-display text-white">Need Expert Advice for Your Project?</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Don't make blind decisions. Speak with certified providers, check technical structural specs, or request an immediate callback.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => handleCtaClick('consultation')}
              className="rounded-lg bg-emerald-700 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 shadow transition cursor-pointer"
            >
              Book an Expert Consultation
            </button>
            <button
              onClick={() => handleCtaClick('callback')}
              className="rounded-lg bg-white hover:bg-stone-50 text-stone-900 text-xs font-bold px-6 py-2.5 shadow transition cursor-pointer"
            >
              Request a Callback
            </button>
            <button
              onClick={() => handleCtaClick('browse')}
              className="rounded-lg border border-stone-600 hover:bg-stone-800 text-stone-300 text-xs font-bold px-5 py-2.5 transition cursor-pointer"
            >
              Browse Providers
            </button>
          </div>
        </section>

        {/* Related Articles Section */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-stone-200 pt-8 space-y-6">
            <h3 className="text-lg font-bold text-stone-900 font-display">📚 Related Guides</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {related.slice(0, 2).map((art) => (
                <div
                  key={art.id}
                  onClick={() => navigate(`/blog/${art.slug}`)}
                  className="group bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow hover:border-stone-300 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="text-3xs font-black uppercase tracking-wider text-emerald-800">
                      {art.category?.name}
                    </span>
                    <h4 className="mt-1 text-xs font-bold text-stone-900 group-hover:text-emerald-800 transition leading-snug">
                      {art.title}
                    </h4>
                    <p className="mt-1 text-2xs text-stone-500 line-clamp-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-3xs text-stone-600 font-bold uppercase tracking-wider pt-2 border-t border-stone-50">
                    <span>⏱️ {art.readTime} Min Read</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-stone-200 bg-stone-50 py-8 text-center text-2xs text-stone-500 font-bold uppercase tracking-wider">
        {BRAND.fullName} Handbook Series — Verified Structural & Service Guidelines.
      </footer>
    </div>
  );
}
