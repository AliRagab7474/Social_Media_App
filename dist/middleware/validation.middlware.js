"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = void 0;
const exceptions_1 = require("../common/exceptions");
const validation = (schema) => {
    return (req, res, next) => {
        const issues = [];
        for (const key of Object.keys(schema)) {
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                issues.push({ key, issues: validationResult.error });
            }
        }
        if (issues.length) {
            throw new exceptions_1.BadRequestException("validation Error", { issues });
        }
        next();
    };
};
exports.validation = validation;
