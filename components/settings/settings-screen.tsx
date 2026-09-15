"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellOff, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { signOut, updateSettingsResult } from "@/app/actions";
import { NotificationSettingsToggle } from "@/components/notification-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@/lib/generated/prisma/browser";

export function SettingsScreen({
    user,
    pushPublicKey,
}: {
    user: User;
    pushPublicKey?: string;
}) {
    const router = useRouter();
    const [currentName, setCurrentName] = useState(user.name);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pending, setPending] = useState(false);
    const showConfirmPassword = password.length > 0;

    return (
        <main className="grid gap-7 text-zinc-950">
            <header className="flex items-center justify-between">
                <Button
                    className="rounded-md bg-zinc-200/50 text-zinc-700 hover:bg-zinc-200"
                    onClick={() => router.back()}
                    size="icon"
                    title="Back"
                    type="button"
                    variant="ghost">
                    <ArrowLeft className="size-5" />
                </Button>
                <h1 className="text-2xl font-bold tracking-normal">Settings</h1>
                <div className="size-10" />
            </header>

            <form
                className="grid gap-6"
                onSubmit={async (event) => {
                    event.preventDefault();

                    if (password && password !== confirmPassword) {
                        toast.error("Passwords do not match.");
                        return;
                    }

                    setPending(true);
                    try {
                        const result = await updateSettingsResult(
                            new FormData(event.currentTarget),
                        );
                        if (result.ok) {
                            setPassword("");
                            setConfirmPassword("");
                            toast.success(result.message);
                            router.refresh();
                        } else {
                            toast.error(result.message);
                        }
                    } catch {
                        toast.error("Could not update settings. Try again.");
                    } finally {
                        setPending(false);
                    }
                }}>
                <section className="grid gap-5 rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            autoComplete="name"
                            className="h-12"
                            id="name"
                            name="name"
                            onChange={(event) =>
                                setCurrentName(event.target.value)
                            }
                            required
                            value={currentName}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email" className="opacity-50">
                            Email
                        </Label>
                        <Input
                            disabled
                            className="h-12"
                            value={user.email}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">New password</Label>
                        <Input
                            autoComplete="new-password"
                            className="h-12"
                            id="password"
                            minLength={password ? 8 : undefined}
                            name="password"
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            type="password"
                            value={password}
                        />
                    </div>

                    {showConfirmPassword ? (
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">
                                Confirm password
                            </Label>
                            <Input
                                autoComplete="new-password"
                                className="h-12"
                                id="confirmPassword"
                                minLength={8}
                                name="confirmPassword"
                                onChange={(event) =>
                                    setConfirmPassword(event.target.value)
                                }
                                required
                                type="password"
                                value={confirmPassword}
                            />
                        </div>
                    ) : (
                        <input name="confirmPassword" type="hidden" value="" />
                    )}

                    <Button
                        className="h-12 rounded-md bg-primary text-white normal-case tracking-normal hover:bg-primary-hover"
                        disabled={pending}
                        type="submit">
                        <Save className="size-4" />
                        {pending ? "Saving..." : "Save settings"}
                    </Button>
                </section>
            </form>

            <section className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-base font-bold">Notifications</h2>
                        <p className="text-sm font-medium text-zinc-500">
                            Shift alerts for this browser
                        </p>
                    </div>
                    <NotificationSettingsToggle
                        icons={{
                            enabled: <Bell className="size-4" />,
                            disabled: <BellOff className="size-4" />,
                        }}
                        publicKey={pushPublicKey}
                    />
                </div>
            </section>

            <form action={signOut}>
                <Button
                    className="h-12 w-full rounded-md normal-case tracking-normal"
                    type="submit"
                    variant="destructive">
                    <LogOut className="size-4" />
                    Sign out
                </Button>
            </form>
        </main>
    );
}
