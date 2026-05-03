import { z } from "zod";
import { generalValidationFields } from "../../common/validation";

export const resendConfirmEmail = {
  body: z.strictObject({
    email: generalValidationFields.email,
  }),
};
export const ConfirmEmail = {
  body: resendConfirmEmail.body.safeExtend({
    otp:generalValidationFields.otp
  }),
};

export const loginSchema = {
  body:resendConfirmEmail.body.safeExtend({
    email: generalValidationFields.email,
    password: generalValidationFields.password,
  }),
};

export const SignupSchema = {
  body: loginSchema.body
    .safeExtend({
      username: generalValidationFields.username,
      confirmPassword: generalValidationFields.confirmPassword,
      phone:generalValidationFields.phone,
      age:generalValidationFields.age,
      gender:generalValidationFields.gender
    })
    .refine(
      (data) => {
        return data.password === data.confirmPassword;
      },
      { error: "password mismatch" },
    ),
};
