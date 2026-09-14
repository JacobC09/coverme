import { notFound } from "next/navigation";
import { CommunityOverview } from "@/components/communities/community-overview";
import { MemberSearch } from "@/components/communities/member-search";
import { RolesSection } from "@/components/communities/roles-section";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) return null;

    const { id } = await params;
    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: id, userId: user.id } },
        include: {
            community: {
                include: {
                    members: {
                        include: { user: { select: { id: true, name: true, email: true } } },
                        orderBy: { user: { name: "asc" } },
                    },
                    roles: { orderBy: [{ isDefault: "desc" }, { name: "asc" }] },
                },
            },
        },
    });

    if (!membership) notFound();

    const enabledRoles = await prisma.communityMemberRole.findMany({
        where: { communityId: id, userId: user.id },
        select: { roleId: true },
    });
    const community = membership.community;
    const members = community.members.map((member) => member.user);
    const rolesKey = [
        ...community.roles.map((role) => `${role.id}:${role.name}:${role.isDefault}`),
        ...enabledRoles.map((role) => role.roleId),
    ].join("|");
    const communityKey = `${community.id}:${community.name}:${community.companyName ?? ""}:${community.address ?? ""}`;

    return (
        <main className="text-zinc-950 grid gap-7">
            <CommunityOverview community={community} key={communityKey} />

            <section>
                <RolesSection
                    key={rolesKey}
                    communityId={community.id}
                    enabledRoleIds={enabledRoles.map((role) => role.roleId)}
                    roles={community.roles}
                />
            </section>

            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Members</h2>
                <MemberSearch members={members} />
            </section>

        </main>
    );
}
