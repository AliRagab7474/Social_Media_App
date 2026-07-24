import { IPost } from "../../common/interfaces";
import { PostModel } from "../models/post.model";
import { DatabaseRepository } from "./base.repository";

export class PostRepository extends DatabaseRepository<IPost>{
    constructor(){
        super(PostModel)
    }
}