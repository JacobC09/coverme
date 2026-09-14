"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateCommunityDrawer } from "@/components/communities/create-community-drawer";
import { CommunityList } from "@/components/communities/community-list";
import { JoinCommunityDrawer } from "@/components/communities/join-community-drawer";
import type { CommunitySummary } from "@/components/communities/types";

export function CommunitiesScreen({
    communities,
    error,
}: {
    communities: CommunitySummary[];
    error?: string;
}) {
    const router = useRouter();
    const [communityState, setCommunityState] = useState(communities);

    function sortCommunities(items: CommunitySummary[]) {
        return [...items].sort((first, second) => first.name.localeCompare(second.name));
    }

    function addCommunity(community: CommunitySummary) {
        setCommunityState((current) =>
            sortCommunities([community, ...current.filter((item) => item.id !== community.id)]),
        );
    }

    function removeCommunity(communityId: string) {
        setCommunityState((current) => current.filter((community) => community.id !== communityId));
    }

    function replaceCommunity(temporaryId: string, community?: CommunitySummary) {
        setCommunityState((current) => {
            if (!community) return current.filter((item) => item.id !== temporaryId);
            return sortCommunities(current.map((item) => (item.id === temporaryId ? community : item)));
        });
    }

    return (
        <main className="grid gap-7">
            <header className="flex items-center justify-end gap-3">
                <CreateCommunityDrawer
                    onCreateError={removeCommunity}
                    onCreateStart={addCommunity}
                    onCreateSuccess={(temporaryId, community) => {
                        replaceCommunity(temporaryId, community);
                        router.refresh();
                    }}
                />
                <JoinCommunityDrawer
                    error={error}
                    onJoinSuccess={(community) => {
                        addCommunity(community);
                        router.refresh();
                    }}
                />
            </header>

            <CommunityList
                communities={communityState}
                onLeaveError={addCommunity}
                onLeaveStart={(community) => {
                    removeCommunity(community.id);
                }}
            />
        </main>
    );
}
