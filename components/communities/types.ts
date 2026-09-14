export type CommunitySummary = {
    id: string;
    name: string;
    companyName: string | null;
    address: string | null;
    inviteCode: string;
    members: unknown[];
    optimistic?: boolean;
};
