"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenException = exports.UnauthorizedException = exports.ConflictException = exports.NotFoundException = exports.BadRequestException = void 0;
const application_exception_1 = require("./application.exception");
class BadRequestException extends application_exception_1.ApplicationExceptions {
    constructor(message = 'BadRequestException', cause) {
        super(message, 400, cause);
    }
}
exports.BadRequestException = BadRequestException;
class NotFoundException extends application_exception_1.ApplicationExceptions {
    constructor(message = 'NotFoundException', cause) {
        super(message, 404, cause);
    }
}
exports.NotFoundException = NotFoundException;
class ConflictException extends application_exception_1.ApplicationExceptions {
    constructor(message = 'ConflictException', cause) {
        super(message, 409, cause);
    }
}
exports.ConflictException = ConflictException;
class UnauthorizedException extends application_exception_1.ApplicationExceptions {
    constructor(message = 'UnauthorizedException', cause) {
        super(message, 401, cause);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends application_exception_1.ApplicationExceptions {
    constructor(message = 'ForbiddenException', cause) {
        super(message, 403, cause);
    }
}
exports.ForbiddenException = ForbiddenException;
