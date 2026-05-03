"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const exceptions_1 = require("../common/utils/exceptions");
const services_1 = require("../common/services");
const security_enum_1 = require("../common/enums/security.enum");
const authentication = (tokenType = security_enum_1.TokenTypeEnum.ACCESS) => {
    return async (req, res, next) => {
        const tokenService = new services_1.TokenService();
        const [schema, credentials] = req.headers?.authorization?.split(" ") || [];
        if (!schema || !credentials) {
            throw new exceptions_1.UnauthorizedException("missing authentication or missing approach");
        }
        switch (schema) {
            case "Basic":
                const [email, password] = Buffer.from(credentials, "base64").toString().split(":");
                console.log({ email, password });
                break;
            default:
                await tokenService.decodeToken({
                    token: credentials,
                    tokenType,
                });
                const { user, decoded } = await tokenService.decodeToken({ token: credentials, tokenType });
                req.user = user;
                req.decoded = decoded;
                break;
        }
        next();
    };
};
exports.authentication = authentication;
