"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelShiftOfferResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { PersonBubbleList } from "@/components/shifts/person-bubble";
import type { Shift } from "@/components/shifts/types";
import { formatShiftTime, splitShiftDate } from "@/components/shifts/time-utils";

export function OfferShiftRow({
    shift,
    onCancelError,
    onCancelStart,
    onCancelSuccess,
}: {
    shift: Shift;
    onCancelError?: () => void;
    onCancelStart?: () => void;
    onCancelSuccess?: () => void;
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const [weekday, month, day] = splitShiftDate(shift.date);

    return (
        <article className={`rounded-lg border border-amber-200 bg-warning-soft p-3 ${shift.optimistic ? "opacity-75" : ""}`}>
            <div className="flex gap-4">
                <div className="grid shrink-0 place-items-center rounded-md bg-white px-3 py-2 text-center text-zinc-950 ring-1 ring-amber-200">
                    <div>
                        <p className="text-sm font-black uppercase text-amber-700">{weekday}</p>
                        <p className="text-base font-black uppercase">{month}</p>
                        <p className="text-4xl font-black leading-none">{day}</p>
                    </div>
                </div>

                <div className="mt-2 flex min-w-0 flex-1 justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                                {shift.role}
                            </span>
                        </div>
                        <p className="mt-2 truncate text-xl font-black leading-tight tracking-normal text-zinc-950">
                            {shift.community}
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

            <Button
                className="mt-2 w-full rounded-md border-amber-300 bg-white px-4 text-sm font-bold text-amber-900 normal-case tracking-normal hover:bg-amber-50"
                disabled={pending || shift.optimistic}
                onClick={() => setConfirmOpen(true)}
                type="button"
                variant="outline"
            >
                <Trash2 className="size-4" />
                {shift.optimistic ? "Posting..." : pending ? "Canceling..." : "Cancel offer"}
            </Button>

            {confirmOpen ? (
                <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/30 px-5 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-4 text-zinc-950 shadow-xl">
                        <h3 className="text-lg font-black tracking-normal">Cancel this offer?</h3>
                        <p className="mt-1 text-sm leading-5 text-zinc-600">
                            This removes the shift from the board so no one else can claim it.
                        </p>
                        <form
                            className="mt-4 grid grid-cols-2 gap-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const formData = new FormData(event.currentTarget);
                                onCancelStart?.();
                                startTransition(async () => {
                                    try {
                                        const result = await cancelShiftOfferResult(formData);
                                        if (result.ok) {
                                            toast.success(result.message);
                                            setConfirmOpen(false);
                                            onCancelSuccess?.();
                                        } else {
                                            toast.error(result.message);
                                            onCancelError?.();
                                        }
                                    } catch {
                                        toast.error("Could not cancel that offer. Try again.");
                                        onCancelError?.();
                                    }
                                });
                            }}
                        >
                            <input name="id" type="hidden" value={shift.id} />
                            <Button
                                className="rounded-md normal-case tracking-normal"
                                disabled={pending}
                                onClick={() => setConfirmOpen(false)}
                                type="button"
                                variant="outline"
                            >
                                Keep offer
                            </Button>
                            <Button
                                className="rounded-md bg-red-700 normal-case tracking-normal text-white hover:bg-red-800"
                                disabled={pending}
                                type="submit"
                            >
                                {pending ? "Canceling..." : "Cancel"}
                            </Button>
                        </form>
                    </div>
                </div>
            ) : null}
        </article>
    );
}
