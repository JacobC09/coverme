"use client";

import { Clock } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    formatTime,
    parseTimeInput,
    splitTime,
} from "@/components/shifts/time-utils";

export function TimePickerField({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"hour" | "minute">("hour");
    const [period, setPeriodState] = useState<"AM" | "PM">("AM");
    const [displayValue, setDisplayValue] = useState(
        value ? formatDisplayValue(value) : "",
    );
    const [animateHand, setAnimateHand] = useState(true);
    const modeSwitchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const normalized = parseTimeInput(displayValue, period);
    const parsed = normalized
        ? splitTime(normalized)
        : { hour: period === "PM" ? 13 : 9, minute: 0 };
    const displayHour = parsed.hour % 12 || 12;
    const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const hourOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const dialOptions = mode === "hour" ? hourOptions : minuteOptions;
    const handAngle =
        mode === "hour" ? displayHour * (360 / 12) : parsed.minute * (360 / 60);

    function pickHour(hour12: number) {
        const hour = to24Hour(hour12, period);
        if (modeSwitchTimer.current) clearTimeout(modeSwitchTimer.current);

        setAnimateHand(false);
        setMode("hour");
        setDisplayValue(`${hour12}:00`);
        onChange(formatTime(hour, 0));

        modeSwitchTimer.current = setTimeout(() => {
            setAnimateHand(true);
            setMode("minute");
        }, 80);
    }

    function pickMinute(minute: number) {
        setDisplayValue(`${displayHour}:${String(minute).padStart(2, "0")}`);
        onChange(formatTime(parsed.hour, minute));
        setOpen(false);
    }

    function setPeriod(nextPeriod: "AM" | "PM") {
        setPeriodState(nextPeriod);
        const hour12 = parsed.hour % 12 || 12;
        onChange(formatTime(to24Hour(hour12, nextPeriod), parsed.minute));
    }

    function pickDialValue(value: number) {
        if (mode === "hour") {
            pickHour(value);
        } else {
            pickMinute(value);
        }
    }

    return (
        <div className="flex gap-2">
            <Input
                className="min-w-0"
                id="time"
                inputMode="text"
                onChange={(event) => {
                    const nextValue = event.target.value;
                    const suffix = nextValue
                        .trim()
                        .match(/\s*(am|pm)$/i)?.[1]
                        ?.toUpperCase() as "AM" | "PM" | undefined;
                    if (suffix) setPeriodState(suffix);
                    setDisplayValue(nextValue);
                    onChange(parseTimeInput(nextValue, suffix ?? period));
                }}
                placeholder="9:00 PM"
                required
                value={displayValue}
            />
            <span className="text-sm my-auto mt-auto mr-1 font-semibold uppercase tracking-wide text-muted-foreground">
                {period}
            </span>
            <Popover
                onOpenChange={(value) => {
                    if (value) setMode("hour");
                    setOpen(value);
                }}
                open={open}>
                <PopoverTrigger
                    render={
                        <Button
                            className="h-10 rounded-md px-3 normal-case tracking-normal"
                            type="button"
                            variant="outline">
                            <Clock className="size-4" />
                            Pick
                        </Button>
                    }
                />
                <PopoverContent
                    align="end"
                    className="w-[20rem] max-w-[calc(100vw-2rem)] gap-0 bg-white p-4 rounded-sm">
                    <div className="mb-3 flex justify-center">
                        <div className="flex items-end gap-2">
                            <div className="flex items-center gap-1.5 text-4xl font-bold leading-none">
                                <button
                                    className={`rounded-md px-1.5 py-1 transition ${mode === "hour" ? "bg-zinc-800 text-white" : "text-muted-foreground hover:bg-muted"}`}
                                    onClick={() => setMode("hour")}
                                    type="button">
                                    {displayHour}
                                </button>
                                <span className="text-zinc-400">:</span>
                                <button
                                    className={`rounded-md px-1.5 py-1 transition ${mode === "minute" ? "bg-zinc-800 text-white" : "text-muted-foreground hover:bg-muted"}`}
                                    onClick={() => setMode("minute")}
                                    type="button">
                                    {String(parsed.minute).padStart(2, "0")}
                                </button>
                            </div>
                            <span className="pb-1 text-sm font-bold text-muted-foreground">
                                {period}
                            </span>
                        </div>
                    </div>

                    <div className="relative mx-auto size-64 rounded-full bg-muted">
                        <div
                            className={`absolute inset-0 ease-out ${animateHand ? "transition-transform duration-300" : ""}`}
                            style={{ transform: `rotate(${handAngle}deg)` }}>
                            <div className="absolute left-1/2 top-1/2 h-[5.85rem] w-1 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-primary" />
                            <div className="absolute left-1/2 top-[calc(50%-5.85rem)] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background" />

                        </div>
                        <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />

                        {dialOptions.map((option) => {
                            const angle =
                                mode === "hour"
                                    ? option * (360 / 12)
                                    : option * (360 / 60);
                            const radians = (angle - 90) * (Math.PI / 180);
                            const radius = 96;
                            const x = Math.cos(radians) * radius;
                            const y = Math.sin(radians) * radius;
                            const active =
                                mode === "hour"
                                    ? displayHour === option
                                    : parsed.minute === option;
                            const label =
                                mode === "hour"
                                    ? option
                                    : String(option).padStart(2, "0");

                            return (
                                <button
                                    className={`absolute grid size-11 place-items-center rounded-full text-sm font-semibold transition ${active ? "bg-primary text-white shadow-sm" : "text-foreground hover:bg-background"}`}
                                    key={option}
                                    onClick={() => pickDialValue(option)}
                                    style={{
                                        left: `calc(50% + ${x}px - 22px)`,
                                        top: `calc(50% + ${y}px - 22px)`,
                                    }}
                                    type="button">
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-md border border-border">
                        {(["AM", "PM"] as const).map((item) => (
                            <button
                                className={`h-10 text-xs font-semibold transition ${period === item ? "bg-primary text-white" : "bg-gray-50 text-muted-foreground hover:bg-muted"}`}
                                key={item}
                                onClick={() => setPeriod(item)}
                                type="button">
                                {item}
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

function formatDisplayValue(value: string) {
    const parsed = splitTime(value);
    if (Number.isNaN(parsed.hour) || Number.isNaN(parsed.minute)) return value;
    return `${parsed.hour % 12 || 12}:${String(parsed.minute).padStart(2, "0")}`;
}

function to24Hour(hour12: number, period: "AM" | "PM") {
    if (period === "AM") return hour12 === 12 ? 0 : hour12;
    return hour12 === 12 ? 12 : hour12 + 12;
}
