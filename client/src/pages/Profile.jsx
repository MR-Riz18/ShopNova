import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import userApi from '../api/userApi';
import orderApi from '../api/orderApi';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { STATUS_STYLES } from '../utils/constants';
import { formatPrice, formatDate, cx } from '../utils/format';

const getBody = (res) => res?.data?.data ?? res?.data ?? {};
const errMsg = (e, fb = 'Something went wrong.') =>
  e?.response?.data?.message || e?.message || fb;

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'orders', label: 'Orders' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'settings', label: 'Settings' },
];

const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};
const ADDRESS_FIELDS = [
  { key: 'fullName', label: 'Full name', span: true },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'address', label: 'Street address', span: true },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State / Province' },
  { key: 'postalCode', label: 'Postal code' },
  { key: 'country', label: 'Country' },
];

const validateAddress = (form) => {
  const errs = {};
  ADDRESS_FIELDS.forEach(({ key, label }) => {
    if (!String(form[key] || '').trim()) errs[key] = `${label} is required.`;
  });
  return errs;
};

function AddressForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initial || EMPTY_ADDRESS);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateAddress(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
      {ADDRESS_FIELDS.map(({ key, label, type, span }) => (
        <div key={key} className={span ? 'sm:col-span-2' : ''}>
          <label htmlFor={`addr-${key}`} className="label">
            {label}
          </label>
          <input
            id={`addr-${key}`}
            type={type || 'text'}
            className={cx('input bg-white', errors[key] && 'border-rose-400')}
            value={form[key] || ''}
            onChange={(e) => {
              setForm((f) => ({ ...f, [key]: e.target.value }));
              setErrors((prev) => ({ ...prev, [key]: undefined }));
            }}
            aria-invalid={!!errors[key]}
          />
          {errors[key] && <p className="mt-1 text-xs text-rose-600">{errors[key]}</p>}
        </div>
      ))}
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save address'}
        </button>
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const { items: wishlistItems, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = TABS.some((t) => t.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'profile';
  const setTab = (id) => setSearchParams(id === 'profile' ? {} : { tab: id });

  // Profile edit
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Orders (recent 5)
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savingAddr, setSavingAddr] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Password
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    setProfileForm({
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  }, [user]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await orderApi.getMyOrders();
      const body = getBody(res);
      const list = Array.isArray(body) ? body : body.orders ?? [];
      setRecentOrders((Array.isArray(list) ? list : []).slice(0, 5));
    } catch {
      setRecentOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadAddresses = async () => {
    setAddrLoading(true);
    try {
      const res = await userApi.getAddresses();
      const body = getBody(res);
      const list = Array.isArray(body) ? body : body.addresses ?? [];
      setAddresses(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(errMsg(e, 'Could not load addresses.'));
      setAddresses([]);
    } finally {
      setAddrLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'addresses') loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const wishlistProducts = useMemo(
    () => (wishlistItems || []).map((it) => it.product || it).filter((p) => p && (p._id || p.id)),
    [wishlistItems]
  );

  /* ---------- profile ---------- */
  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.username.trim()) {
      toast.error('Username is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) {
      toast.error('Enter a valid email address.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      });
      toast.success('Profile updated.');
      setEditing(false);
    } catch (err) {
      toast.error(errMsg(err, 'Could not update profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  /* ---------- addresses ---------- */
  const handleAddAddress = async (form) => {
    setSavingAddr(true);
    try {
      const res = await userApi.addAddress(form);
      const body = getBody(res);
      const list = Array.isArray(body) ? body : body.addresses ?? [];
      setAddresses(Array.isArray(list) ? list : []);
      setShowAddForm(false);
      toast.success('Address added.');
    } catch (e) {
      toast.error(errMsg(e, 'Could not add address.'));
    } finally {
      setSavingAddr(false);
    }
  };

  const handleUpdateAddress = async (form) => {
    setSavingAddr(true);
    try {
      const res = await userApi.updateAddress(editingId, form);
      const body = getBody(res);
      const list = Array.isArray(body) ? body : body.addresses ?? [];
      setAddresses(Array.isArray(list) ? list : []);
      setEditingId(null);
      toast.success('Address updated.');
    } catch (e) {
      toast.error(errMsg(e, 'Could not update address.'));
    } finally {
      setSavingAddr(false);
    }
  };

  const handleDeleteAddress = async () => {
    try {
      const res = await userApi.deleteAddress(deleteId);
      const body = getBody(res);
      const list = Array.isArray(body) ? body : body.addresses ?? [];
      setAddresses(Array.isArray(list) ? list : []);
      toast.success('Address removed.');
    } catch (e) {
      toast.error(errMsg(e, 'Could not remove address.'));
    } finally {
      setDeleteId(null);
    }
  };

  const handleSetDefault = async (aid) => {
    try {
      const res = await userApi.setDefaultAddress(aid);
      const body = getBody(res);
      const list = Array.isArray(body) ? body : body.addresses ?? [];
      setAddresses(Array.isArray(list) ? list : []);
      toast.success('Default address updated.');
    } catch (e) {
      toast.error(errMsg(e, 'Could not set default address.'));
    }
  };

  /* ---------- password ---------- */
  const changePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Current password is required.';
    if (!pwForm.newPassword) errs.newPassword = 'New password is required.';
    else if (pwForm.newPassword.length < 6)
      errs.newPassword = 'New password must be at least 6 characters.';
    if (pwForm.confirm !== pwForm.newPassword) errs.confirm = 'Passwords do not match.';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setChangingPw(true);
    try {
      await userApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed successfully.');
    } catch (err) {
      toast.error(errMsg(err, 'Could not change password.'));
    } finally {
      setChangingPw(false);
    }
  };

  const moveToCart = async (p) => {
    const pid = p._id || p.id;
    try {
      await addItem(pid, 1);
      await toggleWishlist(pid);
      toast.success('Moved to cart.');
    } catch (e) {
      toast.error(errMsg(e, 'Could not move item to cart.'));
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('You have been logged out.');
    navigate('/');
  };

  const statusBadge = (status) => {
    const s = status || 'pending';
    const style =
      (STATUS_STYLES && STATUS_STYLES[s]) || 'bg-slate-100 text-slate-700';
    const label = String(s)
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-bold', style)}>{label}</span>;
  };

  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Account</h1>

      {/* Tabs */}
      <div className="mt-6 border-b border-slate-200" role="tablist" aria-label="Account sections">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition',
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="py-8" role="tabpanel">
        {/* ---------- PROFILE ---------- */}
        {activeTab === 'profile' && (
          <div className="card max-w-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Profile information</h2>
              {!editing && (
                <button type="button" className="btn-outline" onClick={() => setEditing(true)}>
                  Edit
                </button>
              )}
            </div>
            {editing ? (
              <form onSubmit={saveProfile} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="profile-username" className="label">
                    Username
                  </label>
                  <input
                    id="profile-username"
                    className="input"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm((f) => ({ ...f, username: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="profile-email" className="label">
                    Email
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    className="input"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="profile-phone" className="label">
                    Phone
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    className="input"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary" disabled={savingProfile}>
                    {savingProfile ? 'Saving…' : 'Save changes'}
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex gap-4">
                  <dt className="w-24 shrink-0 text-slate-500">Username</dt>
                  <dd className="font-medium text-slate-900">{user?.username || '—'}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="w-24 shrink-0 text-slate-500">Email</dt>
                  <dd className="font-medium text-slate-900">{user?.email || '—'}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="w-24 shrink-0 text-slate-500">Phone</dt>
                  <dd className="font-medium text-slate-900">{user?.phone || '—'}</dd>
                </div>
              </dl>
            )}
          </div>
        )}

        {/* ---------- ORDERS ---------- */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
              <Link to="/orders" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                View all
              </Link>
            </div>
            {ordersLoading ? (
              <div className="mt-4 flex justify-center py-8">
                <Loader />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No orders yet"
                  message="Your recent orders will appear here."
                  action={
                    <Link to="/shop" className="btn-primary">
                      Start shopping
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                {recentOrders.map((o) => {
                  const orderNumber = o.orderNumber || o.orderId || o._id;
                  const itemCount = (o.items || []).reduce((n, it) => n + Number(it.quantity || 0), 0);
                  return (
                    <Link
                      key={o._id || orderNumber}
                      to={`/orders/${o._id}`}
                      className="card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:shadow-md"
                    >
                      <div>
                        <p className="font-mono text-sm font-bold text-slate-900">{orderNumber}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {o.createdAt ? formatDate(o.createdAt) : ''} · {itemCount}{' '}
                          {itemCount === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {statusBadge(o.status || o.orderStatus)}
                        <span className="text-sm font-extrabold text-slate-900">
                          {formatPrice(o.total || 0)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------- ADDRESSES ---------- */}
        {activeTab === 'addresses' && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Saved addresses</h2>
              {!showAddForm && (
                <button type="button" className="btn-primary" onClick={() => setShowAddForm(true)}>
                  Add new address
                </button>
              )}
            </div>

            {showAddForm && (
              <div className="mt-4">
                <AddressForm
                  submitting={savingAddr}
                  onCancel={() => setShowAddForm(false)}
                  onSubmit={handleAddAddress}
                />
              </div>
            )}

            {addrLoading ? (
              <div className="mt-4 flex justify-center py-8">
                <Loader />
              </div>
            ) : addresses.length === 0 && !showAddForm ? (
              <div className="mt-4">
                <EmptyState
                  title="No saved addresses"
                  message="Add an address to speed up checkout."
                  action={
                    <button type="button" className="btn-primary" onClick={() => setShowAddForm(true)}>
                      Add address
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                {addresses.map((a) => {
                  const aid = a._id || a.id;
                  const isEditing = editingId === aid;
                  return (
                    <div key={aid} className="card p-5">
                      {isEditing ? (
                        <AddressForm
                          initial={{
                            fullName: a.fullName || '',
                            phone: a.phone || '',
                            address: a.address || '',
                            city: a.city || '',
                            state: a.state || '',
                            postalCode: a.postalCode || '',
                            country: a.country || '',
                          }}
                          submitting={savingAddr}
                          onCancel={() => setEditingId(null)}
                          onSubmit={handleUpdateAddress}
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-sm">
                              <p className="flex items-center gap-2 font-semibold text-slate-900">
                                {a.fullName}
                                {a.isDefault && (
                                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                                    Default
                                  </span>
                                )}
                              </p>
                              <p className="mt-1 text-slate-600">
                                {a.address}, {a.city}, {a.state} {a.postalCode}, {a.country}
                              </p>
                              <p className="text-slate-500">{a.phone}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {!a.isDefault && (
                              <button
                                type="button"
                                className="btn-outline"
                                onClick={() => handleSetDefault(aid)}
                              >
                                Set as default
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-outline"
                              onClick={() => {
                                setEditingId(aid);
                                setShowAddForm(false);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                              onClick={() => setDeleteId(aid)}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <ConfirmDialog
              open={!!deleteId}
              title="Delete address?"
              message="This address will be permanently removed from your account."
              confirmLabel="Delete"
              danger
              onConfirm={handleDeleteAddress}
              onCancel={() => setDeleteId(null)}
            />
          </div>
        )}

        {/* ---------- WISHLIST ---------- */}
        {activeTab === 'wishlist' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900">My wishlist</h2>
            {wishlistProducts.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Your wishlist is empty"
                  message="Save products you love and find them here later."
                  action={
                    <Link to="/shop" className="btn-primary">
                      Discover products
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
                {wishlistProducts.map((p) => (
                  <div key={p._id || p.id}>
                    <ProductCard product={p} />
                    <button
                      type="button"
                      className="btn-outline mt-2 w-full"
                      onClick={() => moveToCart(p)}
                    >
                      Move to cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------- SETTINGS ---------- */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-8">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
              <form onSubmit={changePassword} className="mt-5 space-y-4">
                {[
                  { key: 'currentPassword', label: 'Current password', id: 'pw-current' },
                  { key: 'newPassword', label: 'New password', id: 'pw-new' },
                  { key: 'confirm', label: 'Confirm new password', id: 'pw-confirm' },
                ].map((f) => (
                  <div key={f.key}>
                    <label htmlFor={f.id} className="label">
                      {f.label}
                    </label>
                    <input
                      id={f.id}
                      type="password"
                      className={cx('input', pwErrors[f.key] && 'border-rose-400')}
                      value={pwForm[f.key]}
                      onChange={(e) => {
                        setPwForm((p) => ({ ...p, [f.key]: e.target.value }));
                        setPwErrors((prev) => ({ ...prev, [f.key]: undefined }));
                      }}
                      autoComplete={f.key === 'currentPassword' ? 'current-password' : 'new-password'}
                    />
                    {pwErrors[f.key] && (
                      <p className="mt-1 text-xs text-rose-600">{pwErrors[f.key]}</p>
                    )}
                  </div>
                ))}
                <button type="submit" className="btn-primary" disabled={changingPw}>
                  {changingPw ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">Danger zone</h2>
              <p className="mt-1 text-sm text-slate-500">
                Logging out will end your session on this device.
              </p>
              <button
                type="button"
                className="btn-danger mt-4"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
