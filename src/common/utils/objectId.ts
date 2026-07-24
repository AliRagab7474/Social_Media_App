import { Types } from "mongoose"

export const getObjectId = (id:string)=> {
return Types.ObjectId.createFromHexString(id)
}