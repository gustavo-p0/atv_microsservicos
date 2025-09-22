export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  preferences: {
    defaultStore: string;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  preferences?: {
    defaultStore?: string;
    currency?: string;
  };
}

export interface LoginRequest {
  identifier: string; // email ou username
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: Omit<User, 'password'>;
    token: string;
  };
}
