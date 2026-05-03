"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalValidationFields = void 0;
const zod_1 = require("zod");
exports.generalValidationFields = {
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
    otp: zod_1.z.string({ error: "otp is required" }).regex(RegExp(/^\d{6}$/))
};
