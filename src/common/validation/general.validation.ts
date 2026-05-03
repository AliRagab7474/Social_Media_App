import { z } from "zod";

export const generalValidationFields = {
  email: z.email(),
  password: z.string(),
  username: z
    .string({ error: "username required" })
    .min(2, { error: "min char is 2" })
    .max(25, { error: "max char is 25" }),
  confirmPassword: z.string(),
  phone:z.string(),
  age:z.number().min(18).max(60),
  gender:z.number(),
  otp:z.string({error:"otp is required"}).regex(RegExp(/^\d{6}$/))
};
