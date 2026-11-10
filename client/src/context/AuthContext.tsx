import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hospital_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('hospital_access_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: loggedInUser, tokens } = res.data.data;
      localStorage.setItem('hospital_access_token', tokens.accessToken);
      localStorage.setItem('hospital_refresh_token', tokens.refreshToken);
      setToken(tokens.accessToken);
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      const { user: registeredUser, tokens } = res.data.data;
      localStorage.setItem('hospital_access_token', tokens.accessToken);
      localStorage.setItem('hospital_refresh_token', tokens.refreshToken);
      setToken(tokens.accessToken);
      setUser(registeredUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('hospital_refresh_token');
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('hospital_access_token');
    localStorage.removeItem('hospital_refresh_token');
    setUser(null);
    setToken(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    const credentials: Record<UserRole, { email: string; pass: string }> = {
      [UserRole.SUPER_ADMIN]: { email: 'superadmin@hospital.com', pass: 'Admin@12345' },
      [UserRole.HOSPITAL_ADMIN]: { email: 'admin@hospital.com', pass: 'Admin@12345' },
      [UserRole.DOCTOR]: { email: 'doctor@hospital.com', pass: 'Doctor@12345' },
      [UserRole.RECEPTIONIST]: { email: 'receptionist@hospital.com', pass: 'Staff@12345' },
      [UserRole.PATIENT]: { email: 'patient@hospital.com', pass: 'Patient@12345' },
      [UserRole.ACCOUNTANT]: { email: 'accountant@hospital.com', pass: 'Account@12345' }
    };

    const creds = credentials[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
