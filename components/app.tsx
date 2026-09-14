"use client";

import Link from "next/link";
import { LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { NotificationButton } from "@/components/notification-button";
import { SettingsButton } from "@/components/settings/settings-button";
import { OfferShiftDrawer } from "@/components/shifts/offer-shift-drawer";
import { ShiftList } from "@/components/shifts/shift-list";
import type { CommunityOption, Shift } from "@/components/shifts/types";

export function App({
    name,
    upcoming,
    offers,
    available,
    communities,
    pushPublicKey,
}: {
    name: string;
    upcoming: Shift[];
    offers: Shift[];
    available: Shift[];
    communities: CommunityOption[];
    pushPublicKey?: string;
}) {
    const router = useRouter();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [shiftState, setShiftState] = useState({
        upcoming,
        offers,
        available,
    });
    const hasCommunities = communities.length > 0;

    function sortShifts(shifts: Shift[]) {
        return [...shifts].sort((a, b) => {
            const first = a.startsAt ? Date.parse(a.startsAt) : 0;
            const second = b.startsAt ? Date.parse(b.startsAt) : 0;
            return first - second;
        });
    }

    function addShift(shifts: Shift[], shift: Shift) {
        return sortShifts([
            shift,
            ...shifts.filter((item) => item.id !== shift.id),
        ]);
    }

    function removeShift(shifts: Shift[], shift: Shift) {
        return shifts.filter((item) => item.id !== shift.id);
    }

    function refreshBoard() {
        router.refresh();
    }

    return (
        <main className="text-zinc-950 flex flex-col w-full gap-7">
            <header className="flex items-center justify-between">
                <div className="min-w-0">
                    <p className="truncate text-sm text-zinc-500">CoverMe</p>
                    <h1 className="text-2xl font-bold tracking-normal">
                        Hey,{" "}
                        <span className="text-emerald-700">
                            {name.split(" ")[0]}
                        </span>
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationButton
                        publicKey={pushPublicKey}
                        className="hidden xs:block"
                    />
                    <form action={signOut} className="hidden xs:block">
                        <Button
                            className="rounded-md"
                            size="icon"
                            title="Sign out"
                            type="submit"
                            variant="ghost">
                            <LogOut className="size-5" />
                        </Button>
                    </form>
                    <SettingsButton />
                    {hasCommunities ? (
                        <Drawer
                            onOpenChange={setDrawerOpen}
                            open={drawerOpen}
                            showSwipeHandle>
                            <DrawerTrigger
                                render={
                                    <Button className="rounded-md bg-primary text-white normal-case tracking-normal hover:bg-primary-hover">
                                        <Plus className="size-4" />
                                        Offer
                                    </Button>
                                }
                            />
                            <OfferShiftDrawer
                                communities={communities}
                                key={drawerOpen ? "offer-open" : "offer-closed"}
                                ownerName={name}
                                onDone={() => setDrawerOpen(false)}
                                onPostError={(temporaryId) => {
                                    setShiftState((current) => ({
                                        ...current,
                                        offers: current.offers.filter(
                                            (shift) => shift.id !== temporaryId,
                                        ),
                                    }));
                                }}
                                onPostStart={(shift) => {
                                    setShiftState((current) => ({
                                        ...current,
                                        offers: addShift(current.offers, shift),
                                    }));
                                }}
                                onPostSuccess={(temporaryId, shift) => {
                                    setShiftState((current) => ({
                                        ...current,
                                        offers: sortShifts(
                                            shift
                                                ? current.offers.map((item) =>
                                                      item.id === temporaryId
                                                          ? {
                                                                ...shift,
                                                                optimistic: false,
                                                            }
                                                          : item,
                                                  )
                                                : current.offers.filter(
                                                      (item) =>
                                                          item.id !==
                                                          temporaryId,
                                                  ),
                                        ),
                                    }));
                                    refreshBoard();
                                }}
                            />
                        </Drawer>
                    ) : (
                        <Button
                            aria-disabled="true"
                            className="cursor-not-allowed rounded-md bg-zinc-200 text-zinc-500 normal-case tracking-normal hover:bg-zinc-200 hover:text-zinc-500"
                            onClick={() => {
                                toast.info(
                                    "Join a community before offering shifts.",
                                    {
                                        action: {
                                            label: "Communities",
                                            onClick: () =>
                                                router.push("/communities"),
                                        },
                                    },
                                );
                            }}
                            type="button">
                            <Plus className="size-4" />
                            Offer
                        </Button>
                    )}
                </div>
            </header>

            {!hasCommunities ? (
                <p className="text-sm font-medium leading-5 text-zinc-600">
                    Join a{" "}
                    <Link
                        href="/communities"
                        className="text-blue-500 hover:underline">
                        community
                    </Link>{" "}
                    before offering shifts.
                </p>
            ) : null}

            <ShiftList
                empty="Claim a shift and it will show up here."
                shifts={shiftState.upcoming}
                title="Upcoming shifts"
                variant="upcoming"
            />
            <ShiftList
                empty="Open shifts you posted will show up here."
                onCancelError={(shift) => {
                    setShiftState((current) => ({
                        ...current,
                        offers: addShift(current.offers, {
                            ...shift,
                            optimistic: false,
                        }),
                    }));
                }}
                onCancelStart={(shift) => {
                    setShiftState((current) => ({
                        ...current,
                        offers: removeShift(current.offers, shift),
                    }));
                }}
                onCancelSuccess={refreshBoard}
                shifts={shiftState.offers}
                title="Your offers"
                variant="offer"
            />
            <ShiftList
                empty="No open shifts right now"
                onClaimError={(shift) => {
                    setShiftState((current) => ({
                        upcoming: removeShift(current.upcoming, shift),
                        offers: current.offers,
                        available: addShift(current.available, {
                            ...shift,
                            optimistic: false,
                        }),
                    }));
                }}
                onClaimStart={(shift) => {
                    const optimisticShift = { ...shift, optimistic: true };
                    setShiftState((current) => ({
                        upcoming: addShift(current.upcoming, optimisticShift),
                        offers: current.offers,
                        available: removeShift(current.available, shift),
                    }));
                }}
                onClaimSuccess={refreshBoard}
                shifts={shiftState.available}
                title="Available to claim"
                variant="available"
            />
        </main>
    );
}
