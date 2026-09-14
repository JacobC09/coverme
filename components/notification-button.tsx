"use client";

import { Bell, BellOff } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { deletePushSubscription, savePushSubscription } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationStatus =
    "checking" | "unsupported" | "disabled" | "denied" | "enabled";

function publicKeyToUint8Array(publicKey: string) {
    const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
    const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function isSupported() {
    return (
        window.isSecureContext &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
}

function notificationTitle(
    status: NotificationStatus,
    enabled: boolean,
    publicKey?: string,
) {
    if (status === "denied") return "Notifications are blocked in this browser";
    if (status === "unsupported")
        return "Notifications are not supported in this browser";
    if (!publicKey)
        return "Notifications need VAPID keys before they can be enabled";
    return enabled
        ? "Turn shift notifications off"
        : "Turn shift notifications on";
}

function useNotificationControl(publicKey?: string) {
    const [status, setStatus] = useState<NotificationStatus>("checking");
    const [registration, setRegistration] =
        useState<ServiceWorkerRegistration | null>(null);
    const [pending, setPending] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function checkSubscription() {
            if (!isSupported()) {
                setStatus("unsupported");
                return;
            }

            if (Notification.permission === "denied") {
                setStatus("denied");
                return;
            }

            const nextRegistration =
                await navigator.serviceWorker.register("/sw.js");
            const subscription =
                await nextRegistration.pushManager.getSubscription();

            if (!cancelled) {
                setRegistration(nextRegistration);
                setStatus(subscription ? "enabled" : "disabled");
            }
        }

        checkSubscription().catch(() => {
            if (!cancelled) setStatus("unsupported");
        });

        return () => {
            cancelled = true;
        };
    }, [publicKey]);

    const enabled = status === "enabled";

    async function toggleNotifications() {
        const toastId = toast.loading(
            enabled
                ? "Turning notifications off..."
                : "Turning notifications on...",
        );

        try {
            if (!isSupported()) {
                setStatus("unsupported");
                toast.error("Notifications need the installed app on HTTPS.", {
                    id: toastId,
                });
                return;
            }

            if (Notification.permission === "denied") {
                setStatus("denied");
                toast.error(
                    "Notifications are blocked in this browser. Enable them in site settings first.",
                    {
                        id: toastId,
                    },
                );
                return;
            }

            const activeRegistration =
                registration ??
                (await navigator.serviceWorker.register("/sw.js"));
            setRegistration(activeRegistration);
            const existing =
                await activeRegistration.pushManager.getSubscription();

            if (existing) {
                setStatus("disabled");
                const result = await deletePushSubscription(existing.endpoint);
                await existing.unsubscribe();

                if (!result.ok) {
                    setStatus("enabled");
                    toast.error(result.message, { id: toastId });
                    return;
                }

                toast.success("Shift notifications turned off.", {
                    id: toastId,
                });
                return;
            }

            if (!publicKey) {
                toast.error("Notifications are not configured yet.", {
                    id: toastId,
                });
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setStatus(permission === "denied" ? "denied" : "disabled");
                toast.error("Notifications were not enabled.", { id: toastId });
                return;
            }

            setStatus("enabled");

            const subscription = await activeRegistration.pushManager.subscribe(
                {
                    userVisibleOnly: true,
                    applicationServerKey: publicKeyToUint8Array(publicKey),
                },
            );

            const result = await savePushSubscription(subscription.toJSON());
            if (!result.ok) {
                await subscription.unsubscribe();
                setStatus("disabled");
                toast.error(result.message, { id: toastId });
                return;
            }

            toast.success("Shift notifications turned on.", { id: toastId });
        } catch (error) {
            console.error(error);
            setStatus(enabled ? "enabled" : "disabled");
            toast.error("Could not update notifications.", { id: toastId });
        } finally {
            setPending(false);
        }
    }

    return {
        enabled,
        pending,
        status,
        title: notificationTitle(status, enabled, publicKey),
        toggleNotifications: () => {
            setPending(true);
            void toggleNotifications();
        },
    };
}

export function NotificationButton({
    publicKey,
    className,
}: {
    publicKey?: string;
    className?: string;
}) {
    const { enabled, pending, title, toggleNotifications } =
        useNotificationControl(publicKey);

    return (
        <Button
            className={cn("rounded-md", className)}
            disabled={pending}
            onClick={toggleNotifications}
            size="icon"
            title={title}
            type="button"
            variant={enabled ? "default" : "ghost"}>
            {enabled ? (
                <Bell className="size-5" />
            ) : (
                <BellOff className="size-5" />
            )}
        </Button>
    );
}

export function NotificationSettingsToggle({
    icons,
    publicKey,
}: {
    icons?: { enabled: ReactNode; disabled: ReactNode };
    publicKey?: string;
}) {
    const { enabled, pending, status, title, toggleNotifications } =
        useNotificationControl(publicKey);
    const statusLabel =
        status === "checking"
            ? "Checking"
            : status === "denied"
              ? "Blocked"
              : status === "unsupported"
                ? "Unavailable"
                : enabled
                  ? "On"
                  : "Off";

    return (
        <Button
            className="min-w-24 rounded-md normal-case tracking-normal"
            disabled={pending || status === "checking"}
            onClick={toggleNotifications}
            title={title}
            type="button"
            variant={enabled ? "default" : "outline"}>
            {enabled ? icons?.enabled : icons?.disabled}
            {pending ? "Updating..." : statusLabel}
        </Button>
    );
}
