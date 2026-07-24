import express from "express";
import { authRouter } from "./modules/auth";
import { globalErrorHandling } from "./middleware";
import { PORT } from "./config/config";
import connectionDB from "./DB/connection.db";
import { redisService } from "./common/services/redis.service";
import { UserRouter } from "./modules/user";
import { s3Service } from "./common/services";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { SuccessResponse } from "./common/utils/response";
import { PostRouter } from "./modules/post";
import { CommentRouter } from "./modules/comment";

const s3WriteStream = promisify(pipeline);

const bootstrap = async () => {
  const app = express();

  app.use(express.json());

  //connectionDB
  await connectionDB();
  await redisService.connect();

  app.get(
    "/",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      res.status(404).json({ message: "landing page" });
    },
  );

  //application routing

  app.use("/auth", authRouter);
  app.use("/user", UserRouter);
  app.use("/post/:postId/comment", CommentRouter);
  app.use("/:postId/comment", CommentRouter);
  app.use("/post", PostRouter);
  app.get(
    "/uploads/*path",
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      const {download , fileName} = req.query as {download:string , fileName : string}
      const { path } = req.params as { path: string[] };
      const Key = path.join("/");
      const { Body, ContentType } = await s3Service.getAsset({ Key });
      console.log({ Body, ContentType });
      
      res.setHeader("Content-Type", ContentType || "application/octet-stream");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      if (download === "true") {
        
        res.setHeader("Content-Disposition", `attachment; filename="${fileName || Key.split("/").pop()}"`); // only apply it for  download
      }


      return await s3WriteStream(Body as NodeJS.ReadableStream, res);
    },
  );
  app.get(
    "/pre-signed/*path",
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      const {download , fileName} = req.query as {download:string , fileName : string}
      const { path } = req.params as { path: string[] };
      const Key = path.join("/");
      const url = await s3Service.preSignedFetchLink({Key,download , fileName})
      return SuccessResponse({res,data:{url}})
    },
  );

  //dummy routing
  app.all(
    "/*dummy",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      res.status(404).json({ message: "Invalid Routing" });
    },
  );

  //global error handling
  app.use(globalErrorHandling);

  //listener
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
};
export default bootstrap;
