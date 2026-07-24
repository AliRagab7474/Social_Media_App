import { z } from "zod";
import { generalValidationFields } from "../../common/validation";
import { fileValidationField } from "../../common/utils/multer";

export const createComment = {
  params: z.strictObject({
    postId: generalValidationFields.id,
  }),
  body: z
    .strictObject({
      content: z.string().optional(),
      files: z
        .array(generalValidationFields.file(fileValidationField.image))
        .optional(),
      tags: z.array(z.string()).optional(),
    })
    .superRefine((args, ctx) => {
      if (!args.files?.length && !args.content) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Content is required",
        });
      }
      if (args.tags?.length) {
        const uniqueTags = [...new Set(args.tags)];
        if (uniqueTags.length != args.tags.length)
          ctx.addIssue({
            code: "custom",
            path: ["tags"],
            message: "Duplicated tag",
          });
      }
    }),
};

export const replyComment = {
  params: z.strictObject({
    postId: generalValidationFields.id,
    commentId:generalValidationFields.id
  }),
  body:createComment.body,
};
