"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, UsersRound } from "lucide-react";
import { createCommunityResult } from "@/app/actions";
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

export function CreateCommunityDrawer({
  onCreateError,
  onCreateStart,
  onCreateSuccess,
}: {
  onCreateError: (temporaryId: string) => void;
  onCreateStart: (community: CommunitySummary) => void;
  onCreateSuccess: (temporaryId: string, community?: CommunitySummary) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const nextTemporaryId = useRef(0);

  return (
    <Drawer onOpenChange={setOpen} open={open} showSwipeHandle>
      <DrawerTrigger
        render={
          <Button className="rounded-md border-primary/25 bg-white text-primary normal-case tracking-normal hover:bg-zinc-50" variant="outline">
            <Plus className="size-4" />
            Community
          </Button>
        }
      />
      <DrawerContent className="rounded-t-lg sm:mx-auto sm:max-w-md sm:rounded-lg">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const communityName = String(formData.get("name") ?? "").trim();
            const nextCompanyName = String(formData.get("companyName") ?? "");
            const nextAddress = String(formData.get("address") ?? "");
            const temporaryId = `optimistic-community-${nextTemporaryId.current++}`;

            if (!communityName) {
              toast.error("Community name is required.");
              return;
            }

            onCreateStart({
              id: temporaryId,
              name: communityName,
              companyName: nextCompanyName.trim() || null,
              address: nextAddress.trim() || null,
              inviteCode: "Pending",
              members: [{}],
              optimistic: true,
            });
            setName("");
            setCompanyName("");
            setAddress("");
            setOpen(false);
            setPending(true);
            try {
              const result = await createCommunityResult(formData);
              if (result.ok) {
                toast.success(result.message);
                onCreateSuccess(temporaryId, result.data);
              } else {
                onCreateError(temporaryId);
                setName(communityName);
                setCompanyName(nextCompanyName);
                setAddress(nextAddress);
                toast.error(result.message);
              }
            } catch {
              onCreateError(temporaryId);
              setName(communityName);
              setCompanyName(nextCompanyName);
              setAddress(nextAddress);
              toast.error("Could not create that community. Try again.");
            } finally {
              setPending(false);
            }
          }}
        >
          <DrawerHeader className="text-left">
            <DrawerTitle className="normal-case tracking-normal">Create community</DrawerTitle>
            <DrawerDescription>Make a shared space for people who can see and claim shifts.</DrawerDescription>
          </DrawerHeader>

          <Separator className="my-4" />

          <div className="grid gap-5 px-4">
            <div className="grid gap-2">
              <Label htmlFor="communityName">Name</Label>
              <Input id="communityName" name="name" onChange={(event) => setName(event.target.value)} placeholder="Oakville Lifeguards" required value={name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company <span className="text-zinc-400">(optional)</span></Label>
              <Input id="companyName" name="companyName" onChange={(event) => setCompanyName(event.target.value)} placeholder="Town of Oakville" value={companyName} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="communityAddress">Address <span className="text-zinc-400">(optional)</span></Label>
              <Input id="communityAddress" name="address" onChange={(event) => setAddress(event.target.value)} placeholder="Community centre address" value={address} />
            </div>
          </div>

          <DrawerFooter className="pt-5">
            <Button className="h-12 rounded-md bg-primary text-white normal-case tracking-normal hover:bg-primary-hover" disabled={pending} type="submit">
              <UsersRound className="size-4" />
              {pending ? "Creating..." : "Create community"}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
