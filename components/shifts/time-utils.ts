export function splitShiftDate(value: string) {
    const parts = value.replace(",", "").split(" ");
    return [parts[0] ?? "", parts[1] ?? "", parts[2] ?? value];
}

export function formatShiftTime(value: string) {
    return value.replace(/\s*a\.m\./i, " AM").replace(/\s*p\.m\./i, " PM");
}

export function parseTimeInput(value: string, fallbackPeriod: "AM" | "PM" = "AM") {
    const match = value.trim().match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/i);
    if (!match) return "";

    const suffix = match[3]?.toLowerCase();
    let hour = Number(match[1]);
    const minute = Number(match[2] ?? "0");

    if (minute < 0 || minute > 59) return "";
    if (suffix) {
        if (hour < 1 || hour > 12) return "";
        if (suffix === "pm" && hour !== 12) hour += 12;
        if (suffix === "am" && hour === 12) hour = 0;
    } else {
        if (hour < 1 || hour > 12) return "";
        if (fallbackPeriod === "PM" && hour !== 12) hour += 12;
        if (fallbackPeriod === "AM" && hour === 12) hour = 0;
    }

    return formatTime(hour, minute);
}

export function splitTime(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    return { hour, minute };
}

export function formatTime(hour: number, minute: number) {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatPeriod(hour: number) {
    return hour >= 12 ? "PM" : "AM";
}
