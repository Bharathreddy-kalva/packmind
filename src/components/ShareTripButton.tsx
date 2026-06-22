"use client";

import { useState } from "react";
import { Check, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareTripButton({
  tripId,
  canInvite,
}: {
  tripId: string;
  canInvite: boolean;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleShare = async () => {
    if (!canInvite) {
      await copyText(window.location.href);
      toast.success("Trip link copied.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/invites`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        inviteUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.inviteUrl) {
        throw new Error(data.error ?? "Failed to create invite.");
      }

      await copyText(data.inviteUrl);
      toast.success("Invite link copied.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to share trip.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={isCreating}
      className="btn-ghost flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isCreating ? (
        <Loader2 className="size-4 animate-spin" />
      ) : copied ? (
        <Check className="size-4 text-emerald-400" />
      ) : canInvite ? (
        <Share2 className="size-4" />
      ) : (
        <Link2 className="size-4" />
      )}
      {canInvite ? "Invite" : "Copy Link"}
    </button>
  );
}
