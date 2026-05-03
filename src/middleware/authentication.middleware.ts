import {type Request,type Response,type NextFunction  } from "express";
import { UnauthorizedException } from "../common/utils/exceptions";
import { TokenService } from "../common/services";
import { TokenTypeEnum } from "../common/enums/security.enum";


export const authentication = (tokenType:TokenTypeEnum = TokenTypeEnum.ACCESS)=>{
  return async(req:Request,res:Response,next:NextFunction)=>{
      const tokenService = new TokenService()
      const [ schema, credentials ] = req.headers?.authorization?.split(" ") || [];
      
    if (!schema || !credentials) {
      throw new UnauthorizedException("missing authentication or missing approach");
    }

    switch (schema) {
    case "Basic":
        const [email , password ] = Buffer.from(credentials,"base64").toString().split(":")
       console.log({email,password});
            break;
            
      default:
         await tokenService.decodeToken({
          token: credentials,
          tokenType,
        });

        const {user,decoded} = await tokenService.decodeToken({token:credentials,tokenType})
        req.user = user
        req.decoded=decoded
        break;
    }
    next();
    }
}