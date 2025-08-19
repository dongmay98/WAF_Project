import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    profilePicture: z.string().optional(),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type LoginResponseDto = z.infer<typeof LoginResponseSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});
export type RegisterRequestDto = z.infer<typeof RegisterRequestSchema>;

export const RegisterResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
  }),
});
export type RegisterResponseDto = z.infer<typeof RegisterResponseSchema>;