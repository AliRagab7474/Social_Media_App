import {z} from 'zod'
import { ConfirmEmail, loginSchema, resendConfirmEmail, SignupSchema } from './auth.validation'
// export interface LoginDto{
//     email:string,
//     password:string
// }
// export interface SignupDto extends LoginDto{
//     username:string
//     phone:string
    
// }

export type LoginDto = z.infer<typeof loginSchema.body>
export type SignupDto = z.infer<typeof SignupSchema.body>
export type ConfirmEmailDto = z.infer<typeof ConfirmEmail.body>
export type resendConfirmEmailDto = z.infer<typeof resendConfirmEmail.body>