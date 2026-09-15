"use client";

import { Check, RotateCcw, UsersRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
    respondToShiftCancellationResult,
    withdrawShiftCancellationResult,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { PersonBubble } from "@/components/shifts/person-bubble";
import type { Shift } from "@/components/shifts/types";
import {
    formatShiftTime,
    splitShiftDate,
} from "@/components/shifts/time-utils";

function RequestSentence({ shift }: { shift: Shift }) {
    const request = shift.cancellationRequest;

    if (!request) return null;

    if (request.requesterRole === "owner") {
        const covererName = shift.claimedBy ?? request.approverName;

        return (
            <span className="inline-flex flex-wrap items-center gap-1.5">
                {request.requestedByMe ? (
                    <>
                        <span>You asked</span>
                        <PersonBubble name={covererName} />
                        <span>to cancel this shift they have claimed.</span>
                    </>
                ) : (
                    <>
                        <PersonBubble name={request.requesterName} />
                        <span>
                            asked you to cancel this shift you have claimed.
                        </span>
                    </>
                )}
            </span>
        );
    }

    return (
        <span className="inline-flex flex-wrap items-center gap-1.5">
            {request.requestedByMe ? (
                <>
                    <span>You asked</span>
                    <PersonBubble name={shift.owner} />
                    <span>to cancel this shift you have claimed.</span>
                </>
            ) : (
                <>
                    <PersonBubble name={request.requesterName} />
                    <span>asked you to cancel this shift they are covering.</span>
                </>
            )}
        </span>
    );
}

export function CancellationRequestList({ shifts }: { shifts: Shift[] }) {
    if (!shifts.length) return null;

    return (
        <section className="text-sm text-zinc-500">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold uppercase tracking-wide">
                    Cancellation requests
                </h2>
                <p className="rounded-md normal-case tracking-normal">
                    {shifts.length}
                </p>
            </div>
            <div className="grid gap-2.5">
                {shifts.map((shift) => (
                    <CancellationRequestRow key={shift.id} shift={shift} />
                ))}
            </div>
        </section>
    );
}

function CancellationRequestRow({ shift }: { shift: Shift }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const request = shift.cancellationRequest;
    const [weekday, month, day] = splitShiftDate(shift.date);

    if (!request) return null;

    function submit(formData: FormData) {
        startTransition(async () => {
            try {
                const result = request?.requestedByMe
                    ? await withdrawShiftCancellationResult(formData)
                    : await respondToShiftCancellationResult(formData);
                if (result.ok) {
                    toast.success(result.message);
                    router.refresh();
                } else {
                    toast.error(result.message);
                }
            } catch {
                toast.error("Could not update that cancellation request.");
            }
        });
    }

    return (
        <article className="rounded-lg border border-red-200 bg-red-50 p-3 text-zinc-950">
            <div className="flex items-start gap-3">
                <div className="flex shrink-0 flex-col items-center justify-center self-stretch rounded-md bg-white px-3 py-2 text-center ring-1 ring-red-200">
                    <p className="text-sm font-black uppercase text-red-600">
                        {weekday}
                    </p>
                    <p className="text-base font-black uppercase">{month}</p>
                    <p className="text-4xl font-black leading-none">{day}</p>
                </div>
                
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2 text-sm font-bold">
                        <span className="inline-flex items-center rounded-full bg-red-200 px-2.5 py-1.5 leading-none text-red-800">
                            {shift.role}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-red-200 px-2.5 py-1.5 leading-none text-red-800">
                            {shift.length}
                        </span>
                    </div>
                    <div className="grid items-center pt-2">
                        <p className="text-xl font-black leading-tight">
                            {formatShiftTime(shift.timeRange)}
                        </p>
                        <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-zinc-600">
                            <UsersRound className="size-4 shrink-0 text-red-500/70" />
                            <span className="leading-tight">
                                {shift.community}
                            </span>
                        </p>
                        <div className="mt-1.5 text-sm font-semibold leading-7 text-zinc-600">
                            <RequestSentence shift={shift} />
                        </div>
                    </div>
                </div>
            </div>

            {request.requestedByMe ? (
                <form action={submit}>
                    <input name="id" type="hidden" value={shift.id} />
                    <Button
                        className="mt-3 w-full rounded-md border-red-200 bg-white px-4 text-sm font-bold text-red-800 normal-case tracking-normal hover:bg-red-50"
                        disabled={pending}
                        type="submit"
                        variant="outline">
                        <RotateCcw className="size-4" />
                        {pending ? "Withdrawing..." : "Withdraw request"}
                    </Button>
                </form>
            ) : (
                <form action={submit} className="mt-3 grid grid-cols-2 gap-2">
                    <input name="id" type="hidden" value={shift.id} />
                    <Button
                        className="w-full rounded-md px-4 text-sm font-bold normal-case tracking-normal border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                        disabled={pending}
                        name="response"
                        type="submit"
                        value="decline"
                        variant="outline">
                        <X className="size-4" />
                        Decline request
                    </Button>
                    <Button
                        className="w-full rounded-md px-4 text-sm font-bold normal-case tracking-normal bg-red-700 text-white hover:bg-red-800"
                        disabled={pending}
                        name="response"
                        type="submit"
                        value="approve"
                        variant="destructive"
                        >
                        <Check className="size-4" />
                        Agree to cancel
                    </Button>
                </form>
            )}
        </article>
    );
}
