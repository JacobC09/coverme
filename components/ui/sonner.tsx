"use client";

import { useTheme } from "next-themes";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
    CircleCheckIcon,
    InfoIcon,
    TriangleAlertIcon,
    OctagonXIcon,
    Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme();
    const { toastOptions, ...toasterProps } = props;

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            closeButton
            icons={{
                success: <CircleCheckIcon className="size-4" />,
                info: <InfoIcon className="size-4" />,
                warning: <TriangleAlertIcon className="size-4" />,
                error: <OctagonXIcon className="size-4" />,
                loading: <Loader2Icon className="size-4 animate-spin" />,
            }}
            style={
                {
                    "--normal-bg": "var(--cream)",
                    "--normal-text": "var(--foreground)",
                    "--normal-border": "rgb(228 228 231)",
                    "--border-radius": "0.75rem",
                } as CSSProperties
            }
            toastOptions={{
                closeButton: false,
                ...toastOptions,
                duration: toastOptions?.duration ?? 3500,
                classNames: {
                    ...toastOptions?.classNames,
                    toast: "cn-toast border-zinc-200 bg-cream px-4 py-3 text-zinc-950 shadow-[0_14px_35px_rgba(18,52,59,0.16)]",
                    content: "gap-0.5",
                    title: "text-sm font-bold leading-5 tracking-normal",
                    description: "text-xs font-medium leading-5 text-zinc-600",
                    icon: "cn-toast-icon",
                    actionButton:
                        "rounded-md bg-primary px-3 text-xs font-bold text-white hover:bg-primary-hover",
                    cancelButton:
                        "rounded-md bg-zinc-100 px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-200",
                },
            }}
            {...toasterProps}
        />
    );
};

export { Toaster };
