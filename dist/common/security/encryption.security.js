"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Decrypt = exports.Encrypt = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const config_1 = require("../../config/config");
const exceptions_1 = require("../utils/exceptions");
const Encrypt = async ({ plainText, }) => {
    const iv = Buffer.from(node_crypto_1.default.randomBytes(config_1.ENC_IV_LENGTH));
    const cipherIv = node_crypto_1.default.createCipheriv("aes-256-cbc", config_1.ENC_KEY, iv);
    let cipherText = cipherIv.update(plainText, "utf-8", "hex");
    cipherText += cipherIv.final("hex");
    return `${iv.toString("hex")}:${cipherText}`;
};
exports.Encrypt = Encrypt;
const Decrypt = async ({ cipherText, }) => {
    const [iv, cipherData] = cipherText.split(":") || [];
    if (!iv || !cipherData) {
        throw new exceptions_1.BadRequestException("missing decryption data");
    }
    const ivLikeBinary = Buffer.from(iv, "hex");
    let decipherIv = node_crypto_1.default.createDecipheriv("aes-256-cbc", config_1.ENC_KEY, ivLikeBinary);
    let plainText = decipherIv.update(cipherData, "hex", "utf-8");
    plainText += decipherIv.final("utf-8");
    return plainText;
};
exports.Decrypt = Decrypt;
