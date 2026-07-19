"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandling = void 0;
const globalErrorHandling = (error, req, res, next) => {
    if (error.name == "MulterError") {
        error.statusCode = 400;
    }
    const status = error.statusCode || 500;
    return res.status(status).json({
        message: error.message,
        cause: error.cause,
        stack: error.stack,
        error,
    });
};
exports.globalErrorHandling = globalErrorHandling;
