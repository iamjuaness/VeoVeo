import { object, string, TypeOf } from "zod";

export const registerSchema = object({
  body: object({
    name: string().nonempty("Name is required"),
    email: string().nonempty("Email is required").email("Invalid email"),
    password: string()
      .nonempty("Password is required")
      .min(8, "Min 8 chars")
      .max(64, "Max 64 chars"),
    passwordConfirm: string().nonempty("Please confirm your password"),
    selectedAvatar: string().nonempty("Please select an avatar"),
  }).refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords don't match",
  }),
});

export const loginSchema = object({
  body: object({
    email: string().nonempty("Email is required").email(),
    password: string().nonempty("Password is required"),
  }),
});

export type RegisterInput = TypeOf<typeof registerSchema>["body"];
export type LoginInput = TypeOf<typeof loginSchema>["body"];

export const updateUserSchema = object({
  body: object({
    name: string().optional(),
    email: string().email().optional(),
    bio: string().optional(),
    selectedAvatar: string().optional(),
    notificationPreferences: object({
      email: object({ type: string(), default: string() })
        .optional()
        .transform(() => undefined), // HACK: for complex objects in zod if needed, but let's keep it simple
    }).optional(),
  }),
});

// A more robust schema for settings
const boolOpt = object({}).optional(); // simplified for now, as zod objects can be complex for deep partials

export const updateProfileSchema = object({
  body: object({
    name: string().optional(),
    email: string().email().optional(),
    bio: string().optional(),
    selectedAvatar: string().optional(),
  }),
});

export const updateSettingsSchema = object({
  body: object({
    notificationPreferences: object({
      email: object({}).optional(), // placeholder, let's use a more direct approach in controller for now or refine later
      push: object({}).optional(),
      weekly: object({}).optional(),
    }).optional(),
    privacyPreferences: object({
      publicProfile: object({}).optional(),
      showActivity: object({}).optional(),
      dataAnalytics: object({}).optional(),
    }).optional(),
    appearancePreferences: object({
      theme: string().optional(),
      language: string().optional(),
      region: string().optional(),
    }).optional(),
  }),
});
