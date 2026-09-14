"use client";

import { Bell } from "lucide-react";
import { AvailableShiftRow } from "@/components/shifts/available-shift-row";
import { OfferShiftRow } from "@/components/shifts/offer-shift-row";
import { UpcomingShiftRow } from "@/components/shifts/upcoming-shift-row";
import type { Shift } from "@/components/shifts/types";

export function ShiftList({
    title,
    shifts,
    empty,
    onCancelError,
    onCancelStart,
    onCancelSuccess,
    onClaimError,
    onClaimStart,
    onClaimSuccess,
    variant = "available",
}: {
    title: string;
    shifts: Shift[];
    empty: string;
    onCancelError?: (shift: Shift) => void;
    onCancelStart?: (shift: Shift) => void;
    onCancelSuccess?: (shift: Shift) => void;
    onClaimError?: (shift: Shift) => void;
    onClaimStart?: (shift: Shift) => void;
    onClaimSuccess?: (shift: Shift) => void;
    variant?: "upcoming" | "offer" | "available";
}) {
    if (!shifts.length && variant !== "available") return null;

    return (
        <section className="text-zinc-500 text-sm">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold uppercase tracking-wide">
                    {title}
                </h2>
                <p className="rounded-md normal-case tracking-normal">
                    {shifts.length}
                </p>
            </div>
            <div className="grid gap-2.5">
                {shifts.length ? (
                    shifts.map((shift) => {
                        if (variant === "upcoming")
                            return (
                                <UpcomingShiftRow
                                    key={shift.id}
                                    shift={shift}
                                />
                            );
                        if (variant === "offer") {
                            return (
                                <OfferShiftRow
                                    key={shift.id}
                                    onCancelError={() => onCancelError?.(shift)}
                                    onCancelStart={() => onCancelStart?.(shift)}
                                    onCancelSuccess={() =>
                                        onCancelSuccess?.(shift)
                                    }
                                    shift={shift}
                                />
                            );
                        }

                        return (
                            <AvailableShiftRow
                                key={shift.id}
                                onClaimError={() => onClaimError?.(shift)}
                                onClaimStart={() => onClaimStart?.(shift)}
                                onClaimSuccess={() => onClaimSuccess?.(shift)}
                                shift={shift}
                            />
                        );
                    })
                ) : (
                    <div className="rounded-lg border border-dashed border-zinc-300 bg-white/60 p-2.5 text-zinc-600">
                        <div className="flex gap-3 items-center">
                            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                                <Bell className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-md text-zinc-950">
                                    {empty}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
