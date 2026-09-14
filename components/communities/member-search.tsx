"use client";

import { fuzzyScore } from "@/lib/utils";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export function MemberSearch({
    members,
}: {
    members: { id: string; name: string; email: string }[];
}) {
    const [query, setQuery] = useState("");

    const visible = useMemo(() => {
        const value = query.trim().toLowerCase();
        if (!value) return members;
        return members
            .map((member) => ({
                member,
                score: Math.max(
                    fuzzyScore(member.name, value),
                    fuzzyScore(member.email, value),
                ),
            }))
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((item) => item.member);
    }, [members, query]);

    return (
        <div className="grid gap-3">
            <label className="flex h-11 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3">
                <Search className="size-4 text-zinc-400" />
                <input
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search members"
                    value={query}
                />
            </label>
            <div className="grid divide-y divide-zinc-200 border-y border-zinc-200">
                {visible.map((member) => (
                    <div className="py-3" key={member.id}>
                        <p className="font-bold">{member.name}</p>
                        <p className="truncate text-sm text-zinc-500">
                            {member.email}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
