"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("./modules/auth");
const middleware_1 = require("./middleware");
const config_1 = require("./config/config");
const connection_db_1 = __importDefault(require("./DB/connection.db"));
const redis_service_1 = require("./common/services/redis.service");
const user_1 = require("./modules/user");
const bootstrap = async () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    await (0, connection_db_1.default)();
    await redis_service_1.redisService.connect();
    app.get("/", (req, res, next) => {
        res.status(404).json({ message: "landing page" });
    });
    app.use("/auth", auth_1.authRouter);
    app.use("/user", user_1.UserRouter);
    app.get("/*dummy", (req, res, next) => {
        res.status(404).json({ message: "Invalid Routing" });
    });
    app.use(middleware_1.globalErrorHandling);
    app.listen(config_1.PORT, () => {
        console.log(`server is running on port ${config_1.PORT}`);
    });
};
exports.default = bootstrap;
