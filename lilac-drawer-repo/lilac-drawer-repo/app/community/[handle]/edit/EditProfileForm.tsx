"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function EditProfileForm({
  handle,
  initialName,
  initialBio,
  initialImage,
}: {
  handle: string;
  initialName: string;
  initialBio: string;
  initialImage: string;
}) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [image, setImage] = useState(initialImage);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: updateError } = await authClient.updateUser({
      name,
      image: image || undefined,
      // @ts-expect-error -- bio is a configured additionalField, not in the base updateUser type
      bio,
    });
    setLoading(false);
    if (updateError) {
      setError(updateError.message ?? "Couldn't save your changes. Try again.");
      return;
    }
    router.push(`/community/${handle}`);
    router.refresh();
  }

  const field = "w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lilac";
  const label = "block text-xs font-semibold text-purple-deep mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="name" className={label}>
          Name
        </label>
        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="bio" className={label}>
          Bio
        </label>
        <textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} className={field} />
      </div>
      <div>
        <label htmlFor="image" className={label}>
          Avatar photo URL <span className="text-tan-dark font-normal">(optional)</span>
        </label>
        <input
          id="image"
          type="url"
          placeholder="https://…"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className={field}
        />
      </div>
      {error && <p className="text-xs text-rose">{error}</p>}
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading} className="bg-lilac text-white rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
          {loading ? "Saving…" : "Save changes"}
        </button>
        <Link href={`/community/${handle}`} className="text-sm text-tan-dark self-center hover:text-rose">
          Cancel
        </Link>
      </div>
    </form>
  );
}
