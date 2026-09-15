"use client";

import { RotateCcw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { requestShiftCancellationResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { Shift } from "@/components/shifts/types";
import { cn } from "@/lib/utils";

export function ShiftCancellationButton({
    shift,
    className,
}: {
    shift: Shift;
    className?: string;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const request = shift.cancellationRequest;

    if (request?.awaitingMe) {
        return (
            <Button
                className={cn(
                    "mt-3 w-full rounded-md px-4 text-sm font-bold normal-case tracking-normal",
                    className,
                )}
                disabled
                type="button"
                variant="outline">
                <XCircle className="size-4" />
                Review request above
            </Button>
        );
    }

    if (request?.requestedByMe) {
        return (
            <Button
                className={cn(
                    "mt-3 w-full rounded-md px-4 text-sm font-bold normal-case tracking-normal",
                    className,
                )}
                disabled
                type="button"
                variant="outline">
                <RotateCcw className="size-4" />
                Pending cancellation
            </Button>
        );
    }

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                startTransition(async () => {
                    try {
                        const result =
                            await requestShiftCancellationResult(formData);
                        if (result.ok) {
                            toast.success(result.message);
                            router.refresh();
                        } else {
                            toast.error(result.message);
                        }
                    } catch {
                        toast.error(
                            "Could not request cancellation. Try again.",
                        );
                    }
                });
            }}>
            <input name="id" type="hidden" value={shift.id} />
            <Button
                className={cn(
                    "mt-3 w-full rounded-md px-4 text-sm font-bold normal-case tracking-normal",
                    className,
                )}
                disabled={pending || shift.optimistic}
                type="submit"
                variant="outline">
                <XCircle className="size-4" />
                {pending ? "Requesting..." : "Request cancel"}
            </Button>
        </form>
    );
}
