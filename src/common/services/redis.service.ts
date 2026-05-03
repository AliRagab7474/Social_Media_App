import { createClient } from "@redis/client";
import { RedisClientType } from "redis";
import { REDIS_URI } from "../../config/config";
import { emailEnum } from "../enums";
import { Types } from "mongoose";

type RedisKeyType = { email: string; subject?: emailEnum };

export class RedisService {
  private readonly client: RedisClientType;

  constructor() {
    this.client = createClient({ url: REDIS_URI });
    this.handleEvents();
  }
  public async connect() {
    await this.client.connect();
    console.log("redis connected");
  }
  private handleEvents() {
    this.client.on("error", (error) => {
      console.log("redis error", error);
    });
  }

  otpKey = ({ email, subject = emailEnum.CONFIRM_EMAIL }: RedisKeyType):string => {
    return `OTP::USER::${email}::${subject}`;
  };

  maxTrialKey = ({
    email,
    subject = emailEnum.CONFIRM_EMAIL,
  }: RedisKeyType):string => {
    return `${this.otpKey({ email, subject })}::MaxTrial`;
  };

  blockedOtpKey = ({
    email,
    subject = emailEnum.CONFIRM_EMAIL,
  }: RedisKeyType):string => {
    return `${this.otpKey({ email, subject })}::Blocked`;
  };

  baseRevokeTokenKey = (userId: Types.ObjectId | string):string => {
    return `RevokeToken::${userId.toString()}`;
  };

  revokeTokenKey = ({
    userId,
    jti,
  }: {
    userId: Types.ObjectId | string;
    jti: string;
  }):string => {
    return `${this.baseRevokeTokenKey(userId)}::${jti}`;
  };

  set = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: any;
    ttl: number;
  }): Promise<string|boolean> => {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      if (ttl) {
        // ttl by seconds
        await this.client.setEx(key, ttl, data);
      } else {
        await this.client.set(key, data);
      }
      return true;
    } catch (error) {
      console.error("Redis SET error:", error);
      return false;
    }
  };


  get = async (key:string):Promise<string|null> => {
    try {
      const data = await this.client.get(key);
      if (!data) return null;

      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch (error) {
      console.error("Redis GET error:", error);
      return null;
    }
  };

  update = async ({ key, value, ttl } : {
    key: string;
    value: string;
    ttl: number;
  }) => {
    try {
      const exists = await this.client.exists(key);
      if (!exists) return false;
      return await this.client.set(key, value);
    } catch (error) {
      console.error("Redis UPDATE error:", error);
      return false;
    }
  };

  deleteKey = async (key:(string|string[])):Promise<boolean|[]> => {
    try {
      // handle both a single key and an array of keys
      if (Array.isArray(key)) {
        if (key.length === 0) return false;
        const result = await this.client.del(key);
        return result >= 1;
      }
      const result = await this.client.del(key);
      return result === 1;
    } catch (error) {
      console.error("Redis DELETE error:", error);
      return false;
    }
  };

  incr = async (key:string):Promise<string|boolean|number> => {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error("Redis incr error:", error);
      return false;
    }
  };

  expire = async ({ key, ttl } : {
    key: string;
    ttl: number;
  }):Promise<boolean> => {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error("Redis EXPIRE error:", error);
      return false;
    }
  };

  ttl = async (key:string):Promise<number> => {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error("Redis TTL error:", error);
      return -2;
    }
  };

  Keys = async (baseKey:string):Promise<string[]> => {
    return await this.client.keys(`${baseKey}*`);
  };
}

export const redisService = new RedisService();
