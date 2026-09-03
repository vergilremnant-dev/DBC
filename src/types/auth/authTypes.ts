export type UserRole =
  | 'ROLE_CUSTOMER'
  | 'ROLE_PROVIDER'
  | 'ROLE_CONTRACTOR'
  | 'ROLE_WORKER'
  | 'ROLE_ARCHITECT'
  | 'ROLE_ADMIN'
  | string

export interface AuthUser {
  id: number
  firstName?: string
  lastName?: string
  email: string
  phone?: string | null
  role: UserRole
  profileImageUrl?: string | null
  status?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  role: string;
  phone?: string;
  preferredCity?: string;
  firebaseUid?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  verificationToken?: string;
}

export interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}
