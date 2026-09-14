"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, UsersRound } from "lucide-react";
import { updateCommunityResult } from "@/app/actions";
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

export function CommunityInfoDrawer({
    community,
    onSaveError,
    onSaveStart,
    onSaveSuccess,
}: {
    community: {
        id: string;
        name: string;
        companyName: string | null;
        address: string | null;
    };
    onSaveError: (community: {
        id: string;
        name: string;
        companyName: string | null;
        address: string | null;
    }) => void;
    onSaveStart: (community: {
        id: string;
        name: string;
        companyName: string | null;
        address: string | null;
    }) => void;
    onSaveSuccess: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);

    return (
        <Drawer onOpenChange={setOpen} open={open} showSwipeHandle>
            <DrawerTrigger
                render={
                    <Button
                        className="h-10 rounded-md normal-case tracking-normal"
                        variant="outline">
                        <Pencil className="size-4" />
                        Edit information
                    </Button>
                }
            />
            <DrawerContent className="rounded-t-lg sm:mx-auto sm:max-w-md sm:rounded-lg">
                <form
                    onSubmit={async (event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        const nextCommunity = {
                            id: community.id,
                            name: String(formData.get("name") ?? "").trim(),
                            companyName:
                                String(
                                    formData.get("companyName") ?? "",
                                ).trim() || null,
                            address:
                                String(formData.get("address") ?? "").trim() ||
                                null,
                        };
                        if (!nextCommunity.name) {
                            toast.error("Community name is required.");
                            return;
                        }

                        onSaveStart(nextCommunity);
                        setOpen(false);
                        setPending(true);
                        try {
                            const result =
                                await updateCommunityResult(formData);
                            if (result.ok) {
                                toast.success(result.message);
                                onSaveSuccess();
                            } else {
                                onSaveError(community);
                                toast.error(result.message);
                            }
                        } catch {
                            onSaveError(community);
                            toast.error(
                                "Could not update that community. Try again.",
                            );
                        } finally {
                            setPending(false);
                        }
                    }}>
                    <input
                        name="communityId"
                        type="hidden"
                        value={community.id}
                    />
                    <DrawerHeader className="text-left">
                        <DrawerTitle className="normal-case tracking-normal">
                            Edit community
                        </DrawerTitle>
                        <DrawerDescription>
                            Update the basic info people see on this community.
                        </DrawerDescription>
                    </DrawerHeader>

                    <Separator className="my-4" />

                    <div className="grid gap-5 px-4">
                        <div className="grid gap-2">
                            <Label htmlFor="editCommunityName">Name</Label>
                            <Input
                                id="editCommunityName"
                                name="name"
                                defaultValue={community.name}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="editCompanyName">
                                Company{" "}
                                <span className="text-zinc-400">
                                    (optional)
                                </span>
                            </Label>
                            <Input
                                id="editCompanyName"
                                name="companyName"
                                defaultValue={community.companyName ?? ""}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="editCommunityAddress">
                                Address{" "}
                                <span className="text-zinc-400">
                                    (optional)
                                </span>
                            </Label>
                            <Input
                                id="editCommunityAddress"
                                name="address"
                                defaultValue={community.address ?? ""}
                            />
                        </div>
                    </div>

                    <DrawerFooter className="pt-5">
                        <Button
                            className="h-12 rounded-md bg-primary text-white normal-case tracking-normal hover:bg-primary-hover"
                            disabled={pending}
                            type="submit">
                            <UsersRound className="size-4" />
                            {pending ? "Saving..." : "Save changes"}
                        </Button>
                    </DrawerFooter>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
