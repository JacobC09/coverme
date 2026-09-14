export type Shift = {
    id: string;
    owner: string;
    role: string;
    startsAt?: string;
    date: string;
    time: string;
    timeRange: string;
    length: string;
    community: string;
    description: string;
    targetNames: string[];
    optimistic?: boolean;
};

export type CommunityOption = {
    id: string;
    name: string;
    members: { id: string; name: string; email: string }[];
    roles: { id: string; name: string; isDefault: boolean }[];
};
