"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const exceptions_1 = require("../common/utils/exceptions");
const authorization = (accessRoles) => {
    return async (req, res, next) => {
        if (!accessRoles.includes(req.user.role)) {
            throw new exceptions_1.UnauthorizedException("missing authorization");
        }
        next();
    };
};
exports.authorization = authorization;
