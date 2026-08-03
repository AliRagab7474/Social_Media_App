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
const services_1 = require("./common/services");
const node_stream_1 = require("node:stream");
const node_util_1 = require("node:util");
const response_1 = require("./common/utils/response");
const post_1 = require("./modules/post");
const comment_1 = require("./modules/comment");
const graphql_1 = require("graphql");
const express_2 = require("graphql-http/lib/use/express");
const s3WriteStream = (0, node_util_1.promisify)(node_stream_1.pipeline);
const bootstrap = async () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    await (0, connection_db_1.default)();
    await redis_service_1.redisService.connect();
    const schema = new graphql_1.GraphQLSchema({
        query: new graphql_1.GraphQLObjectType({
            name: "testQuery",
            description: "testing",
            fields: {
                sayHi: {
                    type: graphql_1.GraphQLString,
                    resolve: () => {
                        return "hello world";
                    }
                }
            }
        })
    });
    app.all("/graphql", (0, express_2.createHandler)({ schema }));
    app.get("/", (req, res, next) => {
        res.status(404).json({ message: "landing page" });
    });
    app.use("/auth", auth_1.authRouter);
    app.use("/user", user_1.UserRouter);
    app.use("/post/:postId/comment", comment_1.CommentRouter);
    app.use("/:postId/comment", comment_1.CommentRouter);
    app.use("/post", post_1.PostRouter);
    app.get("/uploads/*path", async (req, res, next) => {
        const { download, fileName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const { Body, ContentType } = await services_1.s3Service.getAsset({ Key });
        console.log({ Body, ContentType });
        res.setHeader("Content-Type", ContentType || "application/octet-stream");
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        if (download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${fileName || Key.split("/").pop()}"`);
        }
        return await s3WriteStream(Body, res);
    });
    app.get("/pre-signed/*path", async (req, res, next) => {
        const { download, fileName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await services_1.s3Service.preSignedFetchLink({ Key, download, fileName });
        return (0, response_1.SuccessResponse)({ res, data: { url } });
    });
    app.all("/*dummy", (req, res, next) => {
        res.status(404).json({ message: "Invalid Routing" });
    });
    app.use(middleware_1.globalErrorHandling);
    app.listen(config_1.PORT, () => {
        console.log(`server is running on port ${config_1.PORT}`);
    });
};
exports.default = bootstrap;
