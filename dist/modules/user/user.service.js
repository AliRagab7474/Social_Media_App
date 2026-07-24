"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const security_enum_1 = require("../../common/enums/security.enum");
const services_1 = require("../../common/services");
const exceptions_1 = require("../../common/utils/exceptions");
const enums_1 = require("../../common/enums");
const repository_1 = require("../../DB/repository");
class UserService {
    redis;
    userRepository;
    tokenService;
    s3;
    constructor() {
        this.redis = services_1.redisService;
        this.userRepository = new repository_1.UserRepository;
        this.tokenService = new services_1.TokenService();
        this.s3 = new services_1.S3Service();
    }
    async profile(user) {
        return user.toJSON();
    }
    async deleteProfile(user) {
        const account = await this.userRepository.deleteOne({ filter: { _id: user._id, force: true } });
        if (!account.deletedCount) {
            throw new exceptions_1.NotFoundException("user not found");
        }
        await this.s3.deleteDir({ prefix: `USERS/${user._id.toString()}` });
        return account;
    }
    async profileCoverImages(files, user) {
        const oldpics = user.profileCoverPictures;
        const urls = await this.s3.uploadAssets({
            files,
            path: `USERS/${user._id.toString()}/cover`,
            uploadApproach: enums_1.uploadApproachEnum.LARGE
        });
        user.profileCoverPictures = urls;
        await user.save();
        if (oldpics?.length) {
            await services_1.s3Service.deleteAssets({
                Keys: oldpics.map(ele => { return { Key: ele }; })
            });
        }
        return user.toJSON();
    }
    async profileImage(file, user) {
        const oldpic = user.profilePicture;
        const { key } = await this.s3.uploadSmallAsset({
            file,
            path: `USERS/${user._id.toString()}/profile`,
        });
        user.profilePicture = key;
        await user.save();
        if (oldpic) {
            await services_1.s3Service.deleteAsset({ Key: oldpic });
        }
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
