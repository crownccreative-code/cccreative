import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('ccc_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('ccc_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const response = await api.login({ email, password });
    localStorage.setItem('ccc_token', response.access_token);
    setUser(response.user);
    return response.user;
  };

  const register = async (name, email, password, phone = null) => {
    const response = await api.register({ name, email, password, phone });
    localStorage.setItem('ccc_token', response.access_token);
    setUser(response.user);
    return response.user;
  };

  const logout = () => {
    localStorage.removeItem('ccc_token');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
