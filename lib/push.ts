import webPush from "web-push";
import { prisma } from "@/lib/prisma";

type PushPayload = {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    icon?: string;
    badge?: string;
    image?: string;
    requireInteraction?: boolean;
};

function configureWebPush() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.WEB_PUSH_EMAIL;

    if (
        typeof publicKey !== "string" ||
        typeof privateKey !== "string" ||
        typeof email !== "string"
    )
        return false;

    webPush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
    return true;
}

function isExpiredSubscriptionError(error: unknown) {
    return (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        (error.statusCode === 404 || error.statusCode === 410)
    );
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
    const uniqueUserIds = [...new Set(userIds)];
    if (!uniqueUserIds.length || !configureWebPush()) return;

    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: { in: uniqueUserIds } },
    });

    await Promise.all(
        subscriptions.map(async (subscription) => {
            try {
                await webPush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: {
                            auth: subscription.auth,
                            p256dh: subscription.p256dh,
                        },
                        expirationTime: subscription.expirationTime
                            ? Number(subscription.expirationTime)
                            : null,
                    },
                    JSON.stringify(payload),
                );
            } catch (error) {
                if (isExpiredSubscriptionError(error)) {
                    await prisma.pushSubscription.deleteMany({
                        where: { endpoint: subscription.endpoint },
                    });
                    return;
                }

                console.error("Could not send push notification", error);
            }
        }),
    );
}
