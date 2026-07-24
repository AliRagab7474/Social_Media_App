import {z} from "zod"
import { createPost, reactPost, updatePost } from "./post.validation"

export type createPostBodyDto = z.infer<typeof createPost.body>
export type ReactPostParamsDto = z.infer<typeof reactPost.params>
export type ReactPostQueryDto = z.infer<typeof reactPost.query>
export type updatePostParamsDto = z.infer<typeof updatePost.params>
export type updatePostBodyDto = z.infer<typeof updatePost.body>