import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import api, { getAuthToken, setAuthToken, removeAuthToken, initializeCsrf, resetCsrf, isCookieAuthEnabled } from '@/lib/api';

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
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configuration du refresh automatique
const TOKEN_REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const INACTIVITY_THRESHOLD_MS = 60 * 60 * 1000; // 1 heure sans activité = pas de refresh

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs pour le tracking d'activité et les timers
  const lastActivityRef = useRef<number>(Date.now());
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef<boolean>(false);

  // Mettre à jour le timestamp de dernière activité
  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Vérifier si l'utilisateur est actif récemment
  const isUserActive = useCallback(() => {
    return Date.now() - lastActivityRef.current < INACTIVITY_THRESHOLD_MS;
  }, []);

  // Rafraîchir la session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    // Éviter les appels simultanés
    if (isRefreshingRef.current) {
      return false;
    }

    // Ne pas rafraîchir si l'utilisateur est inactif
    if (!isUserActive()) {
      console.log('[Auth] Utilisateur inactif, skip du refresh');
      return false;
    }

    isRefreshingRef.current = true;

    try {
      const response = await api.post('/auth/refresh');
      
      // Si le backend renvoie un nouveau token (mode Bearer), le sauvegarder
      if (!isCookieAuthEnabled() && response.data?.token) {
        setAuthToken(response.data.token);
      }
      
      console.log('[Auth] Session rafraîchie avec succès');
      
      // Recharger les données utilisateur
      const userResponse = await api.get('/auth/user');
      setUser(userResponse.data);
      
      return true;
    } catch (error) {
      console.error('[Auth] Erreur lors du rafraîchissement:', error);
      // En cas d'erreur 401, la session a expiré
      if ((error as any)?.response?.status === 401) {
        removeAuthToken();
        resetCsrf();
        setUser(null);
      }
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [isUserActive]);

  // Démarrer le timer de refresh automatique
  const startRefreshTimer = useCallback(() => {
    // Nettoyer l'ancien timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // Créer un nouveau timer
    refreshTimerRef.current = setInterval(async () => {
      if (user && isUserActive()) {
        await refreshSession();
      }
    }, TOKEN_REFRESH_INTERVAL_MS);
  }, [user, isUserActive, refreshSession]);

  // Arrêter le timer de refresh
  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Tracking des événements utilisateur pour détecter l'activité
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateLastActivity();
    };

    // Ajouter les listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [updateLastActivity]);

  // Gérer le timer de refresh basé sur l'état d'authentification
  useEffect(() => {
    if (user) {
      startRefreshTimer();
    } else {
      stopRefreshTimer();
    }

    return () => {
      stopRefreshTimer();
    };
  }, [user, startRefreshTimer, stopRefreshTimer]);

  // Refresh quand l'onglet redevient visible après une période d'inactivité
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        // Si l'onglet redevient visible, vérifier la session
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        
        // Si plus de 5 minutes d'inactivité, rafraîchir
        if (timeSinceLastActivity > 5 * 60 * 1000) {
          console.log('[Auth] Onglet redevenu visible, vérification de la session');
          await refreshSession();
        }
        
        updateLastActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshSession, updateLastActivity]);

  // Vérifier la session au chargement
  const checkAuthStatus = useCallback(async () => {
    try {
      // Essayer de récupérer l'utilisateur (la session cookie sera envoyée automatiquement)
      const response = await api.get('/auth/user');
      setUser(response.data);
      updateLastActivity();
    } catch {
      // Pas de session valide, vérifier le token localStorage (fallback)
      const token = getAuthToken();
      if (token) {
        try {
          const response = await api.get('/auth/user');
          setUser(response.data);
          updateLastActivity();
        } catch {
          removeAuthToken();
          setUser(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [updateLastActivity]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // IMPORTANT: Initialiser le CSRF AVANT le login (Sanctum SPA)
      try {
        await initializeCsrf();
      } catch (csrfError) {
        console.warn('[Auth] Échec CSRF, tentative avec Bearer token');
        // Continue anyway, le backend peut supporter Bearer token en fallback
      }

      // Appel de login
      const response = await api.post('/auth/login', { email, password });

      // Récupérer et stocker le token (si le backend le renvoie - mode Bearer)
      const token =
        response.data?.token ??
        response.data?.access_token ??
        response.data?.plainTextToken ??
        response.data?.plain_text_token ??
        response.data?.data?.token ??
        response.data?.data?.access_token;

      if (token) {
        setAuthToken(token);
      }

      // Récupérer les infos utilisateur
      try {
        const userResponse = await api.get('/auth/user');
        setUser(userResponse.data);
        updateLastActivity();
        return { success: true };
      } catch (verifyError: any) {
        removeAuthToken();
        resetCsrf();
        setUser(null);

        if (verifyError?.response?.status === 401) {
          return {
            success: false,
            error: "Session invalide. Vérifiez la configuration du backend.",
          };
        }

        throw verifyError;
      }
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
        (status === 419
          ? 'Session CSRF expirée. Rechargez la page.'
          : status === 500
            ? 'Erreur serveur (500). Vérifiez les logs du backend.'
            : status
              ? `Erreur (${status}) lors de la connexion.`
              : 'Erreur de connexion');

      return { success: false, error: message };
    }
  };

  const logout = async () => {
    stopRefreshTimer();
    
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      removeAuthToken();
      resetCsrf();
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
