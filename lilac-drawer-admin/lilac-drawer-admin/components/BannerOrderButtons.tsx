"use client";

import { useTransition } from "react";
import { moveBanner } from "@/lib/actions";

export default function BannerOrderButtons({
  id,
  disableUp,
  disableDown,
}: {
  id: number;
  disableUp: boolean;
  disableDown: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(() => {
      moveBanner(id, direction);
    });
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-label="Move banner up"
        disabled={disableUp || isPending}
        onClick={() => move("up")}
        className="text-purple-deep leading-none disabled:opacity-25 hover:text-rose cursor-pointer"
      >
        ▲
      </button>
      <button
        type="button"
        aria-label="Move banner down"
        disabled={disableDown || isPending}
        onClick={() => move("down")}
        className="text-purple-deep leading-none disabled:opacity-25 hover:text-rose cursor-pointer"
      >
        ▼
      </button>
    </div>
  );
}
