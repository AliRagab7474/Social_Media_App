"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../../middleware");
const multer_1 = require("../../common/utils/multer");
const response_1 = require("../../common/utils/response");
const PostValidation = __importStar(require("./comment.validation"));
const comment_service_1 = require("./comment.service");
const router = (0, express_1.Router)({ mergeParams: true });
router.post("/", (0, middleware_1.authentication)(), (0, multer_1.cloudFileUpload)({ validation: multer_1.fileValidationField.image }).array("attachments", 1), (0, middleware_1.validation)(PostValidation.createComment), async (req, res, next) => {
    const data = await comment_service_1.commentService.createComment(req.params, { ...req.body, ...req.file }, req.user);
    return (0, response_1.SuccessResponse)({ res, data });
});
router.post("/:commentId/reply", (0, middleware_1.authentication)(), (0, multer_1.cloudFileUpload)({ validation: multer_1.fileValidationField.image }).array("attachments", 1), (0, middleware_1.validation)(PostValidation.replyComment), async (req, res, next) => {
    const data = await comment_service_1.commentService.replyOnComment(req.params, { ...req.body, ...req.file }, req.user);
    return (0, response_1.SuccessResponse)({ res, data });
});
exports.default = router;
