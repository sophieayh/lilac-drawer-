"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient, signOut } from "@/lib/auth-client";

export default function EditProfileForm({
  handle,
  initialName,
  initialBio,
  initialImage,
  initialCoverImage,
}: {
  handle: string;
  initialName: string;
  initialBio: string;
  initialImage: string;
  initialCoverImage?: string;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "account">("profile");

  // Profile state
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [image, setImage] = useState(initialImage);
  const [coverImage, setCoverImage] = useState(initialCoverImage || "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sign out state
  const [isSigningOut, setIsSigningOut] = useState(false);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle local avatar file selection
  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please select a valid image file (JPG, PNG, WebP) for avatar.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Avatar image is too large (max 5MB).");
      return;
    }

    setProfileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  // Handle local cover file selection
  function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please select a valid image file (JPG, PNG, WebP) for cover.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Cover image is too large (max 5MB).");
      return;
    }

    setProfileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setCoverImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileLoading(true);

    try {
      const { error: updateError } = await authClient.updateUser({
        name: name.trim(),
        image: image.trim() || undefined,
        // @ts-expect-error -- additionalFields in better-auth
        bio: bio.trim(),
        coverImage: coverImage.trim() || undefined,
      });

      setProfileLoading(false);

      if (updateError) {
        setProfileError(updateError.message ?? "Couldn't save changes. Please try again.");
        return;
      }

      setProfileSuccess("Profile updated successfully!");
      router.refresh();
    } catch (err) {
      setProfileLoading(false);
      setProfileError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      const { error: passError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      setPasswordLoading(false);

      if (passError) {
        setPasswordError(passError.message ?? "Failed to change password. Please verify your current password.");
        return;
      }

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordLoading(false);
      setPasswordError(err instanceof Error ? err.message : "Failed to change password.");
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
      setIsSigningOut(false);
    }
  }

  const field =
    "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-lilac focus:ring-2 focus:ring-lilac/20 bg-cream-alt text-purple-deep transition-all";
  const label = "block text-xs font-bold text-purple-deep uppercase tracking-wider mb-1.5";

  return (
    <div className="bg-white rounded-3xl border border-border shadow-[0_8px_30px_rgba(90,47,69,0.06)] overflow-hidden">
      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-border bg-mauve-50/70 p-1.5 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-white text-purple-deep shadow-xs"
              : "text-tan-dark hover:text-purple-deep hover:bg-white/50"
          }`}
        >
          Edit Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("password")}
          className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "password"
              ? "bg-white text-purple-deep shadow-xs"
              : "text-tan-dark hover:text-purple-deep hover:bg-white/50"
          }`}
        >
          Password & Security
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("account")}
          className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "account"
              ? "bg-white text-purple-deep shadow-xs"
              : "text-tan-dark hover:text-purple-deep hover:bg-white/50"
          }`}
        >
          Account
        </button>
      </div>

      <div className="p-6 md:p-8">
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={coverFileInputRef}
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleCoverFile}
          className="hidden"
          id="cover-file-upload"
        />
        <input
          type="file"
          ref={avatarFileInputRef}
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleAvatarFile}
          className="hidden"
          id="avatar-file-upload"
        />

        {/* Tab 1: Edit Profile */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
            {profileSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3.5 bg-rose/10 border border-rose/30 text-rose rounded-xl text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 text-rose shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{profileError}</span>
              </div>
            )}

            {/* Live Profile Header Preview Container with direct on-image buttons */}
            <div>
              <label className={label}>Profile Photo & Cover</label>
              <div className="rounded-3xl border border-border overflow-hidden bg-mauve-50/40 shadow-xs">
                {/* Cover Banner with "Change Cover" overlay */}
                <div className="relative h-40 sm:h-48 w-full bg-gradient-to-r from-lilac/30 via-mauve-100 to-cream-alt flex items-center justify-center overflow-hidden group/cover">
                  {coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-tan-dark/60 text-xs px-4">
                      <p className="font-semibold text-purple-deep">Default Lilac Cover</p>
                      <p className="text-[11px] text-tan mt-0.5">Click &quot;Change Cover&quot; to upload your own banner</p>
                    </div>
                  )}

                  {/* On-Image Change Cover Button */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-purple-deep text-xs font-bold shadow-[0_2px_8px_rgba(0,0,0,0.12)] backdrop-blur-xs transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105"
                    >
                      <svg className="w-3.5 h-3.5 text-lilac" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                      <span>Change Cover</span>
                    </button>
                    {coverImage && (
                      <button
                        type="button"
                        onClick={() => setCoverImage("")}
                        className="px-2.5 py-1.5 rounded-full bg-rose/90 hover:bg-rose text-white text-xs font-bold shadow-[0_2px_8px_rgba(0,0,0,0.12)] backdrop-blur-xs transition-all cursor-pointer"
                        title="Remove cover photo"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Avatar with "Change Avatar" controls */}
                <div className="p-5 pt-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-1">
                    <div className="flex items-end gap-3.5">
                      {/* Avatar Circle with Camera Overlay */}
                      <div className="relative group/avatar shrink-0">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt="Avatar preview"
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md bg-mauve-100"
                          />
                        ) : (
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-lilac/30 text-purple-deep flex items-center justify-center font-bold text-3xl border-4 border-white shadow-md">
                            {name ? name.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}

                        {/* On-Avatar Camera Icon Button */}
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-deep hover:bg-lilac text-white shadow-md transition-all cursor-pointer hover:scale-110 border-2 border-white"
                          title="Change Avatar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-full bg-white hover:bg-mauve-50 border border-border text-purple-deep text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 hover:border-lilac"
                        >
                          <svg className="w-3.5 h-3.5 text-lilac" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          <span>Change Avatar</span>
                        </button>
                        {image && (
                          <button
                            type="button"
                            onClick={() => setImage("")}
                            className="px-3 py-1.5 rounded-full border border-border hover:border-rose hover:text-rose text-tan-dark text-xs font-semibold transition-all cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className={label}>
                Full Name
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={field}
              />
            </div>

            {/* Username / Handle (Readonly indicator) */}
            <div>
              <label className={label}>Username</label>
              <div className="w-full border border-border/60 rounded-xl px-3.5 py-2.5 text-sm bg-mauve-50/40 text-tan font-medium">
                @{handle}
              </div>
              <p className="text-[11px] text-tan mt-1">Username is unique and permanent to your profile link.</p>
            </div>

            {/* Bio */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label htmlFor="bio" className={label}>
                  Bio & About You
                </label>
                <span className="text-[11px] text-tan">{bio.length} / 280</span>
              </div>
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={280}
                placeholder="Share a short bio about your style, favorite aesthetic, or closet tips…"
                className={field}
              />
            </div>

            {/* Submit buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="bg-lilac hover:bg-purple-deep text-white rounded-full px-7 py-3 text-xs font-bold shadow-[0_4px_14px_rgba(201,163,198,0.4)] transition-all btn-press disabled:opacity-50 cursor-pointer"
              >
                {profileLoading ? "Saving Changes…" : "Save Profile"}
              </button>
              <Link
                href={`/community/${handle}`}
                className="text-xs font-semibold text-tan-dark hover:text-rose transition-colors px-4 py-2.5"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}

        {/* Tab 2: Password & Security */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
            {passwordSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 bg-rose/10 border border-rose/30 text-rose rounded-xl text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 text-rose shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{passwordError}</span>
              </div>
            )}

            {/* Current Password */}
            <div>
              <label htmlFor="current-password" className={label}>
                Current Password
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={field}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-tan-dark hover:text-purple-deep text-xs font-semibold"
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new-password" className={label}>
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="Enter new password (min. 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={field}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-tan-dark hover:text-purple-deep text-xs font-semibold"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirm-password" className={label}>
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={field}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-tan-dark hover:text-purple-deep text-xs font-semibold"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="bg-purple-deep hover:bg-lilac text-white rounded-full px-7 py-3 text-xs font-bold shadow-[0_4px_14px_rgba(46,37,54,0.2)] transition-all btn-press disabled:opacity-50 cursor-pointer"
              >
                {passwordLoading ? "Updating Password…" : "Update Password"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Account & Session */}
        {activeTab === "account" && (
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-2xl bg-mauve-50/70 border border-border">
              <h3 className="font-heading text-sm font-bold text-purple-deep mb-1">Public Profile Link</h3>
              <p className="text-xs text-tan-dark mb-3">Your public profile is visible to community members at:</p>
              <Link
                href={`/community/${handle}`}
                className="text-xs font-semibold text-rose hover:underline break-all block"
              >
                /community/{handle} →
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-rose/5 border border-rose/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading text-sm font-bold text-purple-deep">Sign Out</h3>
                <p className="text-xs text-tan-dark mt-0.5">End your current session on this device.</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="bg-rose hover:bg-rose/90 text-white px-5 py-2 rounded-full text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isSigningOut ? "Signing out…" : "Sign Out"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
