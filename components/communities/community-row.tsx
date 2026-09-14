"use client";

import Link from "next/link";
import { Ellipsis, UsersRound } from "lucide-react";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { leaveCommunityResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CommunitySummary } from "@/components/communities/types";

type CommunityRowProps = {
  community: CommunitySummary;
  onLeaveError?: () => void;
  onLeaveStart?: () => void;
};

export function CommunityRow({ community, onLeaveError, onLeaveStart }: CommunityRowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const href = `/communities/${community.id}`;

  useEffect(() => {
    if (!community.optimistic) router.prefetch(href);
  }, [community.optimistic, href, router]);

  function prefetchCommunity() {
    if (!community.optimistic) router.prefetch(href);
  }

  const content = (
    <div className="min-w-0">
      <p className="truncate text-xl font-black leading-tight">{community.name}</p>
      <p className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-zinc-600">
        <UsersRound className="size-4 shrink-0 text-zinc-400" />
        <span>
          {community.members.length} member{community.members.length === 1 ? "" : "s"}
        </span>
      </p>
    </div>
  );

  return (
    <div className={`flex items-center gap-3 py-4 ${community.optimistic ? "opacity-75" : ""}`}>
      {community.optimistic ? (
        <div className="min-w-0 flex-1">{content}</div>
      ) : (
        <Link
          className="min-w-0 flex-1"
          href={href}
          onFocus={prefetchCommunity}
          onPointerEnter={prefetchCommunity}
          onTouchStart={prefetchCommunity}
          prefetch
        >
          {content}
        </Link>
      )}

      <Popover>
        <PopoverTrigger
          render={
            <Button className="rounded-md" disabled={community.optimistic} size="icon-sm" title="Community settings" type="button" variant="ghost">
              <Ellipsis className="size-5" />
            </Button>
          }
        />
        <PopoverContent align="end" className="w-44 rounded-lg p-2" side="bottom">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              onLeaveStart?.();
              startTransition(async () => {
                try {
                  const result = await leaveCommunityResult(formData);
                  if (result.ok) {
                    toast.success(result.message);
                    router.refresh();
                  } else {
                    onLeaveError?.();
                    toast.error(result.message);
                  }
                } catch {
                  onLeaveError?.();
                  toast.error("Could not leave that community. Try again.");
                }
              });
            }}
          >
            <input name="communityId" type="hidden" value={community.id} />
            <Button className="h-9 w-full rounded-md normal-case tracking-normal" disabled={pending || community.optimistic} type="submit" variant="destructive">
              {pending || community.optimistic ? "Leaving..." : "Leave"}
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
