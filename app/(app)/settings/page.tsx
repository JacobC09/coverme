import { redirect } from "next/navigation";
import { SettingsScreen } from "@/components/settings/settings-screen";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth");

    return (
        <SettingsScreen
            user={user}
            pushPublicKey={process.env.VAPID_PUBLIC_KEY}
        />
    );
}
