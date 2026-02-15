import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import authService, { AuthUser, TwoFactorRequired, ApiError } from '../services/authService';
import { tokenStorage } from '../services/api';

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  twoFactorPending: { tempToken: string } | null;
  login: (email: string, password: string) => Promise<void>;
  verifyTwoFactor: (code: string) => Promise<void>;
  cancelTwoFactor: () => void;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to check if error is ApiError
function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [twoFactorPending, setTwoFactorPending] = useState<{ tempToken: string } | null>(null);

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser();
          setCurrentUser(user);
        } catch {
          // Token might be expired, try to refresh
          try {
            const response = await authService.refreshToken();
            setCurrentUser(response.user);
          } catch {
            // Refresh failed, clear tokens
            tokenStorage.clearTokens();
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!currentUser) return;

    // Refresh token every 14 minutes (assuming 15 min token expiry)
    const refreshInterval = setInterval(async () => {
      try {
        await authService.refreshToken();
      } catch {
        // If refresh fails, log out
        setCurrentUser(null);
        tokenStorage.clearTokens();
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [currentUser]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const response = await authService.login({ email, password });

      // Check if 2FA is required
      if ('twoFactorRequired' in response && response.twoFactorRequired) {
        const twoFaResponse = response as TwoFactorRequired;
        setTwoFactorPending({ tempToken: twoFaResponse.tempToken });
        return;
      }

      setCurrentUser(response.user);
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to sign in';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const verifyTwoFactor = useCallback(async (code: string) => {
    if (!twoFactorPending) {
      throw new Error('No 2FA verification pending');
    }

    setError(null);
    try {
      const response = await authService.verifyTwoFactor(twoFactorPending.tempToken, code);
      setCurrentUser(response.user);
      setTwoFactorPending(null);
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Invalid verification code';
      setError(message);
      throw new Error(message);
    }
  }, [twoFactorPending]);

  const cancelTwoFactor = useCallback(() => {
    setTwoFactorPending(null);
    setError(null);
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    setError(null);
    try {
      const response = await authService.register({
        email,
        password,
        firstName,
        lastName,
      });
      setCurrentUser(response.user);
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to create account';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setCurrentUser(null);
      setTwoFactorPending(null);
      setError(null);
    }
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    twoFactorPending,
    login,
    verifyTwoFactor,
    cancelTwoFactor,
    signup,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
