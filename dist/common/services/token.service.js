"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config/config");
const security_enum_1 = require("../enums/security.enum");
const enums_1 = require("../enums");
const exceptions_1 = require("../utils/exceptions");
const repository_1 = require("../../DB/repository");
const redis_service_1 = require("./redis.service");
class TokenService {
    userRepository;
    redis;
    constructor() {
        this.userRepository = new repository_1.UserRepository(),
            this.redis = redis_service_1.redisService;
    }
    sign = async ({ payload, secret = config_1.USER_ACCESS_TOKEN_SIGNATURE, options, }) => {
        return jsonwebtoken_1.default.sign(payload, secret, options);
    };
    verify = async ({ token, secret = config_1.USER_ACCESS_TOKEN_SIGNATURE, }) => {
        return jsonwebtoken_1.default.verify(token, secret);
    };
    roleSIG = async (role) => {
        let signature;
        switch (role) {
            case enums_1.RoleEnum.ADMIN:
                signature = {
                    accessSignature: config_1.ADMIN_ACCESS_TOKEN_SIGNATURE,
                    refreshSignature: config_1.ADMIN_REFRESH_TOKEN_SIGNATURE,
                };
                break;
            default:
                signature = {
                    accessSignature: config_1.USER_ACCESS_TOKEN_SIGNATURE,
                    refreshSignature: config_1.USER_REFRESH_TOKEN_SIGNATURE,
                };
                break;
        }
        return signature;
    };
    tokenSIG = async ({ tokenType = security_enum_1.TokenTypeEnum.ACCESS, role, }) => {
        let { accessSignature, refreshSignature } = await this.roleSIG(role);
        let signature = undefined;
        switch (tokenType) {
            case security_enum_1.TokenTypeEnum.ACCESS:
                signature = accessSignature;
                break;
            default:
                signature = refreshSignature;
                break;
        }
        return signature;
    };
    decodeToken = async ({ token, tokenType = security_enum_1.TokenTypeEnum.ACCESS, }) => {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded?.aud?.length) {
            throw new exceptions_1.BadRequestException("Missing audience");
        }
        const [tokenApproach, role] = decoded.aud || [];
        if (tokenApproach == undefined || role == undefined) {
            throw new exceptions_1.BadRequestException("Missing audience");
        }
        if (tokenType !== tokenApproach) {
            throw new exceptions_1.ConflictException("unexpected token mechanism");
        }
        if (decoded.jti &&
            (await this.redis.get(`RevokeToken::${decoded.sub}::${decoded.jti}`))) {
            throw new exceptions_1.UnauthorizedException("Invalid login session");
        }
        let secret = await this.tokenSIG({ tokenType: tokenApproach, role: role });
        const verifyData = await this.verify({ token, secret });
        const user = await this.userRepository.findOne({
            filter: { _id: verifyData.sub },
        });
        if (!user) {
            throw new exceptions_1.NotFoundException("user not found");
        }
        if (user.changeCredentialsTime &&
            user.changeCredentialsTime.getTime() >= (decoded.iat || 0) * 1000) {
            throw new exceptions_1.BadRequestException("invalid login session");
        }
        return { user, decoded };
    };
    createLoginCredentials = async (user, issuer) => {
        let { accessSignature, refreshSignature } = await this.roleSIG(user.role);
        const access_token = await this.sign({
            payload: { sub: user.id },
            secret: accessSignature,
            options: {
                audience: [security_enum_1.TokenTypeEnum.ACCESS, user.role],
                expiresIn: config_1.ACCESS_TOKEN_EXPIRES_IN,
                jwtid: crypto.randomUUID(),
            },
        });
        const refresh_token = await this.sign({
            payload: { sub: user.id },
            secret: refreshSignature,
            options: {
                audience: [security_enum_1.TokenTypeEnum.REFRESH, user.role],
                expiresIn: config_1.REFRESH_TOKEN_EXPIRES_IN,
                jwtid: crypto.randomUUID(),
            },
        });
        return { access_token, refresh_token };
    };
}
exports.TokenService = TokenService;
