import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  role: string;
  actif: boolean;
  roles?: { name: string }[];
  permissions?: { name: string }[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier la session au chargement (le cookie HttpOnly est envoyé automatiquement)
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Le cookie HttpOnly est envoyé automatiquement avec withCredentials: true
      const response = await api.get('/auth/user');
      setUser(response.data);
    } catch {
      // Non authentifié ou cookie expiré
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData } = response.data;
      
      // Le token est maintenant dans un cookie HttpOnly (géré par le backend)
      // On stocke seulement les données utilisateur en mémoire
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      const status = error.response?.status as number | undefined;
      const data = error.response?.data;

      const validationEmailError = typeof data === 'object' ? data?.errors?.email?.[0] : undefined;
      const backendMessage =
        typeof data === 'object'
          ? (data?.message as string | undefined) || (data?.error as string | undefined)
          : undefined;

      const message =
        validationEmailError ||
        backendMessage ||
        (status === 500
          ? 'Erreur serveur (500). Vérifiez les logs du backend.'
          : status
            ? `Erreur (${status}) lors de la connexion.`
            : 'Erreur de connexion');

      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Le backend supprime le cookie, on nettoie juste l'état local
      setUser(null);
    }
  };

  const refreshSession = async () => {
    try {
      await api.post('/auth/refresh');
      // Recharger les données utilisateur
      await checkAuthStatus();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de session:', error);
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.some(p => p.name === permission) || false;
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    if (user.role === role) return true;
    return user.roles?.some(r => r.name === role) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        hasPermission,
        hasRole,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
