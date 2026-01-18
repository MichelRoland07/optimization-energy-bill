/**
 * TypeScript types for authentication system
 */

export interface User {
  id: number;
  email: string;
  full_name: string;
  titre?: string;
  poste: string;
  entreprise?: string;
  role: "admin" | "user";
  status: "pending" | "approved" | "active" | "rejected";
  is_active: boolean;
  permissions: Permissions;
  created_at: string;
  last_login?: string;
}

export interface Permissions {
  view_profil: boolean;
  view_reconstitution: boolean;
  view_optimisation: boolean;
  view_simulateur: boolean;
  upload_data: boolean;
  manage_users: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  email: string;
  full_name: string;
  titre?: string;
  poste: string;
  entreprise?: string;
  telephone?: string;
  raison_demande?: string;
}

export interface ActivationData {
  email: string;
  otp: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PendingUserRequest {
  id: number;
  email: string;
  full_name: string;
  titre?: string;
  poste: string;
  entreprise?: string;
  telephone?: string;
  raison_demande?: string;
  created_at: string;
  status: string;
}

export interface UserSummary {
  id: number;
  email: string;
  full_name: string;
  poste: string;
  role: string;
  status: string;
  created_at: string;
}

// Full user details with all fields (alias for User type)
export type UserWithDetails = User;
