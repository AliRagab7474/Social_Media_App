"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationExceptions = void 0;
class ApplicationExceptions extends Error {
    statusCode;
    constructor(message, statusCode, cause) {
        super(message, { cause });
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationExceptions = ApplicationExceptions;
