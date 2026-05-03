"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const config_1 = require("../config/config");
const connectionDB = async () => {
    try {
        await (0, mongoose_1.connect)(config_1.DB_URI, { serverSelectionTimeoutMS: 30000 });
        console.log(`Database connected successfully`);
    }
    catch (error) {
        console.log(`failed to connect to DB`);
    }
};
exports.default = connectionDB;
