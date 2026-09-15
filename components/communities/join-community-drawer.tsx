"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { joinCommunityResult } from "@/app/actions";
import type { CommunitySummary } from "@/components/communities/types";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function JoinCommunityDrawer({
    error,
    onJoinSuccess,
}: {
    error?: string;
    onJoinSuccess: (community: CommunitySummary) => void;
}) {
    const [open, setOpen] = useState(error === "code");
    const [pending, setPending] = useState(false);

    return (
        <Drawer onOpenChange={setOpen} open={open} showSwipeHandle>
            <DrawerTrigger
                render={
                    <Button className="rounded-md bg-primary text-white normal-case tracking-normal hover:bg-primary-hover">
                        <LogIn className="size-4" />
                        Join
                    </Button>
                }
            />
            <DrawerContent className="rounded-t-lg sm:mx-auto sm:max-w-md sm:rounded-lg">
                <form
                    onSubmit={async (event) => {
                        event.preventDefault();
                        setPending(true);
                        try {
                            const result = await joinCommunityResult(
                                new FormData(event.currentTarget),
                            );
                            if (result.ok) {
                                toast.success(result.message);
                                setOpen(false);
                                if (result.data) onJoinSuccess(result.data);
                            } else {
                                toast.error(result.message);
                            }
                        } catch {
                            toast.error(
                                "Could not join that community. Try again.",
                            );
                        } finally {
                            setPending(false);
                        }
                    }}>
                    <DrawerHeader className="text-left">
                        <DrawerTitle className="normal-case tracking-normal">
                            Join community
                        </DrawerTitle>
                        <DrawerDescription>
                            Enter an invite code to join a community.
                        </DrawerDescription>
                    </DrawerHeader>

                    <Separator className="my-4" />

                    <div className="grid gap-2 px-4">
                        <Label htmlFor="inviteCode">Invite code</Label>
                        <Input
                            className="h-12 uppercase"
                            id="inviteCode"
                            name="inviteCode"
                            placeholder="ABC123"
                            required
                        />
                        {error === "code" ? (
                            <p className="text-sm font-semibold text-red-700">
                                That invite code did not match a community.
                            </p>
                        ) : null}
                    </div>

                    <DrawerFooter className="pt-5">
                        <Button
                            className="h-12 rounded-md bg-primary text-white normal-case tracking-normal hover:bg-primary-hover"
                            disabled={pending}
                            type="submit">
                            <LogIn className="size-4" />
                            {pending ? "Joining..." : "Join community"}
                        </Button>
                    </DrawerFooter>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
