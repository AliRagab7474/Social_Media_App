"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = void 0;
const mongoose_1 = require("mongoose");
const repository_1 = require("../../DB/repository");
const services_1 = require("../../common/services");
const exceptions_1 = require("../../common/utils/exceptions");
const node_crypto_1 = require("node:crypto");
const post_1 = require("../../common/utils/post");
const objectId_1 = require("../../common/utils/objectId");
class PostService {
    userRepository;
    postRepository;
    redis;
    s3;
    notify;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.postRepository = new repository_1.PostRepository();
        this.s3 = services_1.s3Service;
        this.redis = services_1.redisService;
        this.notify = new services_1.NotificationService();
    }
    async createPost({ availability, tags, content, files }, user) {
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
        const folderId = (0, node_crypto_1.randomUUID)();
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`,
            });
        }
        const post = await this.postRepository.createOne({
            data: {
                createdBy: user._id,
                content: content,
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
            throw new exceptions_1.BadRequestException("failed creating post");
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
    async updatePost({ postId }, { availability, tags, content, files, removeFiles = [], removeTags = [], }, user) {
        const post = await this.postRepository.findOne({
            filter: {
                _id: postId,
                createdBy: user._id,
            },
        });
        if (!post) {
            throw new exceptions_1.NotFoundException("post not found");
        }
        if (!post.content &&
            !content &&
            !files?.length &&
            post.attachments?.length == removeFiles.length) {
            throw new exceptions_1.BadRequestException("insert data to update post");
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
                mentions.push((0, objectId_1.getObjectId)(tag));
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
                                            return (0, objectId_1.getObjectId)(ele);
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
            throw new exceptions_1.BadRequestException("failed creating post");
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
    async postList({ search, size, page }, user) {
        const posts = await this.postRepository.paginate({
            filter: {
                $or: (0, post_1.postAvailability)(user),
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
    async reactPost({ postId }, { react }, user) {
        const post = await this.postRepository.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: (0, post_1.postAvailability)(user),
            },
            update: {
                ...(Number(react) > 0
                    ? { $addToSet: { likes: user._id } }
                    : { $pull: { likes: user._id } }),
            },
        });
        if (!post) {
            throw new exceptions_1.BadRequestException("post not found");
        }
        return post.toJSON();
    }
}
exports.PostService = PostService;
exports.postService = new PostService();
