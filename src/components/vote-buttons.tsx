"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { vote } from "@/app/votes/actions";

type Props = {
  postId: string;
  score: number;
  myVote: -1 | 0 | 1;
  signedIn: boolean;
};

type VoteState = { score: number; myVote: -1 | 0 | 1 };

export function VoteButtons({ postId, score, myVote, signedIn }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Show the new score immediately while the server catches up.
  const [state, applyVote] = useOptimistic<VoteState, 1 | -1>(
    { score, myVote },
    (current, value) => {
      const next = current.myVote === value ? 0 : value;
      return { score: current.score - current.myVote + next, myVote: next };
    },
  );

  function onVote(value: 1 | -1) {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      applyVote(value);
      await vote(postId, value);
    });
  }

  const arrow = "rounded p-1 leading-none hover:bg-background";

  return (
    <div className="flex w-10 shrink-0 flex-col items-center text-sm">
      <button
        type="button"
        aria-label="Upvote"
        aria-pressed={state.myVote === 1}
        onClick={() => onVote(1)}
        className={`${arrow} ${state.myVote === 1 ? "text-accent" : "text-muted"}`}
      >
        ▲
      </button>
      <span
        aria-label="Score"
        className={`font-semibold ${
          state.myVote === 1
            ? "text-accent"
            : state.myVote === -1
              ? "text-blue-600 dark:text-blue-400"
              : ""
        }`}
      >
        {state.score}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        aria-pressed={state.myVote === -1}
        onClick={() => onVote(-1)}
        className={`${arrow} ${
          state.myVote === -1 ? "text-blue-600 dark:text-blue-400" : "text-muted"
        }`}
      >
        ▼
      </button>
    </div>
  );
}
