"use client";

import { CalendarIcon, Clock } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { postShiftResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { TimePickerField } from "@/components/shifts/time-picker";
import type { CommunityOption, Shift } from "@/components/shifts/types";

export function OfferShiftDrawer({
    communities,
    ownerName,
    onDone,
    onPostError,
    onPostStart,
    onPostSuccess,
}: {
    communities: CommunityOption[];
    ownerName: string;
    onDone: () => void;
    onPostError: (temporaryId: string) => void;
    onPostStart: (shift: Shift) => void;
    onPostSuccess: (temporaryId: string, shift?: Shift) => void;
}) {
    const [pending, startTransition] = useTransition();
    const nextTemporaryId = useRef(0);
    const [date, setDate] = useState<Date>();
    const [time, setTime] = useState("");
    const [communityId, setCommunityId] = useState(communities[0]?.id ?? "");
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [targetOpen, setTargetOpen] = useState(false);
    const [targetQuery, setTargetQuery] = useState("");
    const [targetError, setTargetError] = useState("");
    const [targetIds, setTargetIds] = useState<string[]>([]);
    const targetPickerRef = useRef<HTMLDivElement>(null);
    const community = communities.find((item) => item.id === communityId);
    const [roleId, setRoleId] = useState(community?.roles[0]?.id ?? "");
    const selectedTargets =
        community?.members.filter((member) => targetIds.includes(member.id)) ??
        [];
    const targetResults =
        community?.members.filter((member) => {
            const query = targetQuery.trim().toLowerCase();
            if (targetIds.includes(member.id)) return false;
            if (!query) return true;
            return (
                member.name.toLowerCase().includes(query) ||
                member.email.toLowerCase().includes(query)
            );
        }) ?? [];

    const normalizedTime = time;
    const startsAt = useMemo(() => {
        if (!date || !normalizedTime) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}T${normalizedTime}`;
    }, [date, normalizedTime]);
    const today = useMemo(() => {
        const value = new Date();
        value.setHours(0, 0, 0, 0);
        return value;
    }, []);

    useEffect(() => {
        if (!targetOpen) return;

        function closeIfOutside(event: Event) {
            const target = event.target;
            if (
                !(target instanceof Node) ||
                targetPickerRef.current?.contains(target)
            )
                return;
            setTargetOpen(false);
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setTargetOpen(false);
        }

        document.addEventListener("pointerdown", closeIfOutside);
        document.addEventListener("focusin", closeIfOutside);
        document.addEventListener("keydown", closeOnEscape);

        return () => {
            document.removeEventListener("pointerdown", closeIfOutside);
            document.removeEventListener("focusin", closeIfOutside);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [targetOpen]);

    function optimisticShift(
        formData: FormData,
        temporaryId: string,
    ): Shift | null {
        const startsAtValue = String(formData.get("startsAt") ?? "");
        const startsAtDate = new Date(startsAtValue);
        const hours = Number(formData.get("lengthHours"));
        const roleName = community?.roles.find(
            (role) => role.id === roleId,
        )?.name;

        if (
            !community ||
            !roleName ||
            !startsAtDate.getTime() ||
            !Number.isFinite(hours) ||
            hours <= 0
        )
            return null;

        const endsAtDate = new Date(
            startsAtDate.getTime() + hours * 60 * 60 * 1000,
        );
        const startTime = startsAtDate.toLocaleTimeString("en-CA", {
            hour: "numeric",
            minute: "2-digit",
        });
        const endTime = endsAtDate.toLocaleTimeString("en-CA", {
            hour: "numeric",
            minute: "2-digit",
        });

        return {
            id: temporaryId,
            owner: ownerName,
            claimedBy: null,
            role: roleName,
            startsAt: startsAtDate.toISOString(),
            date: startsAtDate.toLocaleDateString("en-CA", {
                month: "short",
                day: "numeric",
                weekday: "short",
            }),
            time: startTime,
            timeRange: `${startTime} - ${endTime}`,
            length: `${hours}h`,
            community: community.name,
            description: String(formData.get("description") ?? "").trim(),
            targetNames: selectedTargets.map((target) => target.name),
            cancellationRequest: null,
            optimistic: true,
        };
    }

    return (
        <DrawerContent className="rounded-t-lg sm:mx-auto sm:max-w-md sm:rounded-lg">
            <form
                className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (targetQuery.trim()) {
                        setTargetError(
                            "Choose a person from the list or clear the search.",
                        );
                        setTargetOpen(true);
                        toast.error(
                            "Choose a requested person from the list before posting.",
                        );
                        return;
                    }

                    const formData = new FormData(event.currentTarget);
                    const temporaryId = `optimistic-shift-${nextTemporaryId.current++}`;
                    const shift = optimisticShift(formData, temporaryId);
                    if (!shift) {
                        toast.error("Add valid shift details before posting.");
                        return;
                    }

                    onPostStart(shift);
                    onDone();
                    startTransition(async () => {
                        try {
                            const result = await postShiftResult(formData);
                            if (result.ok) {
                                toast.success(result.message);
                                onPostSuccess(shift.id, result.data);
                            } else {
                                toast.error(result.message);
                                onPostError(shift.id);
                            }
                        } catch {
                            toast.error(
                                "Could not post that shift. Try again.",
                            );
                            onPostError(shift.id);
                        }
                    });
                }}>
                <DrawerHeader className="text-left">
                    <DrawerTitle className="normal-case tracking-normal">
                        Offer a shift
                    </DrawerTitle>
                    <DrawerDescription>
                        Post the key details so someone can claim it fast.
                    </DrawerDescription>
                </DrawerHeader>

                <Separator className="my-4" />

                <div className="grid gap-5 px-4">
                    <div className="grid gap-2">
                        <Label>Community</Label>
                        <Select
                            name="communityId"
                            onValueChange={(value) => {
                                setCommunityId(value ?? "");
                                setRoleId(
                                    communities.find(
                                        (community) => community.id === value,
                                    )?.roles[0]?.id ?? "",
                                );
                                setTargetIds([]);
                                setTargetQuery("");
                                setTargetOpen(false);
                            }}
                            value={communityId}>
                            <SelectTrigger className="h-11 w-full rounded-md border-zinc-200 px-3">
                                <SelectValue placeholder="Choose a community">
                                    {community?.name}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {communities.map((community) => (
                                    <SelectItem
                                        key={community.id}
                                        value={community.id}>
                                        {community.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative grid gap-2" ref={targetPickerRef}>
                        <Label htmlFor="targetSearch">
                            Request people{" "}
                            <span className="text-zinc-400">(optional)</span>
                        </Label>
                        <div
                            className="rounded-md border border-zinc-200 bg-white px-2 py-2"
                            onClick={() => setTargetOpen(true)}>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedTargets.map((member) => (
                                    <button
                                        className="rounded-full bg-amber-100 hover:bg-red-100 transition-colors px-2.5 py-1 text-xs font-bold text-amber-800"
                                        key={member.id}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setTargetIds((current) =>
                                                current.filter(
                                                    (id) => id !== member.id,
                                                ),
                                            );
                                        }}
                                        type="button">
                                        {member.name}
                                    </button>
                                ))}
                                <input
                                    className="min-w-28 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-zinc-400"
                                    id="targetSearch"
                                    onChange={(event) => {
                                        setTargetQuery(event.target.value);
                                        setTargetError("");
                                        setTargetOpen(true);
                                    }}
                                    onFocus={() => setTargetOpen(true)}
                                    placeholder={
                                        selectedTargets.length
                                            ? "Add another"
                                            : "All Members"
                                    }
                                    value={targetQuery}
                                />
                            </div>
                        </div>
                        {targetOpen ? (
                            <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg">
                                {targetResults.length ? (
                                    <div className="grid max-h-55 gap-1 overflow-y-auto">
                                        {targetResults.map((member) => (
                                            <button
                                                className="px-3 py-2 rounded text-left text-sm font-semibold hover:bg-zinc-100"
                                                key={member.id}
                                                onClick={() => {
                                                    setTargetIds((current) => [
                                                        ...current,
                                                        member.id,
                                                    ]);
                                                    setTargetQuery("");
                                                    setTargetError("");
                                                    setTargetOpen(false);
                                                }}
                                                type="button">
                                                {member.name}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-3 py-2 text-sm font-medium text-zinc-500">
                                        No matching people
                                    </div>
                                )}
                                {targetResults.length > 5 ? (
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-white via-white/90 to-transparent pb-1 pt-6">
                                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                                            Scroll
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                        {targetError ? (
                            <p className="text-sm font-medium text-red-600">
                                {targetError}
                            </p>
                        ) : null}
                        {targetIds.map((id) => (
                            <input
                                key={id}
                                name="targetUserIds"
                                type="hidden"
                                value={id}
                            />
                        ))}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            name="roleId"
                            onValueChange={(value) => setRoleId(value ?? "")}
                            value={roleId}>
                            <SelectTrigger className="h-11 w-full rounded-md border-zinc-200 px-3">
                                <SelectValue placeholder="Choose a role">
                                    {
                                        community?.roles.find(
                                            (role) => role.id === roleId,
                                        )?.name
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {community?.roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Date</Label>
                        <Popover
                            onOpenChange={setCalendarOpen}
                            open={calendarOpen}>
                            <PopoverTrigger
                                render={
                                    <Button
                                        className="h-11 justify-start rounded-md border-zinc-200 bg-white px-3 text-left font-normal normal-case tracking-normal text-zinc-700 hover:bg-zinc-50"
                                        variant="outline">
                                        <CalendarIcon className="size-4 text-zinc-500" />
                                        {date
                                            ? date.toLocaleDateString("en-CA", {
                                                  month: "long",
                                                  day: "numeric",
                                                  weekday: "long",
                                              })
                                            : "Pick a date"}
                                    </Button>
                                }
                            />
                            <PopoverContent
                                align="start"
                                className="w-auto p-0">
                                <Calendar
                                    disabled={{ before: today }}
                                    mode="single"
                                    onSelect={(value) => {
                                        setDate(value);
                                        if (value) setCalendarOpen(false);
                                    }}
                                    selected={date}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <input name="startsAt" type="hidden" value={startsAt} />

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="time">Start time</Label>
                            </div>
                            <TimePickerField onChange={setTime} value={time} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lengthHours">Length</Label>
                            <Input
                                id="lengthHours"
                                min="0.5"
                                name="lengthHours"
                                placeholder="2.5"
                                required
                                step="0.25"
                                type="number"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Lane swim, lessons, closing duties..."
                        />
                    </div>
                </div>

                <DrawerFooter className="pt-5">
                    <Button
                        className="h-12 rounded-md bg-primary normal-case tracking-normal hover:bg-primary-hover"
                        disabled={
                            !startsAt || !communityId || !roleId || pending
                        }
                        type="submit">
                        <Clock className="size-4" />
                        {pending ? "Posting..." : "Post shift"}
                    </Button>
                </DrawerFooter>
            </form>
        </DrawerContent>
    );
}
