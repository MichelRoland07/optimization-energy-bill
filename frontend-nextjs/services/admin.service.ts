/**
 * Admin service - API calls for admin functions
 */
import api from '@/lib/api';
import { PendingUserRequest, UserSummary, User, Permissions } from '@/types/auth';

export const adminService = {
  /**
   * Get all pending user requests
   */
  async getPendingRequests(): Promise<PendingUserRequest[]> {
    const response = await api.get<PendingUserRequest[]>('/api/auth/pending-requests');
    return response.data;
  },

  /**
   * Approve user request
   */
  async approveRequest(
    userId: number,
    customPermissions?: Permissions
  ): Promise<{ message: string; otp_sent_to: string; user: UserSummary }> {
    // Always send permissions object (empty if not provided)
    const body = { permissions: customPermissions || {} };
    const response = await api.post(`/api/auth/approve-request/${userId}`, body);
    return response.data;
  },

  /**
   * Reject user request
   */
  async rejectRequest(
    userId: number,
    reason: string
  ): Promise<{ message: string; user: UserSummary }> {
    const response = await api.post(`/api/auth/reject-request/${userId}`, {
      user_id: userId,
      reason,
    });
    return response.data;
  },

  /**
   * Get all users
   */
  async getAllUsers(): Promise<UserSummary[]> {
    const response = await api.get<UserSummary[]>('/api/auth/users');
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User> {
    const response = await api.get<User>(`/api/auth/users/${userId}`);
    return response.data;
  },

  /**
   * Update user permissions
   */
  async updateUserPermissions(userId: number, permissions: Partial<Permissions>): Promise<User> {
    const response = await api.put<User>(`/api/auth/users/${userId}/permissions`, {
      permissions,
    });
    return response.data;
  },

  /**
   * Delete user
   */
  async deleteUser(userId: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/auth/users/${userId}`);
    return response.data;
  },
};

export default adminService;
