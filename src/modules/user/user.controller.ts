import {type Request,type Response,type NextFunction ,Router } from "express";
import { SuccessResponse } from "../../common/utils/response";
import  userService  from "./user.service";
import { authentication, authorization } from "../../middleware";
import { endPoint } from "./user.authorization";
import { TokenTypeEnum } from "../../common/enums/security.enum";

const router = Router()

router.get("/profile",authentication(),authorization(endPoint.profile),async(req:Request,res:Response,next:NextFunction)=>{
    const result = await userService.profile(req.user)
    return SuccessResponse({res,data:result})
})

router.post("/logout",authentication(),async(req,res,next)=>{
  const status = await userService.logout(req.body,req.user,req.decoded as {jti:string, iat:number,sub:string})
return SuccessResponse({res,status:status,message:'done logout'})
})

router.get("/rotate-token", authentication(TokenTypeEnum.REFRESH) ,async(req, res, next) => {
    const result = await userService.rotateToken(req.user , req.decoded as {jti:string, iat:number,sub:string} , `${req.protocol}://${req.host}`)
  return SuccessResponse({res,data:result})
});

export default router;