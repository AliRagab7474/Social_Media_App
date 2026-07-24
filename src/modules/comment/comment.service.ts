import { HydratedDocument, Types } from "mongoose";
import {
  createCommentBodyDto,
  createCommentParamsDto,
  replyOnCommentParamsDto,
  } from "./comment.dto";
import { IComment, IPost, IUser } from "../../common/interfaces";
import { CommentRepository, PostRepository, UserRepository } from "../../DB/repository";
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
import { postAvailability } from "../../common/utils/post";


export class CommentService {
  private userRepository: UserRepository;
  private postRepository: PostRepository;
  private commentRepository: CommentRepository;
  private readonly redis: RedisService;
  private readonly s3: S3Service;
  private readonly notify: NotificationService;

  constructor() {
    this.userRepository = new UserRepository();
    this.postRepository = new PostRepository();
    this.commentRepository = new CommentRepository();
    this.s3 = s3Service;
    this.redis = redisService;
    this.notify = new NotificationService();
  }

  async createComment({postId}:createCommentParamsDto,
    { tags, content, files }: createCommentBodyDto,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {

    const post = await this.postRepository.findOne({
      filter:{
        _id:postId,
        $or:postAvailability(user)
      }
    })
    if (!post) {
      throw new NotFoundException("post not found")
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
        mentions.push(Types.ObjectId.createFromHexString(tag));
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

    const comment = await this.commentRepository.createOne({
      data: {
        createdBy: user._id,
        content: content as string,
        attachments,
        postId:post._id,
        tags: mentions,
      },
    });

    if (!comment) {
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
            message: `${user.username} mentioned you in a comment`,
            postId: post._id,
            commentId:comment._id
          }),
        },
      });
    }

    return comment.toJSON();
  }
  
  async replyOnComment({postId,commentId}:replyOnCommentParamsDto,
    { tags, content, files }: createCommentBodyDto,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {

    const comment = await this.commentRepository.findOne({
      filter:{
        _id:commentId
      },options:{
        populate:[{path:"postId",match:{$or:postAvailability(user)}}]
      }
    })

    if (!comment) {
      throw new NotFoundException("comment not found");
    }

    if (!comment.postId) {
      throw new NotFoundException("post not found");
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
        mentions.push(Types.ObjectId.createFromHexString(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) =>
          FCM_Tokens.push(token),
      );
    }
  }
  
  const post = comment.postId as HydratedDocument<IPost>;
    const folderId = post.folderId;
    let attachments: string[] = [];
    if (files?.length) {
      attachments = await this.s3.uploadAssets({
        files: files as Express.Multer.File[],
        path: `Post/${folderId}`,
      });
    }

    const reply = await this.commentRepository.createOne({
      data: {
        commentId:comment._id,
        createdBy: user._id,
        content: content as string,
        attachments,
        postId:post._id,
        tags: mentions,
      },
    });

    if (!reply) {
      if (attachments.length) {
        await this.s3.deleteAssets({
          Keys: attachments.map((ele) => {
            return { Key: ele };
          }),
        });
      }
      throw new BadRequestException("failed creating reply");
    }
    if (FCM_Tokens.length) {
      await this.notify.sendNotifications({
        tokens: FCM_Tokens,
        data: {
          title: "you were mentioned",
          body: JSON.stringify({
            message: `${user.username} mentioned you in a comment`,
            postId: post._id,
            commentId:comment._id,
            replyId:reply._id
          }),
        },
      });
    }

    return reply.toJSON();
  }

}

export const commentService = new CommentService();
