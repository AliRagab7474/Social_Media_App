"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
const client_1 = require("@redis/client");
const config_1 = require("../../config/config");
const enums_1 = require("../enums");
class RedisService {
    client;
    constructor() {
        this.client = (0, client_1.createClient)({ url: config_1.REDIS_URI });
        this.handleEvents();
    }
    async connect() {
        await this.client.connect();
        console.log("redis connected");
    }
    handleEvents() {
        this.client.on("error", (error) => {
            console.log("redis error", error);
        });
    }
    otpKey = ({ email, subject = enums_1.emailEnum.CONFIRM_EMAIL }) => {
        return `OTP::USER::${email}::${subject}`;
    };
    maxTrialKey = ({ email, subject = enums_1.emailEnum.CONFIRM_EMAIL, }) => {
        return `${this.otpKey({ email, subject })}::MaxTrial`;
    };
    blockedOtpKey = ({ email, subject = enums_1.emailEnum.CONFIRM_EMAIL, }) => {
        return `${this.otpKey({ email, subject })}::Blocked`;
    };
    baseRevokeTokenKey = (userId) => {
        return `RevokeToken::${userId.toString()}`;
    };
    revokeTokenKey = ({ userId, jti, }) => {
        return `${this.baseRevokeTokenKey(userId)}::${jti}`;
    };
    set = async ({ key, value, ttl, }) => {
        try {
            const data = typeof value === "string" ? value : JSON.stringify(value);
            if (ttl) {
                await this.client.setEx(key, ttl, data);
            }
            else {
                await this.client.set(key, data);
            }
            return true;
        }
        catch (error) {
            console.error("Redis SET error:", error);
            return false;
        }
    };
    get = async (key) => {
        try {
            const data = await this.client.get(key);
            if (!data)
                return null;
            try {
                return JSON.parse(data);
            }
            catch {
                return data;
            }
        }
        catch (error) {
            console.error("Redis GET error:", error);
            return null;
        }
    };
    update = async ({ key, value, ttl }) => {
        try {
            const exists = await this.client.exists(key);
            if (!exists)
                return false;
            return await this.client.set(key, value);
        }
        catch (error) {
            console.error("Redis UPDATE error:", error);
            return false;
        }
    };
    deleteKey = async (key) => {
        try {
            if (Array.isArray(key)) {
                if (key.length === 0)
                    return false;
                const result = await this.client.del(key);
                return result >= 1;
            }
            const result = await this.client.del(key);
            return result === 1;
        }
        catch (error) {
            console.error("Redis DELETE error:", error);
            return false;
        }
    };
    incr = async (key) => {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            console.error("Redis incr error:", error);
            return false;
        }
    };
    expire = async ({ key, ttl }) => {
        try {
            const result = await this.client.expire(key, ttl);
            return result === 1;
        }
        catch (error) {
            console.error("Redis EXPIRE error:", error);
            return false;
        }
    };
    ttl = async (key) => {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.error("Redis TTL error:", error);
            return -2;
        }
    };
    Keys = async (baseKey) => {
        return await this.client.keys(`${baseKey}*`);
    };
    FCM_key(userId) {
        return `user:FCM:${userId.toString()}`;
    }
    async addFCM(userId, FCMToken) {
        return await this.client.sAdd(this.FCM_key(userId), FCMToken);
    }
    async removeFCM(userId, FCMToken) {
        return await this.client.sRem(this.FCM_key(userId), FCMToken);
    }
    async getFCMs(userId) {
        return await this.client.sMembers(this.FCM_key(userId));
    }
    async hasFCMs(userId) {
        return await this.client.sCard(this.FCM_key(userId));
    }
    async removeFCMUser(userId) {
        return;
    }
}
exports.RedisService = RedisService;
exports.redisService = new RedisService();
