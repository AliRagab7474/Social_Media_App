"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = __importDefault(require("./auth.service"));
const router = (0, express_1.Router)();
router.get("login", (req, res, next) => {
    const result = auth_service_1.default.login();
    return res.status(201).json({ message: "done login", result });
});
exports.default = router;
