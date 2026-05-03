import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interfaces";
import { LogoutEnum } from "../../common/enums/security.enum";
import { redisService, RedisService, TokenService } from "../../common/services";
import { ConflictException } from "../../common/utils/exceptions";

class UserService {
  private readonly redis:RedisService
  private readonly tokenService:TokenService

    constructor() {this.redis = redisService
        this.tokenService = new TokenService()
    }


  async profile(user: HydratedDocument<IUser>): Promise<IUser> {
    return user.toJSON();
  }

  public async logout({flag}:{flag:LogoutEnum}, user:HydratedDocument<IUser>, { jti, iat, sub }:{jti:string, iat:number,sub:string}):Promise<number> {
    let status = 200;
    switch (flag) {
      case LogoutEnum.ALL:
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

  public async rotateToken(user:HydratedDocument<IUser>, { sub, jti, iat }:{sub:string,jti:string,iat:number},issuer:string) {
    if (iat * 1800 * 100 >= Date.now() + 30000) {
      throw new ConflictException("current access token still valid");
    }
    await this.redis.set({
      key: `RevokeToken::${sub}::${jti}`,
      value: jti,
      ttl:iat + 31536000,
    });
    return await this.tokenService.createLoginCredentials(user,issuer);
  }
}

export default new UserService();
