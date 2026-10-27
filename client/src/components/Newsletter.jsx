import { useState } from 'react';
import { useToast } from '../context/ToastContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Newsletter() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_REGEX.test(value)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.success('Thanks for subscribing!');
    setEmail('');
  };

  return (
    <section className="bg-indigo-50" aria-label="Newsletter signup">
      <div className="container-x py-14 text-center sm:py-16">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Join our newsletter
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Get 10% off your first order plus early access to new arrivals,
          exclusive deals, and style inspiration — straight to your inbox.
        </p>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="input flex-1"
          />
          <button type="submit" className="btn-primary shrink-0">
            Subscribe
          </button>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
