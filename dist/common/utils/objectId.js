"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjectId = void 0;
const mongoose_1 = require("mongoose");
const getObjectId = (id) => {
    return mongoose_1.Types.ObjectId.createFromHexString(id);
};
exports.getObjectId = getObjectId;
