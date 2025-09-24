export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  role: string;
  tenant?: {
    _id: string;
    name: string;
    slug: string;
    subscription: {
      plan: 'free' | 'pro' | 'enterprise';
      limits: {
        logs_per_month: number;
        endpoints: number;
        custom_rules: number;
      };
    };
  };
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
