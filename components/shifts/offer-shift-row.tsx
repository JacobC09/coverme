"use client";

import { Trash2, UsersRound } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelShiftOfferResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { PersonBubbleList } from "@/components/shifts/person-bubble";
import type { Shift } from "@/components/shifts/types";
import {
    formatShiftTime,
    splitShiftDate,
} from "@/components/shifts/time-utils";
import { cn } from "@/lib/utils";

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
        <article
            className={cn(
                "flex flex-col rounded-lg border border-amber-200 bg-warning-soft p-3",
                shift.optimistic && "opacity-75",
            )}>
            <div className="flex items-start gap-3">
                <div className="flex shrink-0 h-full flex-col items-center justify-center rounded-md bg-white px-3 py-2 text-center text-zinc-950 ring-1 ring-amber-200">
                    <p className="text-sm font-black uppercase text-amber-700">
                        {weekday}
                    </p>
                    <p className="text-base font-black uppercase">{month}</p>
                    <p className="text-4xl font-black leading-none">{day}</p>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex gap-2 justify-between flex-wrap text-sm font-bold">
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1.5 leading-none text-amber-800">
                            {shift.role}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-gold px-2.5 py-1.5 leading-none text-zinc-950">
                            {shift.length}
                        </span>
                    </div>

                    <div className="min-w-0 grid py-2 items-center">
                        <p className="text-xl font-black leading-tight text-zinc-950">
                            {formatShiftTime(shift.timeRange)}
                        </p>
                        <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-zinc-600">
                            <UsersRound className="size-4 shrink-0 text-amber-700/70" />
                            <span className="leading-tight">
                                {shift.community}
                            </span>
                        </p>
                        {shift.targetNames.length ? (
                            <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gold-foreground">
                                    Requesting
                                </span>
                                <PersonBubbleList names={shift.targetNames} />
                            </div>
                        ) : (
                            <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                For anyone
                            </p>
                        )}
                        {shift.description ? (
                            <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-zinc-600">
                                {shift.description}
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>

            <Button
                className="mt-3 w-full rounded-md border-amber-300 bg-white px-4 text-sm font-bold text-amber-900 normal-case hover:bg-amber-50"
                disabled={pending || shift.optimistic}
                onClick={() => setConfirmOpen(true)}
                type="button"
                variant="outline">
                <Trash2 className="size-4" />
                {shift.optimistic
                    ? "Posting..."
                    : pending
                      ? "Canceling..."
                      : "Cancel offer"}
            </Button>

            {confirmOpen ? (
                <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/30 px-5 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-4 text-zinc-950 shadow-xl">
                        <h3 className="text-lg font-black">
                            Cancel this offer?
                        </h3>
                        <p className="mt-1 text-sm leading-5 text-zinc-600">
                            This removes the shift from the board so no one else
                            can claim it.
                        </p>
                        <form
                            className="mt-4 grid grid-cols-2 gap-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const formData = new FormData(
                                    event.currentTarget,
                                );
                                onCancelStart?.();
                                startTransition(async () => {
                                    try {
                                        const result =
                                            await cancelShiftOfferResult(
                                                formData,
                                            );
                                        if (result.ok) {
                                            toast.success(result.message);
                                            setConfirmOpen(false);
                                            onCancelSuccess?.();
                                        } else {
                                            toast.error(result.message);
                                            onCancelError?.();
                                        }
                                    } catch {
                                        toast.error(
                                            "Could not cancel that offer. Try again.",
                                        );
                                        onCancelError?.();
                                    }
                                });
                            }}>
                            <input name="id" type="hidden" value={shift.id} />
                            <Button
                                className="rounded-md normal-case"
                                disabled={pending}
                                onClick={() => setConfirmOpen(false)}
                                type="button"
                                variant="outline">
                                Keep offer
                            </Button>
                            <Button
                                className="rounded-md bg-red-700 normal-case text-white hover:bg-red-800"
                                disabled={pending}
                                type="submit">
                                {pending ? "Canceling..." : "Cancel"}
                            </Button>
                        </form>
                    </div>
                </div>
            ) : null}
        </article>
    );
}
