import { CommunitiesScreen } from "@/components/communities/communities-screen";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CommunitiesPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const user = await getCurrentUser();
    if (!user) return null;

    const { error } = await searchParams;
    const memberships = await prisma.communityMember.findMany({
        where: { userId: user.id },
        include: { community: { include: { members: true } } },
        orderBy: { community: { name: "asc" } },
    });
    const communities = memberships.map(({ community }) => community);
    const communitiesKey = communities
        .map((community) => `${community.id}:${community.name}:${community.members.length}`)
        .join("|");

    return <CommunitiesScreen communities={communities} error={error} key={communitiesKey} />;
}
