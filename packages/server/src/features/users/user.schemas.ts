import { object, string, TypeOf } from "zod";

export const registerSchema = object({
  body: object({
    name: string().nonempty('Name is required'),
    email: string().nonempty('Email is required').email('Invalid email'),
    password: string()
      .nonempty('Password is required')
      .min(8, 'Min 8 chars')
      .max(64, 'Max 64 chars'),
    passwordConfirm: string().nonempty('Please confirm your password'),
    selectedAvatar: string().nonempty('Please select an avatar'),
  }).refine(data => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: "Passwords don't match"
  })
});

export const loginSchema = object({
  body: object({
    email: string().nonempty('Email is required').email(),
    password: string().nonempty('Password is required')
  })
});

export type RegisterInput = TypeOf<typeof registerSchema>['body'];
export type LoginInput = TypeOf<typeof loginSchema>['body'];
