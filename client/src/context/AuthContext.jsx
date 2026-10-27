import { createContext, useContext, useEffect, useState } from 'react';
import authApi from '../api/authApi';
import userApi from '../api/userApi';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);
const TOKEN_KEY = 'token';

export function AuthProvider({ children }) {
  const { toast } = useToast();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount if a token exists.
  useEffect(() => {
    let active = true;
    async function restore() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const body = await authApi.getMe();
        if (active) setUser(body.data?.user || body.data || null);
      } catch {
        if (active) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    try {
      const body = await authApi.login({ email, password });
      const { token: nextToken, user: nextUser } = body.data;
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
      setUser(nextUser);
      toast.success('Welcome back!');
      return nextUser;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const register = async ({ username, email, password, confirmPassword }) => {
    try {
      const body = await authApi.register({ username, email, password, confirmPassword });
      const { token: nextToken, user: nextUser } = body.data;
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
      setUser(nextUser);
      toast.success('Account created successfully!');
      return nextUser;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    toast.info('You have been logged out.');
  };

  const updateProfile = async (payload) => {
    try {
      const body = await userApi.updateProfile(payload);
      const nextUser = body.data?.user || body.data;
      setUser(nextUser);
      toast.success('Profile updated.');
      return nextUser;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>.');
  }
  return ctx;
}
