/**
 * Authentication service - API calls
 */
import api from '@/lib/api';
import {
  LoginCredentials,
  RegistrationData,
  ActivationData,
  AuthResponse,
  User,
  PendingUserRequest,
  UserSummary,
  Permissions,
} from '@/types/auth';

export const authService = {
  /**
   * Register new user
   */
  async register(data: RegistrationData): Promise<{ message: string; status: string; email: string }> {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);

    // Store token and user in localStorage and cookie
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Also set cookie for middleware
      document.cookie = `access_token=${response.data.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
    }

    return response.data;
  },

  /**
   * Activate account with OTP
   */
  async activate(data: ActivationData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/activate', data);

    // Store token and user in localStorage and cookie
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Also set cookie for middleware
      document.cookie = `access_token=${response.data.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
    }

    return response.data;
  },

  /**
   * Resend OTP code
   */
  async resendOTP(email: string): Promise<{ message: string }> {
    const response = await api.post('/api/auth/resend-otp', { email });
    return response.data;
  },

  /**
   * Logout (clear local storage and cookies)
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      // Clear cookie
      document.cookie = 'access_token=; path=/; max-age=0';

      window.location.href = '/login';
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');

    // Update user in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
  },

  /**
   * Get user from localStorage
   */
  getUserFromStorage(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  },

  /**
   * Get token from localStorage
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  },
};

export default authService;
