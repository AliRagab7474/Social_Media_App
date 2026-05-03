import {type Request,type Response,type NextFunction  } from "express";
import { UnauthorizedException } from "../common/utils/exceptions";
import { RoleEnum } from "../common/enums";


export const authorization = (accessRoles:RoleEnum[]) => {
  return async (req:Request, res:Response, next:NextFunction) => {
    if (!accessRoles.includes(req.user.role)) {
        throw new UnauthorizedException("missing authorization")
    }
    next();
  };
};