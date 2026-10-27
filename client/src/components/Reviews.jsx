import Rating from './Rating';

const DEFAULT_REVIEWS = [
  {
    name: 'Sarah Mitchell',
    rating: 5,
    text: 'Absolutely love the quality. My order arrived faster than expected and the packaging was beautiful. ShopNova is now my go-to store.',
    detail: 'Verified buyer · New York',
  },
  {
    name: 'James Carter',
    rating: 5,
    text: 'Great prices and honest product descriptions. I compared with three other stores and this was the best value by far.',
    detail: 'Verified buyer · Austin',
  },
  {
    name: 'Emily Nguyen',
    rating: 4,
    text: 'The customer support team was incredibly helpful when I needed to exchange a size. Smooth, friendly, and completely hassle-free.',
    detail: 'Verified buyer · Seattle',
  },
  {
    name: 'Daniel Okafor',
    rating: 5,
    text: 'From checkout to delivery everything was seamless. The product matched the photos perfectly and the build quality exceeded my expectations.',
    detail: 'Verified buyer · Chicago',
  },
];

function initials(name) {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Reviews({ reviews, testimonials, ...rest }) {
  const list = reviews ?? testimonials ?? DEFAULT_REVIEWS;
  return (
    <section className="container-x py-14 sm:py-16" aria-label="Customer testimonials">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          What our customers say
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
          Thousands of happy shoppers trust ShopNova for quality products and
          reliable service.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((review, idx) => (
          <figure key={idx} className="card flex flex-col p-6">
            <Rating value={review.rating} showCount={false} size="md" />
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">
              &ldquo;{review.text}&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700"
                aria-hidden="true"
              >
                {initials(review.name)}
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  {review.name}
                </span>
                {review.detail && (
                  <span className="block text-xs text-slate-500">{review.detail}</span>
                )}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
