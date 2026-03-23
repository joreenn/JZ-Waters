/**
 * Auth Context - manages authentication state across the app
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const readCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const found = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split('=')[1]) : null;
};

const writeCookie = (name, value, days = 7) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY) || readCookie(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        setToken(savedToken);
        localStorage.setItem(TOKEN_KEY, savedToken);
        writeCookie(TOKEN_KEY, savedToken);
        connectSocket(savedToken);

        const meRes = await api.get('/auth/me');
        setUser(meRes.data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(meRes.data.user));
      } catch {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        deleteCookie(TOKEN_KEY);
        disconnectSocket();
        if (savedUser) {
          localStorage.removeItem(USER_KEY);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    writeCookie(TOKEN_KEY, newToken);
    connectSocket(newToken);
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    writeCookie(TOKEN_KEY, newToken);
    connectSocket(newToken);
    return userData;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    deleteCookie(TOKEN_KEY);
    disconnectSocket();
  }, []);

  const updateUser = useCallback((data) => {
    setUser(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
