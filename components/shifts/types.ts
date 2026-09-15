export type Shift = {
    id: string;
    owner: string;
    claimedBy: string | null;
    role: string;
    startsAt?: string;
    date: string;
    time: string;
    timeRange: string;
    length: string;
    community: string;
    description: string;
    targetNames: string[];
    cancellationRequest: CancellationRequest | null;
    optimistic?: boolean;
};

export type CancellationRequest = {
    id: string;
    requesterName: string;
    approverName: string;
    requesterRole: "owner" | "coverer";
    requestedByMe: boolean;
    awaitingMe: boolean;
};

export type CommunityOption = {
    id: string;
    name: string;
    members: { id: string; name: string; email: string }[];
    roles: { id: string; name: string; isDefault: boolean }[];
};
