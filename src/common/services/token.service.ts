import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import {
    ACCESS_TOKEN_EXPIRES_IN,
  ADMIN_ACCESS_TOKEN_SIGNATURE,
  ADMIN_REFRESH_TOKEN_SIGNATURE,
  REFRESH_TOKEN_EXPIRES_IN,
  USER_ACCESS_TOKEN_SIGNATURE,
  USER_REFRESH_TOKEN_SIGNATURE,
} from "../../config/config";
import { TokenTypeEnum } from "../enums/security.enum";
import { RoleEnum } from "../enums";
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "../utils/exceptions";
import { UserRepository } from "../../DB/repository";
import { redisService, RedisService } from "./redis.service";
import { HydratedDocument } from "mongoose";
import { IUser } from "../interfaces";
import { LoginResponse } from "../../modules/auth/auth.entity";

type SignaturesType = { accessSignature: string; refreshSignature: string };

export class TokenService {

    private readonly userRepository : UserRepository
    private readonly redis : RedisService

  constructor() {this.userRepository = new UserRepository(),
    this.redis = redisService
  }

  sign = async ({
    payload,
    secret = USER_ACCESS_TOKEN_SIGNATURE,
    options,
  }: {
    payload: object;
    secret: string;
    options?: SignOptions;
  }): Promise<string> => {
    return jwt.sign(payload, secret, options);
  };

  verify = async ({
    token,
    secret = USER_ACCESS_TOKEN_SIGNATURE,
  }: {
    token: string;
    secret: string;
  }): Promise<JwtPayload> => {
    return jwt.verify(token, secret) as JwtPayload;
  };

  public roleSIG = async (role: RoleEnum): Promise<SignaturesType> => {
    let signature: SignaturesType;

    switch (role) {
      case RoleEnum.ADMIN:
        signature = {
          accessSignature: ADMIN_ACCESS_TOKEN_SIGNATURE,
          refreshSignature: ADMIN_REFRESH_TOKEN_SIGNATURE,
        };
        break;

      default:
        signature = {
          accessSignature: USER_ACCESS_TOKEN_SIGNATURE,
          refreshSignature: USER_REFRESH_TOKEN_SIGNATURE,
        };
        break;
    }

    return signature;
  };

  public tokenSIG = async ({
    tokenType = TokenTypeEnum.ACCESS,
    role,
  }: {
    tokenType: TokenTypeEnum;
    role: RoleEnum;
  }): Promise<string> => {
    let { accessSignature, refreshSignature } = await this.roleSIG(role);
    let signature = undefined;
    switch (tokenType) {
      case TokenTypeEnum.ACCESS:
        signature = accessSignature;
        break;

      default:
        signature = refreshSignature;
        break;
    }
    return signature;
  };

  public decodeToken = async ({
    token,
    tokenType = TokenTypeEnum.ACCESS,
  } : {token:string,tokenType:TokenTypeEnum}):Promise<{
    user:HydratedDocument<IUser>,
    decoded:JwtPayload
  }> => {

    const decoded = jwt.decode(token) as JwtPayload;

    if (!decoded?.aud?.length) {
      throw new BadRequestException( "Missing audience" );
    }

    const [tokenApproach, role] = decoded.aud || [];

    if (tokenApproach==undefined || role==undefined) {
        throw new BadRequestException( "Missing audience" );
    }

    if (tokenType !== tokenApproach as unknown as TokenTypeEnum) {
      throw new ConflictException( "unexpected token mechanism" );
    }

    if (
      decoded.jti &&
      (await this.redis.get(`RevokeToken::${decoded.sub}::${decoded.jti}`))
    ) {
      throw new UnauthorizedException( "Invalid login session" );
    }

    let secret = await this.tokenSIG({tokenType:tokenApproach as unknown as TokenTypeEnum,role:role as unknown as RoleEnum});

    const verifyData = await this.verify({token,secret});
    const user = await this.userRepository.findOne({
    
      filter: { _id: verifyData.sub },
    });
    if (!user) {
      throw new NotFoundException( "user not found" );
    }

    if (
      user.changeCredentialsTime &&
      user.changeCredentialsTime.getTime() >= (decoded.iat as number || 0) * 1000
    ) {
      throw new BadRequestException( "invalid login session" );
    }

    return { user, decoded };
  };

  public createLoginCredentials = async (user:HydratedDocument<IUser>,issuer:string):Promise<LoginResponse> => {
    let { accessSignature, refreshSignature } = await this.roleSIG(user.role);

    const access_token = await this.sign({
      payload: { sub: user.id },
      secret: accessSignature,
      options: {
        audience: [TokenTypeEnum.ACCESS as unknown as string, user.role as unknown as string],
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        jwtid: crypto.randomUUID(),
      },
    });

    const refresh_token = await this.sign({
      payload: { sub: user.id },
      secret: refreshSignature,
      options: {
        audience: [TokenTypeEnum.REFRESH as unknown as string, user.role as unknown as string],
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        jwtid: crypto.randomUUID(),
      },
    });

    return {access_token, refresh_token };
  };
}
