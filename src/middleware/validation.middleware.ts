import { type Request,type Response,type NextFunction } from 'express'
import { BadRequestException } from '../common/utils/exceptions'
import {  ZodError, ZodType } from 'zod'

type typeKeys = keyof Request
type SchemaType = Partial<Record<typeKeys,ZodType>>
type IssueType = Array<{
    key:typeKeys,
    issues:Array<{
        message:string,
        path:Array<(symbol|number|string|null|undefined)>
    }>
}>

export const validation = (schema:SchemaType)=>{
    return (req:Request,res:Response,next:NextFunction)=>{

        const issues:IssueType= []
       
        for (const key of Object.keys(schema) as typeKeys[]) {
             if (!schema[key]) continue;
             if (req.file) {
                req.body.file = req.file
             }
             if (req.files) {
                req.body.files = req.files
             }
            const validationResult = schema[key].safeParse(req[key])
            if (!validationResult.success) {
                const error = validationResult.error as ZodError
                issues.push({key,issues:error.issues.map((issue)=>{return{message:issue.message,path:issue.path}})})
            }
        }
        if (issues.length) {
            throw new BadRequestException("validation Error",{issues})
        }
        next()
    }
}