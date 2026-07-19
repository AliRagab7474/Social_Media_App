import { FileFilterCallback } from "multer"
import { BadRequestException } from "../exceptions"
import type { Request } from "express";


export const fileValidationField = {
    image:['image/jpeg','image/jpg','image/png'],
    video:['video/mp4']
}

export const fileFilter = (validation:string[])=>{
    return function(req:Request,file:Express.Multer.File,cb:FileFilterCallback){
        if (!validation.includes(file.mimetype)) {
            return cb(new BadRequestException("Invalid format"))
        }
        return cb(null,true)
    }
}