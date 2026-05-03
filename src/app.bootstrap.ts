import express from "express";
import { authRouter } from "./modules/auth";
import { globalErrorHandling } from "./middleware";
import { PORT } from "./config/config";
import connectionDB from "./DB/connection.db";
import { redisService } from "./common/services/redis.service";
import { UserRouter } from "./modules/user";

const bootstrap = async() => {
  const app = express();
  app.use(express.json())

  //connectionDB
  await connectionDB();
  await redisService.connect();


  app.get("/",(req:express.Request,res:express.Response,next:express.NextFunction)=>{
    res.status(404).json({message:"landing page"})
  })

  //application routing
  app.use("/auth",authRouter)
  app.use("/user",UserRouter)

  //dummy routing
  app.get("/*dummy",(req:express.Request,res:express.Response,next:express.NextFunction)=>{
    res.status(404).json({message:"Invalid Routing"})
  })

  //global error handling
  app.use(globalErrorHandling)

  //listener
  app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
    
  })
};
export default bootstrap;
