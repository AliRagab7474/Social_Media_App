import { getMessaging } from "firebase-admin/messaging";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";

export class NotificationService {

constructor() {
    const serviceAccount = JSON.parse(
        readFileSync(
            resolve("./src/config/social-media-99603-firebase-adminsdk-fbsvc-79b48d048e.json"),
            'utf-8'
        ),
    );

    if (!getApps().length) {
        initializeApp({
            credential: cert(serviceAccount),
        });
    }}


  async sendNotification({
    token,
    data,
  }: {
    token: string;
    data: { title: string; body: string };
  }) {
    return await getMessaging().send({ token, data });
  }

  async sendNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: { title: string; body: string };
  }) {
    await Promise.allSettled(
      tokens.map(token => this.sendNotification({ token, data }))
    );
  }
}

export const notificationService = new NotificationService();