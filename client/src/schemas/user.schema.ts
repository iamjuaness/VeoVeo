import { object, string, TypeOf } from "zod";

export const registerSchema = object({
  body: object({
    name: string({ required_error: 'Name is required' }),
    email: string({ required_error: 'Email is required' }).email('Invalid email'),
    password: string({ required_error: 'Password is required' })
      .min(8, 'Min 8 chars')
      .max(64, 'Max 64 chars'),
    passwordConfirm: string({ required_error: 'Please confirm your password' }),
    selectedAvatar: string({ required_error: 'Please select an avatar' })
  }).refine(data => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: "Passwords don't match"
  })
});

export const loginSchema = object({
  body: object({
    email: string({ required_error: 'Email is required' }).email(),
    password: string({ required_error: 'Password is required' })
  })
});

export type RegisterInput = TypeOf<typeof registerSchema>['body'];
export type LoginInput = TypeOf<typeof loginSchema>['body'];
