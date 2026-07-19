"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../../common/utils/response");
const user_service_1 = __importDefault(require("./user.service"));
const middleware_1 = require("../../middleware");
const user_authorization_1 = require("./user.authorization");
const security_enum_1 = require("../../common/enums/security.enum");
const multer_1 = require("../../common/utils/multer");
const enums_1 = require("../../common/enums");
const router = (0, express_1.Router)();
router.patch("/profileImage", (0, middleware_1.authentication)(), (0, multer_1.cloudFileUpload)({
    storageApproach: enums_1.multerApproachEnum.MEMORY,
    validation: multer_1.fileValidationField.image,
    maxSize: 1
}).single("attachment"), (0, middleware_1.authorization)(user_authorization_1.endPoint.profile), async (req, res, next) => {
    const data = await user_service_1.default.profileImage(req.file, req.user);
    return (0, response_1.SuccessResponse)({ res, data });
});
router.patch("/profileCoverImage", (0, middleware_1.authentication)(), (0, multer_1.cloudFileUpload)({
    storageApproach: enums_1.multerApproachEnum.DISK,
    validation: multer_1.fileValidationField.image,
}).array("attachments", 2), (0, middleware_1.authorization)(user_authorization_1.endPoint.profile), async (req, res, next) => {
    const data = await user_service_1.default.profileCoverImages(req.files, req.user);
    return (0, response_1.SuccessResponse)({ res, data });
});
router.get("/profile", (0, middleware_1.authentication)(), (0, middleware_1.authorization)(user_authorization_1.endPoint.profile), async (req, res, next) => {
    const result = await user_service_1.default.profile(req.user);
    return (0, response_1.SuccessResponse)({ res, data: result });
});
router.post("/logout", (0, middleware_1.authentication)(), async (req, res, next) => {
    const status = await user_service_1.default.logout(req.body, req.user, req.decoded);
    return (0, response_1.SuccessResponse)({ res, status: status, message: "done logout" });
});
router.get("/rotate-token", (0, middleware_1.authentication)(security_enum_1.TokenTypeEnum.REFRESH), async (req, res, next) => {
    const result = await user_service_1.default.rotateToken(req.user, req.decoded, `${req.protocol}://${req.host}`);
    return (0, response_1.SuccessResponse)({ res, data: result });
});
exports.default = router;
