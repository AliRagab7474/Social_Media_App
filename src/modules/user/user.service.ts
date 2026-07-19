import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interfaces";
import { LogoutEnum } from "../../common/enums/security.enum";
import {
  redisService,
  RedisService,
  s3Service,
  S3Service,
  TokenService,
} from "../../common/services";
import { ConflictException } from "../../common/utils/exceptions";
import { uploadApproachEnum } from "../../common/enums";

class UserService {
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;
  private readonly s3: S3Service;

  constructor() {
    this.redis = redisService;
    this.tokenService = new TokenService();
    this.s3 = new S3Service();
  }

  async profile(user: HydratedDocument<IUser>): Promise<IUser> {
    return user.toJSON();
  }


  async profileCoverImages(
    files: Express.Multer.File[],
    user: HydratedDocument<IUser>,
  ): Promise<IUser> {
    const oldpics = user.profileCoverPictures
    const urls = await this.s3.uploadAssets({
      files,
      path: `USERS/${user._id.toString()}/cover`,
      uploadApproach : uploadApproachEnum.LARGE
    });
    user.profileCoverPictures = urls 
    await user.save();

       if (oldpics?.length) {
        await s3Service.deleteAssets({
          Keys:oldpics.map(ele=>{return {Key:ele}})
        })
    }

    return user.toJSON();
  }

  async profileImage(
    file: Express.Multer.File,
    user: HydratedDocument<IUser>,
  ): Promise<IUser> {
    const oldpic = user.profilePicture
   const {key} = await this.s3.uploadSmallAsset({
      file,
      path: `USERS/${user._id.toString()}/profile`,
    });
    user.profilePicture = key as string
    await user.save();

    if (oldpic) {
      await s3Service.deleteAsset({Key:oldpic})
    }

    return user.toJSON();
  }

  public async logout(
    { flag }: { flag: LogoutEnum },
    user: HydratedDocument<IUser>,
    { jti, iat, sub }: { jti: string; iat: number; sub: string },
  ): Promise<number> {
    let status = 200;
    switch (flag) {
      case LogoutEnum.ALL:
        user.changeCredentialsTime = new Date();
        await user.save();
        await this.redis.deleteKey(
          await this.redis.Keys(`RevokeToken::${sub}`),
        );
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

  public async rotateToken(
    user: HydratedDocument<IUser>,
    { sub, jti, iat }: { sub: string; jti: string; iat: number },
    issuer: string,
  ) {
    if (iat * 1800 * 100 >= Date.now() + 30000) {
      throw new ConflictException("current access token still valid");
    }
    await this.redis.set({
      key: `RevokeToken::${sub}::${jti}`,
      value: jti,
      ttl: iat + 31536000,
    });
    return await this.tokenService.createLoginCredentials(user, issuer);
  }
}

export default new UserService();
