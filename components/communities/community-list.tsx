"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { CommunityRow } from "@/components/communities/community-row";
import type { CommunitySummary } from "@/components/communities/types";
import { fuzzyScore } from "@/lib/utils";

export function CommunityList({
    communities,
    onLeaveError,
    onLeaveStart,
}: {
    communities: CommunitySummary[];
    onLeaveError: (community: CommunitySummary) => void;
    onLeaveStart: (community: CommunitySummary) => void;
}) {
    const [query, setQuery] = React.useState("");
    const clean = query.trim();
    const visible = clean
        ? communities
            .map((community) => ({
                community,
                score: Math.max(
                    fuzzyScore(community.name, clean),
                    fuzzyScore(community.companyName ?? "", clean),
                    fuzzyScore(community.address ?? "", clean),
                    fuzzyScore(community.inviteCode, clean),
                ),
            }))
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((item) => item.community)
        : communities;

    return (
        <section className="grid gap-3">
            <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Your communities</h2>
                <label className="flex h-10 w-full items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 sm:w-48">
                    <Search className="size-4 shrink-0 text-zinc-400" />
                    <input
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search"
                        value={query}
                    />
                </label>
            </div>
            {visible.length ? (
                <div className="grid border-y border-zinc-200">
                    {visible.map((community) => (
                        <CommunityRow
                            community={community}
                            key={community.id}
                            onLeaveError={() => onLeaveError(community)}
                            onLeaveStart={() => onLeaveStart(community)}
                        />
                    ))}
                </div>
            ) : (
                <div className="grid border-t border-zinc-200">
                    <p className="py-5 text-sm text-zinc-500">No communities found.</p>
                </div>
            )}
        </section>
    );
}
