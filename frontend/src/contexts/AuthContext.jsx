import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('olm_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await getMe();
      setUser(res.data?.user || res.data);
    } catch {
      localStorage.removeItem('olm_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
    const handleLogout = () => setUser(null);
    window.addEventListener('olm_logout', handleLogout);
    return () => window.removeEventListener('olm_logout', handleLogout);
  }, [fetchMe]);

  const login = (token, userData) => {
    localStorage.setItem('olm_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('olm_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await getMe();
      setUser(res.data?.user || res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, refreshUser,
      isLoggedIn: !!user,
      isAdmin: user?.role?.toLowerCase() === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
