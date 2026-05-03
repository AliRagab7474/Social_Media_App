import {
  type Request,
  type Response,
  type NextFunction,
  Router,
} from "express";
import authService from "./auth.service";
import { SuccessResponse } from "../../common/utils/response/success.response";
import { LoginResponse } from "./auth.entity";
import * as validators from "./auth.validation";

import { validation } from "../../middleware/validation.middleware";
const router = Router();

router.post("/login",validation(validators.loginSchema),async (req: Request, res: Response, next: NextFunction) => {
  const result = await authService.login(req.body,`${req.protocol}://${req.host}`);
  return SuccessResponse<LoginResponse>({ res, data: result });
});

router.post(
  "/signup",
  validation(validators.SignupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.signup(req.body);
    return SuccessResponse<LoginResponse>({ res, data: result });
  },
);

router.patch("/confirm-email", validation(validators.ConfirmEmail),async (req, res, next) => {
  const result = await authService.confirmEmail(req.body);
  return  SuccessResponse<LoginResponse>({res:res,data:result,message:"Email Confirmed you can login now"})
});

router.patch("/resend-confirm-email", validation(validators.resendConfirmEmail),async (req, res, next) => {
  const result = await authService.resendOTP(req.body);
  return  SuccessResponse<LoginResponse>({res:res,data:result,message:"otp sent"})
});

export default router;
