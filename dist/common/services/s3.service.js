"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("../../config/config");
const crypto_1 = require("crypto");
const exceptions_1 = require("../utils/exceptions");
const enums_1 = require("../enums");
const fs_1 = require("fs");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: config_1.AWS_REGION,
            credentials: {
                accessKeyId: config_1.AWS_ACCESS_KEY_ID,
                secretAccessKey: config_1.AWS_SECRET_KEY_ID,
            },
        });
    }
    async uploadSmallAsset({ storageApproach = enums_1.multerApproachEnum.MEMORY, Bucket = config_1.AWS_BUCKET_NAME, path = "general", file, ACL = client_s3_1.ObjectCannedACL.private, ContentType, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `${config_1.APPLICATION_NAME}/${path}/${(0, crypto_1.randomUUID)()}__${file.originalname}`,
            ACL,
            Body: file.buffer ? file.buffer : (0, fs_1.createReadStream)(file.path),
            ContentType: file.mimetype || ContentType,
        });
        if (!command.input?.Key) {
            throw new exceptions_1.BadRequestException("failed to upload file");
        }
        await this.client.send(command);
        return { key: command.input?.Key };
    }
    async uploadLargeAsset({ storageApproach = enums_1.multerApproachEnum.DISK, Bucket = config_1.AWS_BUCKET_NAME, path = "general", file, ACL = client_s3_1.ObjectCannedACL.private, ContentType, partSize = 5, }) {
        const uploadFile = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket,
                Key: `${config_1.APPLICATION_NAME}/${path}/${(0, crypto_1.randomUUID)()}__${file.originalname}`,
                ACL,
                Body: file.buffer ? file.buffer : (0, fs_1.createReadStream)(file.path),
                ContentType: file.mimetype || ContentType,
            },
            partSize: partSize * 1024 * 1024,
        });
        uploadFile.on("httpUploadProgress", (progress) => {
            console.log(progress);
            console.log(`File upload is ${(progress.loaded / progress.total) * 100}%`);
        });
        return await uploadFile.done();
    }
    async uploadAssets({ storageApproach = enums_1.multerApproachEnum.MEMORY, uploadApproach, Bucket = config_1.AWS_BUCKET_NAME, path = "general", files, ACL = client_s3_1.ObjectCannedACL.private, ContentType, }) {
        if (!files || files.length === 0) {
            throw new exceptions_1.BadRequestException("No files provided");
        }
        let urls = [];
        if (uploadApproach === enums_1.uploadApproachEnum.LARGE) {
            const data = await Promise.all(files.map((file) => {
                return this.uploadLargeAsset({
                    storageApproach,
                    file,
                    ACL,
                    path,
                    ContentType,
                    Bucket,
                });
            }));
            urls = data.map((ele) => {
                return ele.Key;
            });
            return urls;
        }
        else {
            const data = await Promise.all(files.map((file) => {
                return this.uploadSmallAsset({
                    storageApproach,
                    file,
                    ACL,
                    path,
                    ContentType,
                    Bucket,
                });
            }));
            urls = data.map((ele) => {
                return ele.key;
            });
            return urls;
        }
    }
    async createPreSignedLink({ Bucket = config_1.AWS_BUCKET_NAME, expiresIn = config_1.AWS_EXPIRES_IN, path = "general", ContentType, OriginalName, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `${config_1.APPLICATION_NAME}/${path}/${(0, crypto_1.randomUUID)()}__${OriginalName}`,
            ContentType,
        });
        if (!command.input?.Key) {
            throw new exceptions_1.BadRequestException("failed to upload file");
        }
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return { url, key: command.input?.Key };
    }
    async deleteAsset({ Bucket = config_1.AWS_BUCKET_NAME, Key, }) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket,
            Key,
        });
        return await this.client.send(command);
    }
    async deleteAssets({ Bucket = config_1.AWS_BUCKET_NAME, Keys, }) {
        const command = new client_s3_1.DeleteObjectsCommand({
            Bucket,
            Delete: {
                Objects: Keys,
                Quiet: false
            }
        });
        return await this.client.send(command);
    }
    async getAsset({ Bucket = config_1.AWS_BUCKET_NAME, Key, }) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key,
        });
        return await this.client.send(command);
    }
    async preSignedFetchLink({ Bucket = config_1.AWS_BUCKET_NAME, Key, expiresIn = config_1.AWS_EXPIRES_IN, download, fileName }) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key,
            ResponseContentDisposition: download === "true" ? `attachment; filename="${fileName || Key.split("/").pop()}"` : undefined
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return url;
    }
}
exports.S3Service = S3Service;
exports.s3Service = new S3Service();
