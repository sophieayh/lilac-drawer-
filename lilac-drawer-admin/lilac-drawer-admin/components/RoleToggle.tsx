"use client";

import { useTransition } from "react";
import { setUserRole } from "@/lib/actions";

export default function RoleToggle({ userId, role, isSelf }: { userId: string; role: string; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();
  const isAdmin = role === "admin";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-xs font-semibold rounded-full px-3 py-1 ${
          isAdmin ? "bg-rose/15 text-rose" : "bg-tan/15 text-tan-dark"
        }`}
      >
        {isAdmin ? "Admin" : "User"}
      </span>
      {!isSelf && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => setUserRole(userId, isAdmin ? "user" : "admin"))}
          className="text-xs font-semibold text-rose hover:underline disabled:opacity-50"
        >
          {isPending ? "…" : isAdmin ? "Revoke" : "Make admin"}
        </button>
      )}
    </div>
  );
}
