"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const messaging_1 = require("firebase-admin/messaging");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const app_1 = require("firebase-admin/app");
class NotificationService {
    constructor() {
        const serviceAccount = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.resolve)("./src/config/social-media-99603-firebase-adminsdk-fbsvc-79b48d048e.json"), 'utf-8'));
        if (!(0, app_1.getApps)().length) {
            (0, app_1.initializeApp)({
                credential: (0, app_1.cert)(serviceAccount),
            });
        }
    }
    async sendNotification({ token, data, }) {
        return await (0, messaging_1.getMessaging)().send({ token, data });
    }
    async sendNotifications({ tokens, data, }) {
        await Promise.allSettled(tokens.map(token => this.sendNotification({ token, data })));
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
