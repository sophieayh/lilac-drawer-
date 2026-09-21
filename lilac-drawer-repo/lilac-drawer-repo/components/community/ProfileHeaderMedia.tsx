"use client";

import { useState } from "react";
import Link from "next/link";
import FollowButton from "@/components/community/FollowButton";
import ImageLightboxModal from "@/components/ImageLightboxModal";
import { parseCoverPosition } from "@/lib/data";

interface ProfileHeaderMediaProps {
  name: string;
  handle: string;
  coverImage?: string | null;
  coverPosition?: string | number | null;
  image?: string | null;
  isOwnProfile: boolean;
  isFollowing: boolean;
  targetUserId: string;
  isLoggedIn: boolean;
}

export default function ProfileHeaderMedia({
  name,
  handle,
  coverImage,
  coverPosition,
  image,
  isOwnProfile,
  isFollowing,
  targetUserId,
  isLoggedIn,
}: ProfileHeaderMediaProps) {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const pos = parseCoverPosition(coverPosition);

  return (
    <>
      {/* 1. Profile Cover Banner */}
      <div className="relative group/cover">
        {coverImage ? (
          <div
            onClick={() => setLightboxImage({ url: coverImage, title: `${name}'s Cover Photo` })}
            className="w-full h-[180px] md:h-[220px] rounded-2xl overflow-hidden cursor-pointer relative shadow-2xs border border-border/80"
            title="Click to view cover photo in full size"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt={`${name} cover photo`}
              style={{
                objectPosition: `${pos.x}% ${pos.y}%`,
                transform: `scale(${pos.z})`,
                transformOrigin: `${pos.x}% ${pos.y}%`,
              }}
              className="w-full h-full object-cover group-hover/cover:scale-[1.02] transition-transform duration-300"
            />
            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-black/60 backdrop-blur-xs text-white text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <span>View Cover</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full h-[180px] md:h-[220px] bg-gradient-to-r from-lilac/30 via-mauve-100 to-cream-alt flex items-center justify-center rounded-2xl border border-border/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-tan-dark/70">
              <svg className="w-4 h-4 text-lilac" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span>@{handle}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Profile Avatar & Actions Bar */}
      <div className="px-3.5 sm:px-6">
        <div className="flex justify-between items-end -mt-10 sm:-mt-12 mb-3">
          {/* Avatar with click to enlarge */}
          <div className="relative group/avatar">
            {image ? (
              <div
                onClick={() => setLightboxImage({ url: image, title: `${name}'s Profile Photo` })}
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-cream bg-mauve-100 shadow-sm cursor-pointer relative"
                title="Click to view avatar in full size"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`${name} avatar`}
                  className="w-full h-full object-cover group-hover/avatar:scale-105 transition-transform duration-200"
                />
                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-cream bg-mauve-100 flex items-center justify-center text-purple-deep font-heading font-bold text-2xl sm:text-3xl shadow-sm">
                {name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          {/* Action Button: Edit Profile vs Follow */}
          {isOwnProfile ? (
            <div className="mt-10 sm:mt-14">
              <Link
                href={`/community/${handle}/edit`}
                className="inline-block border-[1.5px] border-rose text-rose hover:bg-rose hover:text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all shadow-xs"
              >
                Edit Profile
              </Link>
            </div>
          ) : (
            <div className="mt-10 sm:mt-14">
              <FollowButton
                targetUserId={targetUserId}
                initialIsFollowing={isFollowing}
                isLoggedIn={isLoggedIn}
              />
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxImage}
        imageUrl={lightboxImage?.url || null}
        title={lightboxImage?.title}
        onClose={() => setLightboxImage(null)}
      />
    </>
  );
}
