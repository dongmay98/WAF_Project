export interface User {
  id: string;
  email: string;
  name?: string;
  profilePicture?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
}