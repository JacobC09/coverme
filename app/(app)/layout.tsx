import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { MobileNav } from "@/components/mobile-nav";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({ children }: { children: ReactNode }) {
    const user = await getCurrentUser();

    if (!user) redirect("/auth");

    return (
        <>
            {children}
            <MobileNav />
            <Toaster
                className="z-10"
                position="bottom-right"
                offset={{
                    bottom: "calc(5.75rem + env(safe-area-inset-bottom))",
                    right: "max(1rem, 2rem)",
                }}
                mobileOffset={{
                    bottom: "calc(5.75rem + env(safe-area-inset-bottom))",
                    left: "1rem",
                    right: "1rem",
                }}
            />
        </>
    );
}
