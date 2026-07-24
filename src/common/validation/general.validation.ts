import { Types } from "mongoose";
import { z } from "zod";

export const generalValidationFields = {
  id:z.string().refine(value=>{return Types.ObjectId.isValid(value)},"Invalid id"),
  email: z.email(),
  password: z.string(),
  username: z
    .string({ error: "username required" })
    .min(2, { error: "min char is 2" })
    .max(25, { error: "max char is 25" }),
  confirmPassword: z.string(),
  phone: z.string(),
  age: z.number().min(18).max(60),
  gender: z.number(),
  otp: z.string({ error: "otp is required" }).regex(RegExp(/^\d{6}$/)),
  file: function (mimetype: string[]) {
    return z
      .strictObject({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.enum(mimetype),
        buffer: z.any().optional(),
        path: z.string().optional(),
        size: z.number(),
      })
      .superRefine((args, ctx) => {
        if (!args.path && !args.buffer) {
          ctx.addIssue({
            code: "custom",
            message: "buffer is required",
            path: ["buffer"],
          });
        }
      });
  },
};

export const paginationValidationSchema = {
    query: z.strictObject({
        page: z.coerce.number().optional(),
        size: z.coerce.number().optional(),
        search: z.string().optional(),
    })
}

export type PaginateDto = z.infer<typeof paginationValidationSchema.query>
