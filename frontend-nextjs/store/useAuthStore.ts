/**
 * Zustand store for authentication state management
 */
import { create } from 'zustand';
import { User, LoginCredentials, RegistrationData, ActivationData } from '@/types/auth';
import authService from '@/services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<{ message: string; email: string }>;
  activate: (data: ActivationData) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;

  // Permissions helpers
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isActive: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  /**
   * Login user
   */
  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      set({
        user: response.user,
        token: response.access_token,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Erreur de connexion',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Register new user
   */
  register: async (data: RegistrationData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);
      set({ isLoading: false });
      return response;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Erreur lors de l\'inscription',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Activate account with OTP
   */
  activate: async (data: ActivationData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.activate(data);
      set({
        user: response.user,
        token: response.access_token,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Erreur lors de l\'activation',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    authService.logout();
    set({ user: null, token: null, error: null });
  },

  /**
   * Load user from localStorage
   */
  loadUser: () => {
    const user = authService.getUserFromStorage();
    const token = authService.getToken();
    if (user && token) {
      set({ user: user as User, token });
    }
  },

  /**
   * Refresh user data from server
   */
  refreshUser: async () => {
    try {
      const user = await authService.getCurrentUser();
      set({ user });
    } catch (error) {
      // Token invalid, logout
      get().logout();
    }
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Check if user has permission
   */
  hasPermission: (permission: string): boolean => {
    const { user } = get();
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has all permissions
    return user.permissions[permission as keyof typeof user.permissions] === true;
  },

  /**
   * Check if user is admin
   */
  isAdmin: (): boolean => {
    const { user } = get();
    return user?.role === 'admin';
  },

  /**
   * Check if user is active
   */
  isActive: (): boolean => {
    const { user } = get();
    return user?.is_active === true && user?.status === 'active';
  },
}));

export default useAuthStore;
