"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  fetchUserNotifications,
  fetchUnreadCount,
  markAsReadAction,
  markAllAsReadAction,
} from "@/lib/notification-actions";
import { usePushNotifications } from "@/lib/use-push-notifications";
import type { NotificationItem } from "@/db/queries";

export default function NotificationBell({ className = "" }: { className?: string }) {
  const { data: session } = useSession();
  const currentUser = session?.user;
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    permission: pushPermission,
    isLoading: isPushLoading,
    toggle: togglePush,
  } = usePushNotifications();

  const containerRef = useRef<HTMLDivElement>(null);

  // Poll for updates & refresh on focus
  useEffect(() => {
    if (!currentUser?.id) return;

    let isMounted = true;

    async function loadData() {
      try {
        const [count, items] = await Promise.all([
          fetchUnreadCount(),
          fetchUserNotifications({ limit: 12 }),
        ]);
        if (isMounted) {
          setUnreadCount(count);
          setNotifications(items);
        }
      } catch (err) {
        // graceful fallback
      }
    }

    loadData();

    const interval = setInterval(loadData, 30000);
    const onFocus = () => loadData();
    window.addEventListener("focus", onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [currentUser?.id]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!currentUser) return null;

  async function handleNotificationClick(item: NotificationItem) {
    if (!item.isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markAsReadAction(item.id).catch(() => {});
    }
    setIsOpen(false);
    if (item.targetUrl.startsWith("http://") || item.targetUrl.startsWith("https://")) {
      window.open(item.targetUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(item.targetUrl);
    }
  }

  function handleMarkAllAsRead() {
    startTransition(async () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await markAllAsReadAction();
    });
  }

  const displayedNotifications = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  const formatRelativeTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "post_like":
        return (
          <span className="w-5 h-5 rounded-full bg-rose/15 text-rose flex items-center justify-center shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </span>
        );
      case "post_repost":
        return (
          <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
          </span>
        );
      case "new_follower":
        return (
          <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v6m3-3h-6m-1.5-4.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" />
            </svg>
          </span>
        );
      case "site_article":
        return (
          <span className="w-5 h-5 rounded-full bg-lilac/20 text-purple-deep flex items-center justify-center shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
          </span>
        );
      case "site_deal":
        return (
          <span className="w-5 h-5 rounded-full bg-gold/25 text-gold flex items-center justify-center shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
            </svg>
          </span>
        );
      case "site_banner":
        return (
          <span className="w-5 h-5 rounded-full bg-rose/20 text-rose flex items-center justify-center shrink-0">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.38-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.71 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535V4.625a23.848 23.848 0 00-8.835 2.535m0 9.18a23.848 23.848 0 010-9.18" />
            </svg>
          </span>
        );
      default:
        // comment_reply or post_reply
        return (
          <span className="w-5 h-5 rounded-full bg-mauve-100 text-purple-deep flex items-center justify-center shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
            </svg>
          </span>
        );
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
          if (!isOpen) {
            setIsLoading(true);
            fetchUserNotifications({ limit: 12 })
              .then((items) => setNotifications(items))
              .finally(() => setIsLoading(false));
          }
        }}
        className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-mauve-50 hover:bg-mauve-100 border border-border text-purple-deep transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lilac/50 cursor-pointer group"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <svg
          className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
            isOpen ? "text-lilac" : "text-purple-deep"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-rose text-white text-[10.5px] font-bold flex items-center justify-center shadow-xs border-2 border-white animate-scale-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-28px)] max-w-[360px] sm:w-96 rounded-2xl bg-white/95 backdrop-blur-md border border-border shadow-[0_16px_36px_rgba(90,47,69,0.14)] z-50 overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-mauve-100 flex items-center justify-between bg-cream-alt/60">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-purple-deep">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose/15 text-rose">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="text-[11px] font-semibold text-lilac hover:text-purple-deep transition-colors disabled:opacity-50 cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Device Push Quick Toggle */}
          {isPushSupported && (
            <div className="px-3.5 py-2 bg-mauve-50/70 border-b border-mauve-100 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isPushSubscribed ? "bg-emerald-500 animate-pulse" : "bg-tan-dark/40"
                  }`}
                />
                <span className="text-[11px] font-medium text-purple-deep truncate">
                  {pushPermission === "denied"
                    ? "Push blocked in browser"
                    : isPushSubscribed
                    ? "Device Push: Active"
                    : "Device Push: Off"}
                </span>
              </div>
              {pushPermission !== "denied" && (
                <button
                  type="button"
                  onClick={togglePush}
                  disabled={isPushLoading}
                  className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                    isPushSubscribed
                      ? "bg-white border border-border hover:bg-rose/10 hover:border-rose/30 hover:text-rose text-purple-deep"
                      : "bg-lilac hover:bg-purple-deep text-white shadow-xs"
                  }`}
                >
                  {isPushLoading ? "..." : isPushSubscribed ? "Turn Off" : "Enable"}
                </button>
              )}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="px-3 pt-2 pb-1.5 border-b border-mauve-100/70 flex gap-2 bg-mauve-50/40">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-purple-deep text-white shadow-xs"
                  : "text-purple-deep/70 hover:bg-mauve-100"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "unread"
                  ? "bg-purple-deep text-white shadow-xs"
                  : "text-purple-deep/70 hover:bg-mauve-100"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto divide-y divide-mauve-100/60 max-h-[380px] p-1.5">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-tan-dark flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-lilac border-t-transparent rounded-full animate-spin" />
                <span>Loading notifications…</span>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-mauve-50 flex items-center justify-center text-tan-dark">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="text-xs font-bold text-purple-deep">No notifications yet</div>
                <div className="text-[11px] text-tan-dark max-w-[240px]">
                  {activeTab === "unread"
                    ? "You're all caught up!"
                    : "You will be notified when someone interacts with your posts or when new content is published."}
                </div>
              </div>
            ) : (
              displayedNotifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNotificationClick(item)}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer group ${
                    item.isRead
                      ? "hover:bg-mauve-50/70 opacity-80 hover:opacity-100"
                      : "bg-mauve-50/90 hover:bg-mauve-100/90 font-medium"
                  }`}
                >
                  {/* Avatar / Icon */}
                  <div className="relative shrink-0 mt-0.5">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-10 h-10 rounded-xl object-cover border border-mauve-100 shadow-xs bg-mauve-50"
                      />
                    ) : item.actorImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.actorImage}
                        alt={item.actorName || ""}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                    ) : item.actorName ? (
                      <div className="w-10 h-10 rounded-full bg-lilac/30 text-purple-deep flex items-center justify-center font-bold text-xs">
                        {item.actorName.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-deep text-gold flex items-center justify-center font-serif text-sm font-bold shadow-xs">
                        L
                      </div>
                    )}

                    {/* Small badge type overlay */}
                    <div className="absolute -bottom-1 -right-1 shadow-xs rounded-full">
                      {renderTypeIcon(item.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-purple-deep truncate group-hover:text-lilac transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-tan-dark shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    {item.message && (
                      <p className="text-[11.5px] text-purple-deep/80 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    )}
                  </div>

                  {/* Unread indicator dot */}
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-rose shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-mauve-100 bg-mauve-50/50 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-purple-deep hover:text-rose transition-colors py-1 inline-block"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
