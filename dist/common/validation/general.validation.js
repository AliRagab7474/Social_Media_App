"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationValidationSchema = exports.generalValidationFields = void 0;
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
exports.generalValidationFields = {
    id: zod_1.z.string().refine(value => { return mongoose_1.Types.ObjectId.isValid(value); }, "Invalid id"),
    email: zod_1.z.email(),
    password: zod_1.z.string(),
    username: zod_1.z
        .string({ error: "username required" })
        .min(2, { error: "min char is 2" })
        .max(25, { error: "max char is 25" }),
    confirmPassword: zod_1.z.string(),
    phone: zod_1.z.string(),
    age: zod_1.z.number().min(18).max(60),
    gender: zod_1.z.number(),
    otp: zod_1.z.string({ error: "otp is required" }).regex(RegExp(/^\d{6}$/)),
    file: function (mimetype) {
        return zod_1.z
            .strictObject({
            fieldname: zod_1.z.string(),
            originalname: zod_1.z.string(),
            encoding: zod_1.z.string(),
            mimetype: zod_1.z.enum(mimetype),
            buffer: zod_1.z.any().optional(),
            path: zod_1.z.string().optional(),
            size: zod_1.z.number(),
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
exports.paginationValidationSchema = {
    query: zod_1.z.strictObject({
        page: zod_1.z.coerce.number().optional(),
        size: zod_1.z.coerce.number().optional(),
        search: zod_1.z.string().optional(),
    })
};
