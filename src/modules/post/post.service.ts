import { HydratedDocument, Types } from "mongoose";
import {
  createPostBodyDto,
  ReactPostParamsDto,
  ReactPostQueryDto,
  updatePostBodyDto,
  updatePostParamsDto,
} from "./post.dto";
import { IPaginate, IPost, IUser } from "../../common/interfaces";
import { PostRepository, UserRepository } from "../../DB/repository";
import {
  NotificationService,
  redisService,
  RedisService,
  s3Service,
  S3Service,
} from "../../common/services";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/utils/exceptions";
import { randomUUID } from "node:crypto";
import { postAvailability } from "../../common/utils/post";
import { PaginateDto } from "../../common/validation";
import { getObjectId } from "../../common/utils/objectId";

export class PostService {
  private userRepository: UserRepository;
  private postRepository: PostRepository;
  private readonly redis: RedisService;
  private readonly s3: S3Service;
  private readonly notify: NotificationService;

  constructor() {
    this.userRepository = new UserRepository();
    this.postRepository = new PostRepository();
    this.s3 = s3Service;
    this.redis = redisService;
    this.notify = new NotificationService();
  }

  async createPost(
    { availability, tags, content, files }: createPostBodyDto,
    user: HydratedDocument<IUser>,
  ): Promise<IPost> {
    const mentions: Types.ObjectId[] = [];
    const FCM_Tokens: string[] = [];
    if (tags?.length) {
      const mentionedAccounts = await this.userRepository.find({
        filter: {
          _id: { $in: tags },
        },
      });
      if (mentionedAccounts.length != tags.length) {
        throw new NotFoundException(
          "Fail to find some or all mentioned accounts",
        );
      }

      for (const tag of tags) {
        mentions.push(Types.ObjectId.createFromHexString(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) =>
          FCM_Tokens.push(token),
        );
      }
    }
    const folderId = randomUUID();
    let attachments: string[] = [];
    if (files?.length) {
      attachments = await this.s3.uploadAssets({
        files: files as Express.Multer.File[],
        path: `Post/${folderId}`,
      });
    }

    const post = await this.postRepository.createOne({
      data: {
        createdBy: user._id,
        content: content as string,
        attachments,
        folderId,
        availability,
        tags: mentions,
      },
    });

    if (!post) {
      if (attachments.length) {
        await this.s3.deleteAssets({
          Keys: attachments.map((ele) => {
            return { Key: ele };
          }),
        });
      }
      throw new BadRequestException("failed creating post");
    }
    if (FCM_Tokens) {
      await this.notify.sendNotifications({
        tokens: FCM_Tokens,
        data: {
          title: "you were mentioned",
          body: JSON.stringify({
            message: `${user.username} mentioned you in a post`,
            postId: post._id,
          }),
        },
      });
    }

    return post.toJSON();
  }

  async updatePost(
    { postId }: updatePostParamsDto,
    {
      availability,
      tags,
      content,
      files,
      removeFiles = [],
      removeTags = [],
    }: updatePostBodyDto,
    user: HydratedDocument<IUser>,
  ): Promise<IPost> {
    const post = await this.postRepository.findOne({
      filter: {
        _id: postId,
        createdBy: user._id,
      },
    });

    if (!post) {
      throw new NotFoundException("post not found");
    }

    if (
      !post.content &&
      !content &&
      !files?.length &&
      post.attachments?.length == removeFiles.length
    ) {
      throw new BadRequestException("insert data to update post");
    }

    const mentions: Types.ObjectId[] = [];
    const FCM_Tokens: string[] = [];
    if (tags?.length) {
      const mentionedAccounts = await this.userRepository.find({
        filter: {
          _id: { $in: tags },
        },
      });
      if (mentionedAccounts.length != tags.length) {
        throw new NotFoundException(
          "Fail to find some or all mentioned accounts",
        );
      }

      for (const tag of tags) {
        mentions.push(getObjectId(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) =>
          FCM_Tokens.push(token),
        );
      }
    }
    const folderId = post.folderId;
    let attachments: string[] = [];
    if (files?.length) {
      attachments = await this.s3.uploadAssets({
        files: files as Express.Multer.File[],
        path: `Post/${folderId}`,
      });
    }

    const updatedPost = await this.postRepository.findOneAndUpdate({
      filter: {
        _id: post._id,
        createdBy: user._id,
      },
      update: [
        {
          $set: {
            content: content || post.content,
            availability: Number(availability || post.availability),
            updatedBy: user._id,
            attachments: {
              $setUnion: [
                {
                  $setDifference: ["$attachments", removeFiles],
                },
                attachments,
              ],
            },
            tags: {
              $setUnion: [
                {
                  $setDifference: [
                    "$tags",
                    removeTags.map((ele) => {
                      return getObjectId(ele);
                    }),
                  ],
                },
                mentions,
              ],
            },
          },
        },
      ],
    });

    if (!updatedPost) {
      if (attachments.length) {
        await this.s3.deleteAssets({
          Keys: attachments.map((ele) => {
            return { Key: ele };
          }),
        });
      }
      throw new BadRequestException("failed creating post");
    }

    if (removeFiles.length) {
      await this.s3.deleteAssets({
        Keys: removeFiles.map((ele) => {
          return { Key: ele };
        }),
      });
    }

    if (FCM_Tokens) {
      await this.notify.sendNotifications({
        tokens: FCM_Tokens,
        data: {
          title: "you were mentioned",
          body: JSON.stringify({
            message: `${user.username} mentioned you in a post`,
            postId: post._id,
          }),
        },
      });
    }

    return updatedPost.toJSON();
  }

  async postList(
    { search, size, page }: PaginateDto,
    user: HydratedDocument<IUser>,
  ): Promise<IPaginate<IPost>> {
    const posts = await this.postRepository.paginate({
      filter: {
        $or: postAvailability(user),
        ...(search ? { content: { $regex: search, $options: "i" } } : {}),
      },
      size,
      page,
      options: {
        populate: [
          {
            path: "comments",
            populate: [{ path: "reply", populate: [{ path: "reply" }] }],
          },
        ],
      },
    });
    return posts;
  }

  async reactPost(
    { postId }: ReactPostParamsDto,
    { react }: ReactPostQueryDto,
    user: HydratedDocument<IUser>,
  ): Promise<IPost> {
    const post = await this.postRepository.findOneAndUpdate({
      filter: {
        _id: postId,
        $or: postAvailability(user),
      },
      update: {
        ...(Number(react) > 0
          ? { $addToSet: { likes: user._id } }
          : { $pull: { likes: user._id } }),
      },
    });

    if (!post) {
      throw new BadRequestException("post not found");
    }

    return post.toJSON();
  }
}

export const postService = new PostService();
