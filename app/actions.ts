"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
    clearSession,
    getCurrentUser,
    hashPassword,
    setSession,
    verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";

type ActionResult<T = void> =
    { ok: true; message: string; data?: T } | { ok: false; message: string };
type PushSubscriptionInput = {
    endpoint?: string;
    expirationTime?: number | null;
    keys?: {
        p256dh?: string;
        auth?: string;
    };
};
type ShiftActionData = {
    id: string;
    owner: string;
    role: string;
    startsAt: string;
    date: string;
    time: string;
    timeRange: string;
    length: string;
    community: string;
    description: string;
    targetNames: string[];
};
type RoleActionData = { id: string; name: string; isDefault: boolean };
type CommunityActionData = {
    id: string;
    name: string;
    companyName: string | null;
    address: string | null;
    inviteCode: string;
    members: { userId: string }[];
};

function text(formData: FormData, key: string) {
    return String(formData.get(key) ?? "").trim();
}

function inviteCode() {
    return randomBytes(5).toString("base64url").slice(0, 7).toUpperCase();
}

function formatShiftForClient(shift: {
    id: string;
    role: string;
    startsAt: Date;
    lengthHours: unknown;
    location: string;
    description: string;
    owner: { name: string };
    community: { name: string } | null;
    requestTargets: { user: { name: string } }[];
}): ShiftActionData {
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

async function uniqueInviteCode() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const code = inviteCode();
        const existing = await prisma.community.findUnique({
            where: { inviteCode: code },
            select: { id: true },
        });
        if (!existing) return code;
    }
    throw new Error("Could not create a unique invite code.");
}

async function findShiftNotificationRecipientIds({
    communityId,
    ownerId,
    roleId,
    isDefaultRole,
    targetUserIds,
}: {
    communityId: string;
    ownerId: string;
    roleId: string;
    isDefaultRole: boolean;
    targetUserIds: string[];
}) {
    const targetFilter = targetUserIds.length
        ? { userId: { in: targetUserIds } }
        : {};
    const roleFilter = isDefaultRole
        ? {}
        : { user: { memberRoles: { some: { communityId, roleId } } } };

    const recipients = await prisma.communityMember.findMany({
        where: {
            communityId,
            userId: { not: ownerId },
            ...targetFilter,
            ...roleFilter,
        },
        select: { userId: true },
    });

    return recipients.map((recipient) => recipient.userId);
}

function shiftNotificationTime(startsAt: Date) {
    return `${startsAt.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
    })} at ${startsAt.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}`;
}

export async function signUp(formData: FormData) {
    const name = text(formData, "name");
    const email = text(formData, "email").toLowerCase();
    const password = text(formData, "password");

    if (!name || !email || password.length < 8) redirect("/auth?error=signup");

    try {
        const user = await prisma.user.create({
            data: { name, email, passwordHash: await hashPassword(password) },
            select: { id: true, name: true, email: true },
        });
        await setSession(user);
    } catch {
        redirect("/auth?error=exists");
    }

    redirect("/");
}

export async function signIn(formData: FormData) {
    const email = text(formData, "email").toLowerCase();
    const password = text(formData, "password");
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(password, user.passwordHash)))
        redirect("/auth?error=login");

    await setSession(user);
    redirect("/");
}

export async function signOut() {
    await clearSession();
    redirect("/auth");
}

export async function updateSettingsResult(
    formData: FormData,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user)
        return {
            ok: false,
            message: "Sign in again before updating settings.",
        };

    const name = text(formData, "name");
    const password = text(formData, "password");
    const confirmPassword = text(formData, "confirmPassword");

    if (!name) return { ok: false, message: "Name is required." };
    if (password && password.length < 8)
        return {
            ok: false,
            message: "New password must be at least 8 characters.",
        };
    if (password && password !== confirmPassword)
        return { ok: false, message: "Passwords do not match." };

    try {
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name,
                ...(password
                    ? { passwordHash: await hashPassword(password) }
                    : {}),
            },
            select: { id: true, name: true, email: true },
        });

        await setSession(updatedUser);
    } catch (error) {
        console.error(error);
        return { ok: false, message: "Could not update settings. Try again." };
    }

    revalidatePath("/");
    revalidatePath("/settings");
    return { ok: true, message: "Settings saved." };
}

export async function postShift(formData: FormData) {
    const result = await postShiftResult(formData);
    if (!result.ok) return;
    redirect("/");
}

export async function postShiftResult(
    formData: FormData,
): Promise<ActionResult<ShiftActionData>> {
    const user = await getCurrentUser();
    if (!user)
        return { ok: false, message: "Sign in again before posting a shift." };

    const startsAt = new Date(text(formData, "startsAt"));
    const lengthHours = text(formData, "lengthHours");
    const location = text(formData, "location");
    const role = text(formData, "role");
    const description = text(formData, "description");
    const communityId = text(formData, "communityId");
    const roleId = text(formData, "roleId");
    const targetUserIds = Array.from(
        new Set(
            formData
                .getAll("targetUserIds")
                .map((value) => String(value).trim())
                .filter(Boolean),
        ),
    );

    if (!startsAt.getTime())
        return { ok: false, message: "Pick a valid date and start time." };
    if (!lengthHours || Number(lengthHours) <= 0)
        return { ok: false, message: "Add a valid shift length." };
    if (!communityId || !roleId)
        return { ok: false, message: "Choose a community and role." };

    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId: user.id } },
        include: { community: { select: { name: true } } },
    });
    if (!membership)
        return { ok: false, message: "You are not in that community." };
    const shiftRole = await prisma.communityRole.findUnique({
        where: { id: roleId },
    });
    if (!shiftRole || shiftRole.communityId !== communityId)
        return { ok: false, message: "Choose a valid community role." };

    if (targetUserIds.includes(user.id))
        return {
            ok: false,
            message: "You cannot request yourself for your own shift.",
        };

    const validTargets = targetUserIds.length
        ? await prisma.communityMember.findMany({
              where: { communityId, userId: { in: targetUserIds } },
              select: { userId: true },
          })
        : [];
    if (validTargets.length !== targetUserIds.length) {
        return {
            ok: false,
            message: "Choose requested people from this community.",
        };
    }

    try {
        const shift = await prisma.shift.create({
            data: {
                startsAt,
                lengthHours,
                location: location || membership.community.name,
                role: role || shiftRole.name,
                roleId,
                description,
                ownerId: user.id,
                communityId,
                requestTargets: {
                    create: validTargets.map((target) => ({
                        userId: target.userId,
                    })),
                },
            },
            include: {
                owner: { select: { name: true } },
                community: { select: { name: true } },
                requestTargets: {
                    include: { user: { select: { name: true } } },
                },
            },
        });

        try {
            const targetIds = validTargets.map((target) => target.userId);
            const recipientIds = await findShiftNotificationRecipientIds({
                communityId,
                ownerId: user.id,
                roleId,
                isDefaultRole: shiftRole.isDefault,
                targetUserIds: targetIds,
            });
            const requestedRecipientIds = recipientIds.filter((id) =>
                targetIds.includes(id),
            );
            const generalRecipientIds = recipientIds.filter(
                (id) => !targetIds.includes(id),
            );

            await Promise.all([
                sendPushToUsers(requestedRecipientIds, {
                    title: "You were requested for a shift",
                    body: `${user.name} requested you for a ${shift.role} shift on ${shiftNotificationTime(startsAt)}.`,
                    url: "/",
                    tag: `shift-request-${shift.id}`,
                    requireInteraction: true,
                }),
                sendPushToUsers(generalRecipientIds, {
                    title: "New shift open",
                    body: `${user.name} opened a ${shift.role} shift on ${shiftNotificationTime(startsAt)}.`,
                    url: "/",
                    tag: `shift-${shift.id}`,
                }),
            ]);
        } catch (error) {
            console.error("Could not notify users about the new shift", error);
        }

        revalidatePath("/");
        return {
            ok: true,
            message: "Shift posted.",
            data: formatShiftForClient(shift),
        };
    } catch (error) {
        console.error(error);
        return { ok: false, message: "Could not post that shift. Try again." };
    }
}

export async function savePushSubscription(
    subscription: PushSubscriptionInput,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user)
        return {
            ok: false,
            message: "Sign in again before enabling notifications.",
        };

    const endpoint = subscription.endpoint?.trim();
    const p256dh = subscription.keys?.p256dh?.trim();
    const auth = subscription.keys?.auth?.trim();
    if (!endpoint || !p256dh || !auth)
        return {
            ok: false,
            message: "Browser notification setup was incomplete.",
        };

    await prisma.pushSubscription.upsert({
        where: { endpoint },
        create: {
            endpoint,
            p256dh,
            auth,
            expirationTime: subscription.expirationTime
                ? BigInt(subscription.expirationTime)
                : null,
            userId: user.id,
        },
        update: {
            p256dh,
            auth,
            expirationTime: subscription.expirationTime
                ? BigInt(subscription.expirationTime)
                : null,
            userId: user.id,
        },
    });

    return { ok: true, message: "Notifications enabled." };
}

export async function deletePushSubscription(
    endpoint: string,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user)
        return {
            ok: false,
            message: "Sign in again before changing notifications.",
        };

    await prisma.pushSubscription.deleteMany({
        where: { endpoint, userId: user.id },
    });

    return { ok: true, message: "Notifications disabled." };
}

export async function claimShift(formData: FormData) {
    await claimShiftResult(formData);
}

export async function claimShiftResult(
    formData: FormData,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user)
        return { ok: false, message: "Sign in again before claiming a shift." };

    const id = text(formData, "id");
    if (!id) return { ok: false, message: "Missing shift id." };

    try {
        const result = await prisma.shift.updateMany({
            where: {
                id,
                claimedById: null,
                ownerId: { not: user.id },
                community: { members: { some: { userId: user.id } } },
                OR: [
                    { requestTargets: { none: {} } },
                    { requestTargets: { some: { userId: user.id } } },
                ],
                AND: [
                    {
                        OR: [
                            { roleId: null },
                            { roleRef: { isDefault: true } },
                            {
                                roleRef: {
                                    memberRoles: { some: { userId: user.id } },
                                },
                            },
                        ],
                    },
                ],
            },
            data: { claimedById: user.id },
        });

        if (result.count === 0)
            return { ok: false, message: "That shift is no longer available." };

        const shift = await prisma.shift.findUnique({
            where: { id },
            select: {
                id: true,
                role: true,
                startsAt: true,
                ownerId: true,
            },
        });

        if (shift) {
            try {
                await sendPushToUsers([shift.ownerId], {
                    title: "Your shift was claimed",
                    body: `${user.name} claimed your ${shift.role} shift on ${shiftNotificationTime(shift.startsAt)}.`,
                    url: "/",
                    tag: `shift-claimed-${shift.id}`,
                    requireInteraction: true,
                });
            } catch (error) {
                console.error(
                    "Could not notify the shift owner about the claim",
                    error,
                );
            }
        }
    } catch (error) {
        console.error(error);
        return { ok: false, message: "Could not claim that shift. Try again." };
    }

    revalidatePath("/");
    return { ok: true, message: "Shift claimed." };
}

export async function cancelShiftOfferResult(
    formData: FormData,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user)
        return {
            ok: false,
            message: "Sign in again before canceling an offer.",
        };

    const id = text(formData, "id");
    if (!id) return { ok: false, message: "Missing shift id." };

    try {
        const result = await prisma.shift.deleteMany({
            where: {
                id,
                ownerId: user.id,
                claimedById: null,
                startsAt: { gte: new Date() },
            },
        });

        if (result.count === 0)
            return {
                ok: false,
                message: "That offer can no longer be canceled.",
            };
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            message: "Could not cancel that offer. Try again.",
        };
    }

    revalidatePath("/");
    return { ok: true, message: "Offer canceled." };
}

export async function createCommunity(formData: FormData) {
    const result = await createCommunityResult(formData);
    if (!result.ok) return;
    redirect("/communities");
}

export async function createCommunityResult(
    formData: FormData,
): Promise<ActionResult<CommunityActionData>> {
    const user = await getCurrentUser();
    if (!user)
        return {
            ok: false,
            message: "Sign in again before creating a community.",
        };

    const name = text(formData, "name");
    const companyName = text(formData, "companyName") || null;
    const address = text(formData, "address") || null;
    if (!name) return { ok: false, message: "Community name is required." };

    try {
        let createdCommunity: CommunityActionData | null = null;
        await prisma.$transaction(async (tx) => {
            const community = await tx.community.create({
                data: {
                    name,
                    companyName,
                    address,
                    inviteCode: await uniqueInviteCode(),
                },
            });
            const role = await tx.communityRole.create({
                data: {
                    communityId: community.id,
                    name: "General",
                    isDefault: true,
                },
            });
            await tx.communityMember.create({
                data: { communityId: community.id, userId: user.id },
            });
            await tx.communityMemberRole.create({
                data: {
                    communityId: community.id,
                    userId: user.id,
                    roleId: role.id,
                },
            });
            createdCommunity = {
                id: community.id,
                name: community.name,
                companyName: community.companyName,
                address: community.address,
                inviteCode: community.inviteCode,
                members: [{ userId: user.id }],
            };
        });

        revalidatePath("/");
        revalidatePath("/communities");
        return {
            ok: true,
            message: "Community created.",
            data: createdCommunity ?? undefined,
        };
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            message: "Could not create that community. Try again.",
        };
    }
}

export async function updateCommunity(formData: FormData) {
    const result = await updateCommunityResult(formData);
    if (!result.ok) return;
    redirect(`/communities/${text(formData, "communityId")}`);
}

export async function updateCommunityResult(
    formData: FormData,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user)
        return {
            ok: false,
            message: "Sign in again before editing this community.",
        };

    const communityId = text(formData, "communityId");
    const name = text(formData, "name");
    const companyName = text(formData, "companyName") || null;
    const address = text(formData, "address") || null;
    if (!communityId || !name)
        return { ok: false, message: "Community name is required." };

    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId: user.id } },
        select: { communityId: true },
    });
    if (!membership)
        return { ok: false, message: "You are not in that community." };

    try {
        await prisma.community.update({
            where: { id: communityId },
            data: { name, companyName, address },
        });
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            message: "Could not update that community. Try again.",
        };
    }

    revalidatePath("/");
    revalidatePath("/communities");
    revalidatePath(`/communities/${communityId}`);
    return { ok: true, message: "Community updated." };
}

export async function joinCommunity(formData: FormData) {
    const result = await joinCommunityResult(formData);
    if (!result.ok) redirect("/communities?error=code");
    redirect("/communities");
}

export async function joinCommunityResult(
    formData: FormData,
): Promise<ActionResult<CommunityActionData>> {
    const user = await getCurrentUser();
    if (!user)
        return {
            ok: false,
            message: "Sign in again before joining a community.",
        };

    const code = text(formData, "inviteCode").toUpperCase();
    if (!code) return { ok: false, message: "Enter an invite code." };

    const community = await prisma.community.findUnique({
        where: { inviteCode: code },
    });
    if (!community)
        return {
            ok: false,
            message: "That invite code did not match a community.",
        };

    try {
        await prisma.communityMember.upsert({
            where: {
                communityId_userId: {
                    communityId: community.id,
                    userId: user.id,
                },
            },
            create: { communityId: community.id, userId: user.id },
            update: {},
        });
        const defaultRole = await prisma.communityRole.findFirst({
            where: { communityId: community.id, isDefault: true },
            select: { id: true },
        });
        if (defaultRole) {
            await prisma.communityMemberRole.upsert({
                where: {
                    userId_roleId: { userId: user.id, roleId: defaultRole.id },
                },
                create: {
                    communityId: community.id,
                    userId: user.id,
                    roleId: defaultRole.id,
                },
                update: {},
            });
        }
        const joinedCommunity = await prisma.community.findUnique({
            where: { id: community.id },
            include: { members: { select: { userId: true } } },
        });
        if (!joinedCommunity)
            return {
                ok: false,
                message: "That invite code did not match a community.",
            };

        revalidatePath("/");
        revalidatePath("/communities");
        return {
            ok: true,
            message: "Community joined.",
            data: joinedCommunity,
        };
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            message: "Could not join that community. Try again.",
        };
    }
}

export async function leaveCommunity(formData: FormData) {
    await leaveCommunityResult(formData);
}

export async function leaveCommunityResult(
    formData: FormData,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user)
        return {
            ok: false,
            message: "Sign in again before leaving a community.",
        };

    const communityId = text(formData, "communityId");
    if (!communityId) return { ok: false, message: "Missing community id." };

    try {
        await prisma.$transaction(async (tx) => {
            await tx.communityMemberRole.deleteMany({
                where: { communityId, userId: user.id },
            });
            await tx.communityMember.deleteMany({
                where: { communityId, userId: user.id },
            });
            const members = await tx.communityMember.count({
                where: { communityId },
            });
            if (members === 0)
                await tx.community.delete({ where: { id: communityId } });
        });
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            message: "Could not leave that community. Try again.",
        };
    }

    revalidatePath("/");
    revalidatePath("/communities");
    return { ok: true, message: "Left community." };
}

export async function addCommunityRoleResult(
    formData: FormData,
): Promise<ActionResult<RoleActionData>> {
    const user = await getCurrentUser();
    if (!user)
        return { ok: false, message: "Sign in again before adding a role." };

    const communityId = text(formData, "communityId");
    const name = text(formData, "name");
    if (!communityId || !name)
        return { ok: false, message: "Role name is required." };

    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId: user.id } },
        select: { communityId: true },
    });
    if (!membership)
        return { ok: false, message: "You are not in that community." };

    try {
        let createdRole: RoleActionData | null = null;
        await prisma.$transaction(async (tx) => {
            const role = await tx.communityRole.create({
                data: { communityId, name },
            });
            createdRole = {
                id: role.id,
                name: role.name,
                isDefault: role.isDefault,
            };
            await tx.communityMemberRole.create({
                data: { communityId, userId: user.id, roleId: role.id },
            });
        });

        revalidatePath("/");
        revalidatePath(`/communities/${communityId}`);
        return {
            ok: true,
            message: "Role added.",
            data: createdRole ?? undefined,
        };
    } catch {
        return { ok: false, message: "That role already exists." };
    }
}

export async function deleteCommunityRoleResult(
    formData: FormData,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user)
        return { ok: false, message: "Sign in again before deleting a role." };

    const communityId = text(formData, "communityId");
    const roleId = text(formData, "roleId");
    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId: user.id } },
        select: { communityId: true },
    });
    if (!membership)
        return { ok: false, message: "You are not in that community." };

    const role = await prisma.communityRole.findUnique({
        where: { id: roleId },
        select: { communityId: true, isDefault: true },
    });
    if (!role || role.communityId !== communityId)
        return { ok: false, message: "Role not found." };
    if (role.isDefault)
        return { ok: false, message: "General cannot be removed." };

    await prisma.communityRole.delete({ where: { id: roleId } });
    revalidatePath("/");
    revalidatePath(`/communities/${communityId}`);
    return { ok: true, message: "Role removed." };
}

export async function setCommunityRoleCoverageResult(
    formData: FormData,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user)
        return { ok: false, message: "Sign in again before updating roles." };

    const communityId = text(formData, "communityId");
    const roleId = text(formData, "roleId");
    const enabled = text(formData, "enabled") === "true";

    const [membership, role] = await Promise.all([
        prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId: user.id } },
        }),
        prisma.communityRole.findUnique({ where: { id: roleId } }),
    ]);
    if (!membership || !role || role.communityId !== communityId)
        return { ok: false, message: "Role not found." };
    if (role.isDefault) return { ok: true, message: "General always applies." };

    if (enabled) {
        await prisma.communityMemberRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId } },
            create: { communityId, userId: user.id, roleId },
            update: {},
        });
    } else {
        await prisma.communityMemberRole.deleteMany({
            where: { communityId, userId: user.id, roleId },
        });
    }

    revalidatePath("/");
    revalidatePath(`/communities/${communityId}`);
    return { ok: true, message: enabled ? "Role enabled." : "Role disabled." };
}
