"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignupSchema = exports.loginSchema = exports.ConfirmEmail = exports.resendConfirmEmail = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
exports.resendConfirmEmail = {
    body: zod_1.z.strictObject({
        email: validation_1.generalValidationFields.email,
    }),
};
exports.ConfirmEmail = {
    body: exports.resendConfirmEmail.body.safeExtend({
        otp: validation_1.generalValidationFields.otp
    }),
};
exports.loginSchema = {
    body: exports.resendConfirmEmail.body.safeExtend({
        email: validation_1.generalValidationFields.email,
        password: validation_1.generalValidationFields.password,
        FCM: zod_1.z.string().optional()
    }),
};
exports.SignupSchema = {
    body: exports.loginSchema.body
        .safeExtend({
        username: validation_1.generalValidationFields.username,
        confirmPassword: validation_1.generalValidationFields.confirmPassword,
        phone: validation_1.generalValidationFields.phone,
        age: validation_1.generalValidationFields.age,
        gender: validation_1.generalValidationFields.gender
    })
        .refine((data) => {
        return data.password === data.confirmPassword;
    }, { error: "password mismatch" }),
};
