import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const user = await getCurrentUser();
    if (user) redirect("/");

    const { error } = await searchParams;

    return <AuthPanel error={error} />;
}
