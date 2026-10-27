import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cx } from '../utils/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const errMsg = (e, fb = 'Registration failed. Please try again.') =>
  e?.response?.data?.message || e?.message || fb;

export default function Register() {
  const { isAuthenticated, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required.';
    else if (form.username.trim().length < 3)
      errs.username = 'Username must be at least 3 characters.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success('Account created. Welcome to ShopNova!');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    {
      id: 'register-username',
      label: 'Username',
      type: 'text',
      field: 'username',
      placeholder: 'Choose a username',
      autoComplete: 'username',
    },
    {
      id: 'register-email',
      label: 'Email address',
      type: 'email',
      field: 'email',
      placeholder: 'you@example.com',
      autoComplete: 'email',
    },
    {
      id: 'register-password',
      label: 'Password',
      type: 'password',
      field: 'password',
      placeholder: 'At least 6 characters',
      autoComplete: 'new-password',
    },
    {
      id: 'register-confirm',
      label: 'Confirm password',
      type: 'password',
      field: 'confirmPassword',
      placeholder: 'Repeat your password',
      autoComplete: 'new-password',
    },
  ];

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create an account</h1>
          <p className="mt-1 text-sm text-slate-500">Join ShopNova for faster checkout and order tracking</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          {fields.map((f) => (
            <div key={f.id}>
              <label htmlFor={f.id} className="label">
                {f.label}
              </label>
              <input
                id={f.id}
                type={f.type}
                className={cx('input', errors[f.field] && 'border-rose-400')}
                value={form[f.field]}
                onChange={set(f.field)}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                aria-invalid={!!errors[f.field]}
                aria-describedby={errors[f.field] ? `${f.id}-error` : undefined}
              />
              {errors[f.field] && (
                <p id={`${f.id}-error`} className="mt-1 text-xs text-rose-600">
                  {errors[f.field]}
                </p>
              )}
            </div>
          ))}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
