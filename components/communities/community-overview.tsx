"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, KeyRound, MapPin } from "lucide-react";
import { CommunityInfoDrawer } from "@/components/communities/community-info-drawer";

type CommunityOverviewData = {
    id: string;
    name: string;
    companyName: string | null;
    address: string | null;
    inviteCode: string;
};

export function CommunityOverview({
    community,
}: {
    community: CommunityOverviewData;
}) {
    const router = useRouter();
    const [communityState, setCommunityState] = useState(community);

    useEffect(() => {
        router.prefetch("/communities");
    }, [router]);

    return (
        <>
            <header className="flex items-center justify-between">
                <Link
                    className="grid size-10 place-items-center rounded-md text-zinc-700 bg-zinc-200/50 hover:bg-zinc-200"
                    href="/communities"
                    onFocus={() => router.prefetch("/communities")}
                    onPointerEnter={() => router.prefetch("/communities")}
                    onTouchStart={() => router.prefetch("/communities")}
                    prefetch
                    title="Back">
                    <ArrowLeft className="size-5" />
                </Link>
                <CommunityInfoDrawer
                    community={communityState}
                    onSaveError={(previous) =>
                        setCommunityState((current) => ({
                            ...current,
                            ...previous,
                        }))
                    }
                    onSaveStart={(next) =>
                        setCommunityState((current) => ({
                            ...current,
                            ...next,
                        }))
                    }
                    onSaveSuccess={() => router.refresh()}
                />
            </header>

            <section className="grid gap-3">
                <h1 className="truncate text-3xl font-black tracking-normal">
                    {communityState.name}
                </h1>
                <div>
                    <p className="inline-flex gap-2 rounded-full bg-amber-100 px-3 py-2 text-sm font-black text-amber-800">
                        <KeyRound className="size-4" />
                        {communityState.inviteCode}
                    </p>
                </div>

                <div className="grid gap-2 text-sm text-zinc-700">
                    {communityState.companyName ? (
                        <p className="flex items-center gap-2">
                            <Building2 className="size-4 shrink-0 text-zinc-400" />
                            <span className="truncate font-semibold">
                                {communityState.companyName}
                            </span>
                        </p>
                    ) : null}
                    {communityState.address ? (
                        <p className="flex items-center gap-2">
                            <MapPin className="size-4 shrink-0 text-zinc-400" />
                            <span className="truncate font-semibold">
                                {communityState.address}
                            </span>
                        </p>
                    ) : null}
                </div>
            </section>
        </>
    );
}
