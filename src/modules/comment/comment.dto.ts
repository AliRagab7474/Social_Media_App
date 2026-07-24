import {z} from "zod"
import { createComment, replyComment } from "./comment.validation"

export type createCommentBodyDto = z.infer<typeof createComment.body>
export type createCommentParamsDto = z.infer<typeof createComment.params>
export type replyOnCommentParamsDto = z.infer<typeof replyComment.params>