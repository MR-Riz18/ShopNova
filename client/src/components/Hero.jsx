import { useState } from 'react';
import { Link } from 'react-router-dom';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=70';

function TrustItem({ icon, label }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
        {icon}
      </span>
      <span className="text-sm font-medium text-indigo-100">{label}</span>
    </div>
  );
}

export default function Hero() {
  const [imgVisible, setImgVisible] = useState(true);

  return (
    <section className="container-x py-6 sm:py-8" aria-label="Featured promotion">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-700 to-violet-800">
        <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
          <div>
            <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white">
              New Season Sale
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Upgrade Your Everyday Essentials
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-indigo-100 sm:text-lg">
              Discover hand-picked products across fashion, tech, and home —
              quality you can feel, prices you'll love, delivered to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                Shop Now
              </Link>
              <Link
                to="/shop?sort=featured"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white/60 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/10"
              >
                Explore Collection
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              <TrustItem
                label="Free shipping"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                }
              />
              <TrustItem
                label="Secure payment"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                }
              />
              <TrustItem
                label="30-day returns"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                }
              />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-violet-500/40 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-8 -right-4 h-40 w-40 rounded-full bg-indigo-400/40 blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              {imgVisible ? (
                <img
                  src={HERO_IMAGE}
                  alt="ShopNova curated collection display"
                  className="aspect-[4/3] w-full object-cover"
                  onError={() => setImgVisible(false)}
                />
              ) : (
                <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-indigo-800">
                  <div className="absolute left-10 top-10 h-24 w-24 rounded-full bg-violet-500/50" aria-hidden="true" />
                  <div className="absolute bottom-12 right-12 h-32 w-32 rounded-full bg-indigo-400/50" aria-hidden="true" />
                  <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" aria-hidden="true" />
                  <span className="relative text-lg font-semibold text-white/80">ShopNova Collection</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
