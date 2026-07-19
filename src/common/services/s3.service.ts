import {
  CompleteMultipartUploadCommandOutput,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  APPLICATION_NAME,
  AWS_ACCESS_KEY_ID,
  AWS_BUCKET_NAME,
  AWS_EXPIRES_IN,
  AWS_REGION,
  AWS_SECRET_KEY_ID,
} from "../../config/config";
import { randomUUID } from "crypto";
import { BadRequestException } from "../utils/exceptions";
import { multerApproachEnum, uploadApproachEnum } from "../enums";
import { createReadStream } from "fs";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Service {
  private client: S3Client;
  constructor() {
    this.client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_KEY_ID,
      },
    });
  }

  async uploadSmallAsset({
    storageApproach = multerApproachEnum.MEMORY,
    Bucket = AWS_BUCKET_NAME,
    path = "general",
    file,
    ACL = ObjectCannedACL.private,
    ContentType,
  }: {
    storageApproach?: multerApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string | undefined;
  }) {
    const command = new PutObjectCommand({
      Bucket,
      Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
      ACL,
      Body: file.buffer ? file.buffer : createReadStream(file.path),
      ContentType: file.mimetype || ContentType,
    });

    if (!command.input?.Key) {
      throw new BadRequestException("failed to upload file");
    }

    await this.client.send(command);

    return { key: command.input?.Key };
  }

  async uploadLargeAsset({
    storageApproach = multerApproachEnum.DISK,
    Bucket = AWS_BUCKET_NAME,
    path = "general",
    file,
    ACL = ObjectCannedACL.private,
    ContentType,
    partSize = 5,
  }: {
    storageApproach?: multerApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string | undefined;
    partSize?: number;
  }): Promise<CompleteMultipartUploadCommandOutput> {
    const uploadFile = new Upload({
      client: this.client,
      params: {
        Bucket,
        Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
        ACL,
        Body: file.buffer ? file.buffer : createReadStream(file.path),
        ContentType: file.mimetype || ContentType,
      },
      partSize: partSize * 1024 * 1024,
    });

    uploadFile.on("httpUploadProgress", (progress) => {
      console.log(progress);
      console.log(
        `File upload is ${((progress.loaded as number) / (progress.total as number)) * 100}%`,
      );
    });
    return await uploadFile.done();
  }

  async uploadAssets({
    storageApproach = multerApproachEnum.MEMORY,
    uploadApproach,
    Bucket = AWS_BUCKET_NAME,
    path = "general",
    files,
    ACL = ObjectCannedACL.private,
    ContentType,
  }: {
    storageApproach?: multerApproachEnum;
    uploadApproach?: uploadApproachEnum;
    Bucket?: string;
    path?: string;
    files: Express.Multer.File[];
    ACL?: ObjectCannedACL;
    ContentType?: string;
  }): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided");
    }

    let urls: string[] = [];

    if (uploadApproach === uploadApproachEnum.LARGE) {
      const data = await Promise.all(
        files.map((file) => {
          return this.uploadLargeAsset({
            storageApproach,
            file,
            ACL,
            path,
            ContentType,
            Bucket,
          });
        }),
      );
      urls = data.map((ele) => {
        return ele.Key as string;
      });

      return urls;
    } else {
      const data = await Promise.all(
        files.map((file) => {
          return this.uploadSmallAsset({
            storageApproach,
            file,
            ACL,
            path,
            ContentType,
            Bucket,
          });
        }),
      );
      urls = data.map((ele) => {
        return ele.key as string;
      });

      return urls;
    }
  }

  async createPreSignedLink({
    Bucket = AWS_BUCKET_NAME,
    expiresIn = AWS_EXPIRES_IN,
    path = "general",
    ContentType,
    OriginalName,
  }: {
    Bucket?: string;
    expiresIn?: number;
    path?: string;
    ContentType: string;
    OriginalName: string;
  }): Promise<{ url: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket,
      Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${OriginalName}`,
      ContentType,
    });

    if (!command.input?.Key) {
      throw new BadRequestException("failed to upload file");
    }
    const url = await getSignedUrl(this.client, command, { expiresIn });

    return { url, key: command.input?.Key };
  }
  
  async deleteAsset({
    Bucket = AWS_BUCKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }):Promise<DeleteObjectCommandOutput> {
    const command = new DeleteObjectCommand({
      Bucket,
      Key,
    });
    
    return await this.client.send(command);
  }
  async deleteAssets({
    Bucket = AWS_BUCKET_NAME,
    Keys,
  }: {
    Bucket?: string,
    Keys: {Key:string}[],
  }):Promise<DeleteObjectsCommandOutput> {
    const command = new DeleteObjectsCommand({
      Bucket,
      Delete:{
        Objects:Keys,
        Quiet:false
      }
    });
    
    return await this.client.send(command);
  }



  async getAsset({
    Bucket = AWS_BUCKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }):Promise<GetObjectCommandOutput> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    });
    
    return await this.client.send(command);
  }
  
  async preSignedFetchLink({
    Bucket = AWS_BUCKET_NAME,
    Key,
    expiresIn = AWS_EXPIRES_IN,
    download,
    fileName
  }: {
    Bucket?: string;
    Key: string;
    expiresIn?: number;
    download?:string,
    fileName?:string
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
       ResponseContentDisposition: download==="true"? `attachment; filename="${
      fileName || Key.split("/").pop()
    }"`:undefined
  });
    
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return url
  }
}

export const s3Service = new S3Service();
