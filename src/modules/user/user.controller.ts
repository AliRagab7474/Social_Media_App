import {
  type Request,
  type Response,
  type NextFunction,
  Router,
} from "express";
import { SuccessResponse } from "../../common/utils/response";
import userService from "./user.service";
import { authentication, authorization } from "../../middleware";
import { endPoint } from "./user.authorization";
import { TokenTypeEnum } from "../../common/enums/security.enum";
import { cloudFileUpload, fileValidationField } from "../../common/utils/multer";
import { multerApproachEnum } from "../../common/enums";

const router = Router();

router.patch(
  "/profileImage",
  authentication(),
  cloudFileUpload({
    storageApproach:multerApproachEnum.MEMORY,
    validation:fileValidationField.image,
    maxSize:1
  }).single("attachment"),
  authorization(endPoint.profile),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.profileImage(req.file as Express.Multer.File ,req.user)
    return SuccessResponse({ res, data});
  },
);
router.patch(
  "/profileCoverImage",
  authentication(),
  cloudFileUpload({
    storageApproach:multerApproachEnum.DISK,
    validation:fileValidationField.image,
  }).array("attachments",2),
  authorization(endPoint.profile),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.profileCoverImages(req.files as Express.Multer.File[] ,req.user)
    return SuccessResponse({ res, data});
  },
);
router.get(
  "/profile",
  authentication(),
  authorization(endPoint.profile),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await userService.profile(req.user);
    return SuccessResponse({ res, data: result });
  },
);

router.post("/logout", authentication(), async (req, res, next) => {
  const status = await userService.logout(
    req.body,
    req.user,
    req.decoded as { jti: string; iat: number; sub: string },
  );
  return SuccessResponse({ res, status: status, message: "done logout" });
});

router.get(
  "/rotate-token",
  authentication(TokenTypeEnum.REFRESH),
  async (req, res, next) => {
    const result = await userService.rotateToken(
      req.user,
      req.decoded as { jti: string; iat: number; sub: string },
      `${req.protocol}://${req.host}`,
    );
    return SuccessResponse({ res, data: result });
  },
);

export default router;
