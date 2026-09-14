import { UsersRound } from "lucide-react";
import { PersonBubble } from "@/components/shifts/person-bubble";
import type { Shift } from "@/components/shifts/types";
import {
    formatShiftTime,
    splitShiftDate,
} from "@/components/shifts/time-utils";

export function UpcomingShiftRow({ shift }: { shift: Shift }) {
    const [weekday, month, day] = splitShiftDate(shift.date);

    return (
        <article
            className={`flex flex-col rounded-lg border border-zinc-200 bg-zinc-50 p-3 ${shift.optimistic ? "opacity-75" : ""}`}>
            <div className="flex items-start gap-3">
                <div className="flex h-full shrink-0 flex-col items-center justify-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-center">
                    <p className="text-sm font-black uppercase text-zinc-500">
                        {weekday}
                    </p>
                    <p className="text-base font-black uppercase text-primary">
                        {month}
                    </p>
                    <p className="text-4xl font-black leading-none text-zinc-950">
                        {day}
                    </p>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2 text-sm font-bold">
                        <div className="flex-1 flex-wrap flex gap-2">
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1.5 leading-none text-amber-800">
                                {shift.role}
                            </span>
                            {shift.targetNames.length ? (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1.5 leading-none text-blue-800">
                                    Requested
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
                            <p className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-600">
                                {shift.description}
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>
        </article>
    );
}
