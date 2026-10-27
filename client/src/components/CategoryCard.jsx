import { Link } from 'react-router-dom';
import { formatPrice, imgUrl, cx, calcDiscountPct } from '../utils/format';
import Rating from './Rating';

export default function CategoryCard({ category }) {
  if (!category) return null;

  const productCount =
    typeof category.productCount === 'number' ? category.productCount : null;

  return (
    <Link
      to={`/shop?category=${category._id}`}
      className="group relative block overflow-hidden rounded-2xl bg-slate-100 shadow-sm transition-shadow hover:shadow-lg"
      aria-label={`Shop ${category.name}`}
    >
      <div className="aspect-square w-full overflow-hidden">
        <img
          src={imgUrl(category.image)}
          alt={category.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = imgUrl(null);
          }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="text-lg font-semibold text-white">{category.name}</h3>
        {productCount !== null && (
          <p className="mt-0.5 text-sm text-slate-200">
            {productCount} {productCount === 1 ? 'product' : 'products'}
          </p>
        )}
      </div>
    </Link>
  );
}
