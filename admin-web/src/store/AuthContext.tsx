import React, { createContext, useContext, useState, useEffect } from 'react';
import adminAuthService, { AdminUser, AdminLoginResponse } from '../services/auth.service';

interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { email: string; password: string; mfaCode?: string }) => Promise<AdminLoginResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = adminAuthService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await adminAuthService.me();
        if (data.user && data.user.role === 'ADMIN') {
          setAdmin(data.user);
        } else {
          adminAuthService.setToken(null);
        }
      } catch {
        adminAuthService.setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string; mfaCode?: string }): Promise<AdminLoginResponse> => {
    const res = await adminAuthService.login(credentials);
    if (!res.mfaRequired && res.user) {
      setAdmin(res.user);
    }
    return res;
  };

  const logout = async () => {
    await adminAuthService.logout();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        loading,
        login,
        logout,
      }}
    >
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

export default AuthContext;
