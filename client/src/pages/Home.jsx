import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import productApi from '../api/productApi';
import categoryApi from '../api/categoryApi';
import Hero from '../components/Hero';
import Newsletter from '../components/Newsletter';
import Reviews from '../components/Reviews';
import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import {
  SAMPLE_PRODUCTS,
  SAMPLE_CATEGORIES,
  SAMPLE_TESTIMONIALS,
} from '../utils/sampleData';

const getBody = (res) => res?.data?.data ?? res?.data ?? {};

const toProducts = (res) => {
  const body = getBody(res);
  const list = Array.isArray(body) ? body : body.products ?? body.items ?? [];
  return Array.isArray(list) ? list : [];
};

const toCategories = (res) => {
  const body = getBody(res);
  if (Array.isArray(body)) return body;
  const list = body.categories ?? [];
  return Array.isArray(list) ? list : [];
};

/** Fetch products without ever throwing; tries fallback params, else []. */
const getProductsSafe = async (params, fallbackParams) => {
  const once = async (p) => toProducts(await productApi.getProducts(p));
  try {
    const list = await once(params);
    if (list.length) return list;
  } catch {
    /* fall through to fallback */
  }
  if (fallbackParams) {
    try {
      const list = await once(fallbackParams);
      if (list.length) return list;
    } catch {
      /* fall through */
    }
  }
  return [];
};

const sampleProducts = () => [...(SAMPLE_PRODUCTS || [])];

function SectionHeader({ title, subtitle, linkTo, linkLabel = 'View all' }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500 md:text-base">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          {linkLabel}
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.17 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      )}
    </div>
  );
}

function ProductRow({ items, loading }) {
  if (loading) return <ProductGridSkeleton count={8} />;
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p._id || p.id} product={p} />
      ))}
    </div>
  );
}

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [catsRes, featRes, bestRes, newRes] = await Promise.allSettled([
        categoryApi.getCategories(),
        getProductsSafe({ featured: true, limit: 8 }),
        getProductsSafe({ bestSeller: true, limit: 8 }, { sort: 'popular', limit: 8 }),
        getProductsSafe({ sort: 'newest', limit: 8 }),
      ]);
      if (cancelled) return;

      if (catsRes.status === 'fulfilled') {
        const cats = toCategories(catsRes.value);
        setCategories(cats.length ? cats : [...(SAMPLE_CATEGORIES || [])]);
      } else {
        setCategories([...(SAMPLE_CATEGORIES || [])]);
      }

      setFeatured(
        featRes.status === 'fulfilled' && featRes.value.length ? featRes.value : sampleProducts()
      );
      setBestSellers(
        bestRes.status === 'fulfilled' && bestRes.value.length ? bestRes.value : sampleProducts()
      );
      setNewArrivals(
        newRes.status === 'fulfilled' && newRes.value.length ? newRes.value : sampleProducts()
      );
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <Hero />

      {/* Categories */}
      <section className="container-x py-12 md:py-16" aria-labelledby="home-categories">
        <SectionHeader
          id="home-categories"
          title="Shop by Category"
          subtitle="Find exactly what you're looking for"
          linkTo="/shop"
        />
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-4">
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {categories.slice(0, 8).map((c) => (
              <CategoryCard key={c._id || c.id || c.slug} category={c} />
            ))}
          </div>
        ) : null}
      </section>

      {/* Featured products */}
      <section className="bg-slate-50 py-12 md:py-16" aria-labelledby="home-featured">
        <div className="container-x">
          <SectionHeader
            id="home-featured"
            title="Featured Products"
            subtitle="Handpicked favorites our customers love"
            linkTo="/shop?sort=featured"
          />
          <ProductRow items={featured} loading={loading} />
        </div>
      </section>

      {/* Promo banner */}
      <section className="container-x py-12 md:py-16" aria-labelledby="home-promo">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-12 text-white md:px-14 md:py-16">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/10"
            aria-hidden="true"
          />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
              Limited time offer
            </p>
            <h2 id="home-promo" className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">
              Mega Sale — Up to 50% off
            </h2>
            <p className="mt-3 text-sm text-white/85 md:text-base">
              Refresh your wardrobe, upgrade your tech, and stock up on everyday essentials.
              Big savings across top brands, while stocks last.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
            >
              Shop the sale
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.17 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="container-x py-12 md:py-16" aria-labelledby="home-best">
        <SectionHeader
          id="home-best"
          title="Best Sellers"
          subtitle="The products everyone is buying right now"
          linkTo="/shop?sort=popular"
        />
        <ProductRow items={bestSellers} loading={loading} />
      </section>

      {/* New arrivals */}
      <section className="bg-slate-50 py-12 md:py-16" aria-labelledby="home-new">
        <div className="container-x">
          <SectionHeader
            id="home-new"
            title="New Arrivals"
            subtitle="Fresh drops, just landed in store"
            linkTo="/shop?sort=newest"
          />
          <ProductRow items={newArrivals} loading={loading} />
        </div>
      </section>

      {/* Testimonials */}
      <Reviews testimonials={SAMPLE_TESTIMONIALS} />

      <Newsletter />
    </div>
  );
}
