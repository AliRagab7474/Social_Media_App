"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentService = exports.CommentService = void 0;
const mongoose_1 = require("mongoose");
const repository_1 = require("../../DB/repository");
const services_1 = require("../../common/services");
const exceptions_1 = require("../../common/utils/exceptions");
const post_1 = require("../../common/utils/post");
class CommentService {
    userRepository;
    postRepository;
    commentRepository;
    redis;
    s3;
    notify;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.postRepository = new repository_1.PostRepository();
        this.commentRepository = new repository_1.CommentRepository();
        this.s3 = services_1.s3Service;
        this.redis = services_1.redisService;
        this.notify = new services_1.NotificationService();
    }
    async createComment({ postId }, { tags, content, files }, user) {
        const post = await this.postRepository.findOne({
            filter: {
                _id: postId,
                $or: (0, post_1.postAvailability)(user)
            }
        });
        if (!post) {
            throw new exceptions_1.NotFoundException("post not found");
        }
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedAccounts = await this.userRepository.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (mentionedAccounts.length != tags.length) {
                throw new exceptions_1.NotFoundException("Fail to find some or all mentioned accounts");
            }
            for (const tag of tags) {
                mentions.push(mongoose_1.Types.ObjectId.createFromHexString(tag));
                ((await this.redis.getFCMs(tag)) || []).map((token) => FCM_Tokens.push(token));
            }
        }
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`,
            });
        }
        const comment = await this.commentRepository.createOne({
            data: {
                createdBy: user._id,
                content: content,
                attachments,
                postId: post._id,
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
            throw new exceptions_1.BadRequestException("failed creating post");
        }
        if (FCM_Tokens) {
            await this.notify.sendNotifications({
                tokens: FCM_Tokens,
                data: {
                    title: "you were mentioned",
                    body: JSON.stringify({
                        message: `${user.username} mentioned you in a comment`,
                        postId: post._id,
                        commentId: comment._id
                    }),
                },
            });
        }
        return comment.toJSON();
    }
    async replyOnComment({ postId, commentId }, { tags, content, files }, user) {
        const comment = await this.commentRepository.findOne({
            filter: {
                _id: commentId
            }, options: {
                populate: [{ path: "postId", match: { $or: (0, post_1.postAvailability)(user) } }]
            }
        });
        if (!comment) {
            throw new exceptions_1.NotFoundException("comment not found");
        }
        if (!comment.postId) {
            throw new exceptions_1.NotFoundException("post not found");
        }
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedAccounts = await this.userRepository.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (mentionedAccounts.length != tags.length) {
                throw new exceptions_1.NotFoundException("Fail to find some or all mentioned accounts");
            }
            for (const tag of tags) {
                mentions.push(mongoose_1.Types.ObjectId.createFromHexString(tag));
                ((await this.redis.getFCMs(tag)) || []).map((token) => FCM_Tokens.push(token));
            }
        }
        const post = comment.postId;
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`,
            });
        }
        const reply = await this.commentRepository.createOne({
            data: {
                commentId: comment._id,
                createdBy: user._id,
                content: content,
                attachments,
                postId: post._id,
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
            throw new exceptions_1.BadRequestException("failed creating reply");
        }
        if (FCM_Tokens.length) {
            await this.notify.sendNotifications({
                tokens: FCM_Tokens,
                data: {
                    title: "you were mentioned",
                    body: JSON.stringify({
                        message: `${user.username} mentioned you in a comment`,
                        postId: post._id,
                        commentId: comment._id,
                        replyId: reply._id
                    }),
                },
            });
        }
        return reply.toJSON();
    }
}
exports.CommentService = CommentService;
exports.commentService = new CommentService();
