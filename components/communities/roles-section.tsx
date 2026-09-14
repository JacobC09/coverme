"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
    addCommunityRoleResult,
    deleteCommunityRoleResult,
    setCommunityRoleCoverageResult,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Role = { id: string; name: string; isDefault: boolean };

export function RolesSection({
    communityId,
    roles,
    enabledRoleIds,
}: {
    communityId: string;
    roles: Role[];
    enabledRoleIds: string[];
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [name, setName] = useState("");
    const [roleState, setRoleState] = useState(roles);
    const [enabledIds, setEnabledIds] = useState(enabledRoleIds);
    const nextTemporaryId = useRef(0);
    const toggleRequests = useRef<Record<string, number>>({});
    const enabled = new Set(enabledIds);

    function sortRoles(items: Role[]) {
        return [...items].sort((first, second) => {
            if (first.isDefault !== second.isDefault) return first.isDefault ? -1 : 1;
            return first.name.localeCompare(second.name);
        });
    }

    function run(action: Promise<{ ok: boolean; message: string }>, onError?: () => void) {
        startTransition(async () => {
            try {
                const result = await action;
                if (result.ok) {
                    toast.success(result.message);
                    router.refresh();
                } else {
                    onError?.();
                    toast.error(result.message);
                }
            } catch {
                onError?.();
                toast.error("Could not update roles. Try again.");
            }
        });
    }

    return (
        <section className="grid gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Roles</h2>

            <div className="grid divide-y divide-zinc-200 border-y border-zinc-200">
                {roleState.map((role) => {
                    const isEnabled = role.isDefault || enabled.has(role.id);
                    const isHidden = !role.isDefault && !isEnabled;

                    return (
                        <div
                            className="flex items-center gap-3 py-3 transition-colors group"
                            key={role.id}
                        >
                            <div className="min-w-0 flex-1">
                                <p className={cn("truncate text-base font-black", isHidden && "text-zinc-400 italic")}>{role.name}</p>
                            </div>

                            {!role.isDefault ? (
                                <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity grid size-9 place-items-center rounded-md text-red-600 hover:bg-red-50"
                                    disabled={pending}
                                    onClick={() => {
                                        const formData = new FormData();
                                        formData.set("communityId", communityId);
                                        formData.set("roleId", role.id);
                                        setRoleState((current) => current.filter((item) => item.id !== role.id));
                                        setEnabledIds((current) => current.filter((id) => id !== role.id));
                                        run(deleteCommunityRoleResult(formData), () => {
                                            setRoleState((current) => sortRoles([...current, role]));
                                            if (isEnabled) setEnabledIds((current) => [...current, role.id]);
                                        });
                                    }}
                                    title="Delete role"
                                    type="button"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            ) : null}

                            <button
                                className={`h-9 rounded-full px-3 text-xs font-black ${isEnabled ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-500"
                                    }`}
                                disabled={role.isDefault}
                                onClick={() => {
                                    const nextEnabled = !isEnabled;
                                    const requestId = (toggleRequests.current[role.id] ?? 0) + 1;
                                    toggleRequests.current[role.id] = requestId;
                                    const formData = new FormData();
                                    formData.set("communityId", communityId);
                                    formData.set("roleId", role.id);
                                    formData.set("enabled", String(nextEnabled));
                                    setEnabledIds((current) =>
                                        nextEnabled
                                            ? [...current, role.id]
                                            : current.filter((id) => id !== role.id),
                                    );
                                    startTransition(async () => {
                                        try {
                                            const result = await setCommunityRoleCoverageResult(formData);
                                            const isLatest = toggleRequests.current[role.id] === requestId;

                                            if (result.ok) {
                                                if (isLatest) {
                                                    toast.success(result.message);
                                                    router.refresh();
                                                }
                                                return;
                                            }

                                            if (isLatest) {
                                                setEnabledIds((current) =>
                                                    nextEnabled
                                                        ? current.filter((id) => id !== role.id)
                                                        : [...current, role.id],
                                                );
                                                toast.error(result.message);
                                            }
                                        } catch {
                                            if (toggleRequests.current[role.id] === requestId) {
                                                setEnabledIds((current) =>
                                                    nextEnabled
                                                        ? current.filter((id) => id !== role.id)
                                                        : [...current, role.id],
                                                );
                                                toast.error("Could not update roles. Try again.");
                                            }
                                        }
                                    });
                                }}
                                type="button"
                            >
                                {role.isDefault ? "Default" : isEnabled ? "On" : "Off"}
                            </button>

                        </div>
                    );
                })}
            </div>

            <form
                className="flex gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const roleName = name.trim();
                    const temporaryId = `optimistic-role-${nextTemporaryId.current++}`;
                    const optimisticRole = { id: temporaryId, name: roleName, isDefault: false };
                    setName("");
                    setRoleState((current) => sortRoles([...current, optimisticRole]));
                    setEnabledIds((current) => [...current, temporaryId]);
                    startTransition(async () => {
                        try {
                            const result = await addCommunityRoleResult(formData);
                            if (result.ok) {
                                toast.success(result.message);
                                if (result.data) {
                                    setRoleState((current) =>
                                        sortRoles(current.map((role) => (role.id === temporaryId ? result.data! : role))),
                                    );
                                    setEnabledIds((current) =>
                                        current.map((id) => (id === temporaryId ? result.data!.id : id)),
                                    );
                                }
                                router.refresh();
                            } else {
                                setRoleState((current) => current.filter((role) => role.id !== temporaryId));
                                setEnabledIds((current) => current.filter((id) => id !== temporaryId));
                                setName(roleName);
                                toast.error(result.message);
                            }
                        } catch {
                            setRoleState((current) => current.filter((role) => role.id !== temporaryId));
                            setEnabledIds((current) => current.filter((id) => id !== temporaryId));
                            setName(roleName);
                            toast.error("Could not update roles. Try again.");
                        }
                    });
                }}
            >
                <input name="communityId" type="hidden" value={communityId} />
                <Input name="name" onChange={(event) => setName(event.target.value)} placeholder="Add role" required value={name} />
                <Button
                    className="rounded-md bg-primary normal-case tracking-normal hover:bg-primary-hover"
                    disabled={pending || !name.trim()}
                    type="submit"
                >
                    <Plus className="size-4" />
                    Add
                </Button>
            </form>
        </section>
    );
}
