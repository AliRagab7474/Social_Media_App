import { HydratedDocument, model, Schema, Types } from "mongoose";
import { IComment, IUser } from "../../common/interfaces";

const commentSchema = new Schema<IComment>({
    content: {
        type: String,
        required: function (this) {
            return !this.attachments?.length
        }
    },
    attachments: { type: [String] },

    postId:{type:Types.ObjectId,ref:"Post",required:true},
    commentId:{type:Types.ObjectId,ref:"Comment"},
    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],
    updatedBy: { type: Types.ObjectId, ref: "User" },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
    restoredAt: { type: Date },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_Comment"
})


commentSchema.virtual("reply",{
  localField:"_id",
  foreignField:"commentId",
  ref:"Comment"
})

commentSchema.pre(["findOne", "find","countDocuments"], function () {
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});

commentSchema.pre(["findOneAndUpdate", "updateOne"], function () {
  const update = this.getUpdate() as HydratedDocument<IUser>;
  if (update.deletedAt) {
    this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
  }
  if (update.restoredAt) {
    this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
    this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
  }

  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ deletedAt: { $exists: false }, ...query });
  }
});

commentSchema.pre(["findOneAndDelete", "deleteOne"], function () {
  const query = this.getQuery();
  if (query.force === true) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ deletedAt: { $exists: true }, ...query });
  }
});

export const CommentModel = model<IComment>("Comment", commentSchema);
CommentModel.syncIndexes()