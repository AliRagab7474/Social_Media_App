"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const security_enum_1 = require("../../common/enums/security.enum");
const services_1 = require("../../common/services");
const exceptions_1 = require("../../common/utils/exceptions");
class UserService {
    redis;
    tokenService;
    constructor() {
        this.redis = services_1.redisService;
        this.tokenService = new services_1.TokenService();
    }
    async profile(user) {
        return user.toJSON();
    }
    async logout({ flag }, user, { jti, iat, sub }) {
        let status = 200;
        switch (flag) {
            case security_enum_1.LogoutEnum.ALL:
                user.changeCredentialsTime = new Date();
                await user.save();
                await this.redis.deleteKey(await this.redis.Keys(`RevokeToken::${sub}`));
                break;
            default:
                await this.redis.set({
                    key: `RevokeToken::${sub}::${jti}`,
                    value: jti,
                    ttl: iat + 31536000,
                });
                status = 201;
                break;
        }
        return status;
    }
    async rotateToken(user, { sub, jti, iat }, issuer) {
        if (iat * 1800 * 100 >= Date.now() + 30000) {
            throw new exceptions_1.ConflictException("current access token still valid");
        }
        await this.redis.set({
            key: `RevokeToken::${sub}::${jti}`,
            value: jti,
            ttl: iat + 31536000,
        });
        return await this.tokenService.createLoginCredentials(user, issuer);
    }
}
exports.default = new UserService();
