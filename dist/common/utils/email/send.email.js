"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../../../config/config");
const sendEmail = async ({ to, cc, bcc, subject, html, attachments = [], }) => {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: config_1.APP_EMAIL,
            pass: config_1.APP_EMAIL_PASSWORD,
        },
    });
    const info = await transporter.sendMail({
        from: `Social Media App <${config_1.APP_EMAIL}>`,
        to,
        cc,
        bcc,
        subject,
        html,
        attachments,
    });
    console.log("message sent", info.messageId);
};
exports.sendEmail = sendEmail;
