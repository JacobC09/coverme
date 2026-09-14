import { redirect } from "next/navigation";
import { App } from "@/components/app";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatShift(shift: {
    id: string;
    role: string;
    startsAt: Date;
    lengthHours: unknown;
    location: string;
    description: string;
    owner: { name: string };
    community: { name: string } | null;
    requestTargets: { user: { name: string } }[];
}) {
    const lengthHours = Number(shift.lengthHours);
    const endsAt = new Date(
        shift.startsAt.getTime() + lengthHours * 60 * 60 * 1000,
    );
    const startTime = shift.startsAt.toLocaleTimeString("en-CA", {
        hour: "numeric",
        minute: "2-digit",
    });
    const endTime = endsAt.toLocaleTimeString("en-CA", {
        hour: "numeric",
        minute: "2-digit",
    });

    return {
        id: shift.id,
        owner: shift.owner.name,
        role: shift.role,
        startsAt: shift.startsAt.toISOString(),
        date: shift.startsAt.toLocaleDateString("en-CA", {
            month: "short",
            day: "numeric",
            weekday: "short",
        }),
        time: startTime,
        timeRange: `${startTime} - ${endTime}`,
        length: `${lengthHours}h`,
        community: shift.community?.name ?? shift.location,
        description: shift.description,
        targetNames: shift.requestTargets.map((target) => target.user.name),
    };
}

export default async function Home() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth");

    const memberships = await prisma.communityMember.findMany({
        where: { userId: user.id },
        include: {
            community: {
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, name: true, email: true },
                            },
                        },
                        orderBy: { user: { name: "asc" } },
                    },
                    roles: {
                        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
                    },
                },
            },
        },
        orderBy: { community: { name: "asc" } },
    });
    const communityIds = memberships.map(
        (membership) => membership.communityId,
    );
    const memberRoles = await prisma.communityMemberRole.findMany({
        where: { userId: user.id, communityId: { in: communityIds } },
        select: { roleId: true },
    });
    const defaultRoleIds = memberships.flatMap((membership) =>
        membership.community.roles
            .filter((role) => role.isDefault)
            .map((role) => role.id),
    );
    const coverableRoleIds = [
        ...memberRoles.map((role) => role.roleId),
        ...defaultRoleIds,
    ];
    const shiftInclude = {
        owner: { select: { name: true } },
        community: { select: { name: true } },
        requestTargets: { include: { user: { select: { name: true } } } },
    };

    const [upcoming, offers, available] = await Promise.all([
        prisma.shift.findMany({
            where: { claimedById: user.id, startsAt: { gte: new Date() } },
            include: shiftInclude,
            orderBy: { startsAt: "asc" },
        }),
        prisma.shift.findMany({
            where: {
                ownerId: user.id,
                claimedById: null,
                startsAt: { gte: new Date() },
            },
            include: shiftInclude,
            orderBy: { startsAt: "asc" },
        }),
        prisma.shift.findMany({
            where: {
                claimedById: null,
                ownerId: { not: user.id },
                startsAt: { gte: new Date() },
                communityId: { in: communityIds },
                OR: [
                    { requestTargets: { none: {} } },
                    { requestTargets: { some: { userId: user.id } } },
                ],
                AND: [
                    {
                        OR: [
                            { roleId: null },
                            { roleId: { in: coverableRoleIds } },
                            { roleRef: { isDefault: true } },
                        ],
                    },
                ],
            },
            include: shiftInclude,
            orderBy: { startsAt: "asc" },
        }),
    ]);
    const communities = memberships.map((membership) => ({
        id: membership.community.id,
        name: membership.community.name,
        members: membership.community.members
            .filter((member) => member.userId !== user.id)
            .map((member) => member.user),
        roles: membership.community.roles,
    }));
    const upcomingShifts = upcoming.map(formatShift);
    const offerShifts = offers.map(formatShift);
    const availableShifts = available.map(formatShift);
    const boardKey = [...upcomingShifts, ...offerShifts, ...availableShifts]
        .map((shift) => `${shift.id}:${shift.startsAt}`)
        .join("|");

    return (
        <App
            key={boardKey}
            available={availableShifts}
            communities={communities}
            name={user.name}
            offers={offerShifts}
            pushPublicKey={process.env.VAPID_PUBLIC_KEY}
            upcoming={upcomingShifts}
        />
    );
}
