import { authApi, tokenStorage, parseApiError, ApiError } from './api';

export type { ApiError };

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface TwoFactorRequired {
  twoFactorRequired: true;
  tempToken: string;
}

const authService = {
  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse | TwoFactorRequired> {
    try {
      const response = await authApi.post<AuthResponse | TwoFactorRequired>(
        '/api/v1/auth/login',
        data
      );

      // Check if 2FA is required
      if ('twoFactorRequired' in response.data && response.data.twoFactorRequired) {
        return response.data;
      }

      const authResponse = response.data as AuthResponse;
      tokenStorage.setTokens(authResponse.accessToken, authResponse.refreshToken);
      return authResponse;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Complete 2FA login
   */
  async verifyTwoFactor(tempToken: string, code: string): Promise<AuthResponse> {
    try {
      const response = await authApi.post<AuthResponse>('/api/v1/auth/login/2fa', {
        tempToken,
        code,
      });
      tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await authApi.post<AuthResponse>('/api/v1/auth/register', data);
      tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    try {
      await authApi.post('/api/v1/auth/logout');
    } catch {
      // Ignore errors on logout - clear tokens anyway
    } finally {
      tokenStorage.clearTokens();
    }
  },

  /**
   * Refresh the access token
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authApi.post<AuthResponse>('/api/v1/auth/token/refresh', {
        refreshToken,
      });
      tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    } catch (error) {
      tokenStorage.clearTokens();
      throw parseApiError(error);
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<AuthUser> {
    try {
      const response = await authApi.get<AuthUser>('/api/v1/auth/me');
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Get all active sessions for the current user
   */
  async getSessions(): Promise<Session[]> {
    try {
      const response = await authApi.get<Session[]>('/api/v1/auth/sessions');
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      await authApi.delete(`/api/v1/auth/sessions/${sessionId}`);
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Revoke all sessions except the current one
   */
  async revokeAllSessions(): Promise<void> {
    try {
      await authApi.delete('/api/v1/auth/sessions');
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Check if user has valid tokens stored
   */
  isAuthenticated(): boolean {
    return tokenStorage.hasTokens();
  },
};

export default authService;
