"use client";

import { Check, UsersRound } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { claimShiftResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { PersonBubble } from "@/components/shifts/person-bubble";
import type { Shift } from "@/components/shifts/types";
import {
    formatShiftTime,
    splitShiftDate,
} from "@/components/shifts/time-utils";

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
        <article className="flex flex-col rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="flex h-full shrink-0 flex-col items-center justify-center rounded-md bg-primary px-3 py-2 text-center text-white">
                    <p className="text-sm font-black uppercase text-white/70">
                        {weekday}
                    </p>
                    <p className="text-base font-black uppercase">{month}</p>
                    <p className="text-4xl font-black leading-none">{day}</p>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2 text-sm font-bold">
                        <div className="flex gap-2 flex-wrap">
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1.5 leading-none text-amber-800">
                                {shift.role}
                            </span>
                            {shift.targetNames.length ? (
                                <span className="inline-flex items-center shrink-0 rounded-full bg-blue-100 px-2.5 py-1.5 leading-none text-blue-800">
                                    Specific request
                                </span>
                            ) : null}
                        </div>
                        <span className="inline-flex items-center rounded-full bg-gold px-2.5 py-1.5 leading-none text-zinc-950">
                            {shift.length}
                        </span>
                    </div>

                    <div className="grid items-center py-2">
                        <p className="text-xl font-black leading-tight text-zinc-950">
                            {formatShiftTime(shift.timeRange)}
                        </p>
                        <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-zinc-600">
                            <UsersRound className="size-4 shrink-0 text-zinc-400" />
                            <span className="leading-tight">
                                {shift.community}
                            </span>
                        </p>
                        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sm font-semibold text-zinc-600">
                            <span className="shrink-0">Covering</span>
                            <PersonBubble name={shift.owner} />
                        </div>
                        {shift.description ? (
                            <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-zinc-600">
                                {shift.description}
                            </p>
                        ) : null}
                    </div>
                </div>
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
                            toast.error(
                                "Could not claim that shift. Try again.",
                            );
                            onClaimError?.();
                        }
                    });
                }}>
                <input name="id" type="hidden" value={shift.id} />
                <Button
                    className="mt-3 w-full rounded-md border-primary/25 bg-zinc-50 px-4 text-sm font-bold text-primary normal-case tracking-normal hover:bg-zinc-100"
                    disabled={pending}
                    type="submit"
                    variant="outline">
                    <Check className="size-4" />
                    {pending ? "Claiming..." : "Claim shift"}
                </Button>
            </form>
        </article>
    );
}
