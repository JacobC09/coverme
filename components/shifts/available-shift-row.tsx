"use client";

import { Check, UsersRound } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { claimShiftResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { PersonBubble, PersonBubbleList } from "@/components/shifts/person-bubble";
import type { Shift } from "@/components/shifts/types";
import { formatShiftTime, splitShiftDate } from "@/components/shifts/time-utils";

export function AvailableShiftRow({
    shift,
    onClaimStart,
    onClaimSuccess,
    onClaimError,
}: {
    shift: Shift;
    onClaimStart?: () => void;
    onClaimSuccess?: () => void;
    onClaimError?: () => void;
}) {
    const [pending, startTransition] = useTransition();
    const [weekday, month, day] = splitShiftDate(shift.date);

    return (
        <article className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex gap-4">
                <div className="grid shrink-0 place-items-center rounded-md bg-primary px-3 py-2 text-center text-white">
                    <div>
                        <p className="text-sm font-black uppercase text-white/70">{weekday}</p>
                        <p className="text-base font-black uppercase">{month}</p>
                        <p className="text-4xl font-black leading-none">{day}</p>
                    </div>
                </div>

                <div className="mt-2 flex min-w-0 flex-1 justify-between gap-3">
                    <div className="min-w-0">
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                            {shift.role}
                        </span>
                        <div className="mt-2">
                            <PersonBubble name={shift.owner} />
                        </div>
                        <p className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm text-zinc-500">
                            <UsersRound className="size-4 shrink-0 text-zinc-400" />
                            <span className="truncate">{shift.community}</span>
                        </p>
                        {shift.targetNames.length ? (
                            <div className="mt-1 flex min-w-0 items-center gap-1.5">
                                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gold-foreground">For</span>
                                <PersonBubbleList names={shift.targetNames} />
                            </div>
                        ) : (
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Community shift</p>
                        )}
                        {shift.description ? <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-zinc-600">{shift.description}</p> : null}
                    </div>

                    <div className="hidden shrink-0 sm:block">
                        <div className="flex gap-1.5 text-xs">
                            <span className="rounded-full bg-gold px-2.5 py-1.5 font-black leading-none text-zinc-950">
                                {shift.length}
                            </span>
                            <span className="rounded-full bg-primary px-2.5 py-1.5 font-bold leading-none text-white">
                                {formatShiftTime(shift.time)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-2 flex gap-1.5 text-xs sm:hidden">
                <span className="rounded-full bg-gold px-2.5 py-1.5 font-black leading-none text-zinc-950">
                    {shift.length}
                </span>
                <span className="rounded-full bg-primary px-2.5 py-1.5 font-bold leading-none text-white">
                    {formatShiftTime(shift.time)}
                </span>
            </div>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    onClaimStart?.();
                    startTransition(async () => {
                        try {
                            const result = await claimShiftResult(formData);
                            if (result.ok) {
                                toast.success(result.message);
                                onClaimSuccess?.();
                            } else {
                                toast.error(result.message);
                                onClaimError?.();
                            }
                        } catch {
                            toast.error("Could not claim that shift. Try again.");
                            onClaimError?.();
                        }
                    });
                }}
            >
                <input name="id" type="hidden" value={shift.id} />
                <Button
                    className="mt-2 w-full rounded-md border-primary/25 bg-zinc-50 px-4 text-sm font-bold text-primary normal-case tracking-normal hover:bg-zinc-100"
                    disabled={pending}
                    type="submit"
                    variant="outline"
                >
                    <Check className="size-4" />
                    {pending ? "Claiming..." : "Claim shift"}
                </Button>
            </form>
        </article>
    );
}
