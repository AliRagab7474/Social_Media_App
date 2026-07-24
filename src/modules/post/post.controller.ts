import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { authentication, validation } from "../../middleware";
import {
  cloudFileUpload,
  fileValidationField,
} from "../../common/utils/multer";
import { SuccessResponse } from "../../common/utils/response";
import * as PostValidation from "./post.validation";
import { postService } from "./post.service";
import {
  PaginateDto,
  paginationValidationSchema,
} from "../../common/validation";
import {
  ReactPostParamsDto,
  ReactPostQueryDto,
  updatePostBodyDto,
  updatePostParamsDto,
} from "./post.dto";
const router = Router();

router.patch(
  "/:postId",
  authentication(),
  validation(PostValidation.updatePost),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await postService.updatePost(
      req.params as updatePostParamsDto,
      req.body as updatePostBodyDto,
      req.user,
    );
    return SuccessResponse({ res, data });
  },
);
router.patch(
  "/:postId/react",
  authentication(),
  validation(PostValidation.reactPost),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await postService.reactPost(
      req.params as ReactPostParamsDto,
      req.query as unknown as ReactPostQueryDto,
      req.user,
    );
    return SuccessResponse({ res, data });
  },
);

router.get(
  "/listPosts",
  authentication(),
  validation(paginationValidationSchema),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await postService.postList(req.query as PaginateDto, req.user);
    return SuccessResponse({ res, data });
  },
);
router.post(
  "/",
  authentication(),
  cloudFileUpload({ validation: fileValidationField.image }).array(
    "attachments",
    5,
  ),
  validation(PostValidation.createPost),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await postService.createPost(
      { ...req.body, ...req.file },
      req.user,
    );
    return SuccessResponse({ res, data });
  },
);

export default router;
