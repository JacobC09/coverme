import { UsersRound } from "lucide-react";
import { PersonBubble, PersonBubbleList } from "@/components/shifts/person-bubble";
import type { Shift } from "@/components/shifts/types";
import { formatShiftTime, splitShiftDate } from "@/components/shifts/time-utils";

export function UpcomingShiftRow({ shift }: { shift: Shift }) {
    const [weekday, month, day] = splitShiftDate(shift.date);

    return (
        <article className={`grid grid-cols-[4.75rem_1fr] gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 ${shift.optimistic ? "opacity-75" : ""}`}>
            <div className="grid place-items-center rounded-md border border-zinc-200 bg-white px-2 py-2 text-center">
                <div>
                    <p className="text-sm font-black uppercase text-zinc-500">{weekday}</p>
                    <p className="text-base font-black uppercase text-primary">{month}</p>
                    <p className="text-4xl font-black leading-none text-zinc-950">{day}</p>
                </div>
            </div>

            <div className="min-w-0 py-0.5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                            {shift.role}
                        </span>
                        <p className="mt-2 truncate text-xl font-black leading-tight text-zinc-950">{shift.community}</p>
                        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sm font-semibold text-zinc-600">
                            <span className="shrink-0">Covering</span>
                            <PersonBubble name={shift.owner} />
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5 text-xs">
                        <span className="rounded-full bg-gold px-2.5 py-1.5 font-black leading-none text-zinc-950">
                            {shift.length}
                        </span>
                        <span className="rounded-full bg-primary px-2.5 py-1.5 font-bold leading-none text-white">
                            {formatShiftTime(shift.time)}
                        </span>
                    </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-zinc-500">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                        <UsersRound className="size-3.5 shrink-0 text-zinc-400" />
                        <span className="truncate">{shift.targetNames.length ? "Direct request" : "Community shift"}</span>
                    </span>
                    <PersonBubbleList names={shift.targetNames} />
                </div>
                {shift.description ? <p className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-600">{shift.description}</p> : null}
            </div>
        </article>
    );
}
