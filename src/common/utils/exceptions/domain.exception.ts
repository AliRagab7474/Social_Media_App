import { ApplicationExceptions } from "./application.exception";

export class BadRequestException extends ApplicationExceptions{
    constructor(message:string ='BadRequestException' , cause?:unknown){
        super(message,400,cause)
    }
}
export class NotFoundException extends ApplicationExceptions{
    constructor(message:string ='NotFoundException' , cause?:unknown){
        super(message,404,cause)
    }
}
export class ConflictException extends ApplicationExceptions{
    constructor(message:string ='ConflictException' , cause?:unknown){
        super(message,409,cause)
    }
}
export class UnauthorizedException extends ApplicationExceptions{
    constructor(message:string ='UnauthorizedException' , cause?:unknown){
        super(message,401,cause)
    }
}
export class ForbiddenException extends ApplicationExceptions{
    constructor(message:string ='ForbiddenException' , cause?:unknown){
        super(message,403,cause)
    }
}