import { config } from "dotenv"; 
import { resolve } from "node:path";

config({path:resolve(`./.env.${process.env.NODE_ENV}`)})

export const PORT = process.env.PORT
export const DB_URI = process.env.DB_URI as string


export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? '10')
export const ENC_IV_LENGTH = parseInt(process.env.ENC_IV_LENGTH ?? '16')
export const ENC_KEY = process.env.ENC_KEY as string

export const USER_ACCESS_TOKEN_SIGNATURE = process.env.USER_ACCESS_TOKEN_SIGNATURE as string
export const USER_REFRESH_TOKEN_SIGNATURE = process.env.USER_REFRESH_TOKEN_SIGNATURE as string

export const ADMIN_ACCESS_TOKEN_SIGNATURE = process.env.ADMIN_ACCESS_TOKEN_SIGNATURE as string
export const ADMIN_REFRESH_TOKEN_SIGNATURE = process.env.ADMIN_REFRESH_TOKEN_SIGNATURE as string

export const SYSTEM_ACCESS_TOKEN_SIGNATURE = process.env.SYSTEM_ACCESS_TOKEN_SIGNATURE as string
export const SYSTEM_REFRESH_TOKEN_SIGNATURE = process.env.SYSTEM_REFRESH_TOKEN_SIGNATURE as string

export const ACCESS_TOKEN_EXPIRES_IN = parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN ?? "1800")
export const REFRESH_TOKEN_EXPIRES_IN = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN ?? "1800")
export const REDIS_URI = process.env.REDIS_URI as string

export const APP_EMAIL = process.env.APP_EMAIL as string
export const APP_EMAIL_PASSWORD = process.env.APP_EMAIL_PASSWORD as string
export const APPLICATION_NAME = process.env.APPLICATION_NAME as string

export const FACEBOOK = process.env.FACEBOOK as string
export const INSTAGRAM = process.env.INSTAGRAM as string
export const TWITTER = process.env.TWITTER as string
export const ORIGINS = (process.env.ORIGINS?.split(",") || []) as string[]

export const AWS_REGION = process.env.AWS_REGION as string
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME as string
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string
export const AWS_SECRET_KEY_ID = process.env.AWS_SECRET_KEY_ID as string
export const AWS_EXPIRES_IN = parseInt(process.env.AWS_EXPIRES_IN as string || "120")
