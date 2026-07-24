import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { authentication, validation } from "../../middleware";
import {
  cloudFileUpload,
  fileValidationField,
} from "../../common/utils/multer";
import { SuccessResponse } from "../../common/utils/response";
import * as PostValidation from "./comment.validation";
import { commentService } from "./comment.service";
import { createCommentParamsDto, replyOnCommentParamsDto } from "./comment.dto";

const router = Router({mergeParams:true});


router.post(
  "/",
  authentication(),
  cloudFileUpload({ validation: fileValidationField.image }).array(
    "attachments",
    1,
  ),
  validation(PostValidation.createComment),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await commentService.createComment(
      req.params as createCommentParamsDto,
      { ...req.body, ...req.file },
      req.user,
    );
    return SuccessResponse({ res, data });
  },
);

router.post(
  "/:commentId/reply",
  authentication(),
  cloudFileUpload({ validation: fileValidationField.image }).array(
    "attachments",
    1,
  ),
  validation(PostValidation.replyComment),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await commentService.replyOnComment(
      req.params as replyOnCommentParamsDto,
      { ...req.body, ...req.file },
      req.user,
    );
    return SuccessResponse({ res, data });
  },
);

export default router;
