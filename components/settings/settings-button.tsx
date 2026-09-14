"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";

export function SettingsButton() {
    const router = useRouter();

    return (
        <Link
            className={buttonVariants({ variant: "ghost", size: "icon" })}
            href="/settings"
            onFocus={() => router.prefetch("/settings")}
            onPointerEnter={() => router.prefetch("/settings")}
            onTouchStart={() => router.prefetch("/settings")}
            prefetch
            title="Settings">
            <Settings className="size-5" />
        </Link>
    );
}
