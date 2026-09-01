"use client";

import { useTransition } from "react";

export default function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(() => {
          action();
        });
      }}
      className="text-xs font-semibold text-rose hover:underline disabled:opacity-50"
    >
      {isPending ? "Deleting…" : label}
    </button>
  );
}
