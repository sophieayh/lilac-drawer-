"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { useSession } from "@/lib/auth-client";
import {
  fetchUserNotifications,
  fetchUnreadCount,
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
  clearReadNotificationsAction,
} from "@/lib/notification-actions";
import { usePushNotifications } from "@/lib/use-push-notifications";
import type { NotificationItem } from "@/db/queries";

type FilterTab = "all" | "unread" | "social" | "system";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const currentUser = session?.user;
  const router = useRouter();

  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    permission: pushPermission,
    isLoading: isPushLoading,
    toggle: togglePush,
  } = usePushNotifications();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [count, items] = await Promise.all([
          fetchUnreadCount(),
          fetchUserNotifications({ limit: 50 }),
        ]);
        if (isMounted) {
          setUnreadCount(count);
          setNotifications(items);
        }
      } catch (e) {
        // Fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  const displayedNotifications = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.isRead);
      case "social":
        return notifications.filter((n) =>
          ["post_reply", "comment_reply", "new_follower", "post_like", "post_repost"].includes(n.type)
        );
      case "system":
        return notifications.filter((n) =>
          ["site_article", "site_deal", "site_banner", "system"].includes(n.type)
        );
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  function handleMarkAllAsRead() {
    startTransition(async () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await markAllAsReadAction();
    });
  }

  function handleClearRead() {
    if (!confirm("Are you sure you want to delete all read notifications?")) return;
    startTransition(async () => {
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      await clearReadNotificationsAction();
    });
  }

  async function handleNotificationClick(item: NotificationItem) {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markAsReadAction(item.id).catch(() => {});
    }
    if (item.targetUrl.startsWith("http://") || item.targetUrl.startsWith("https://")) {
      window.open(item.targetUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(item.targetUrl);
    }
  }

  function handleDeleteItem(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
    deleteNotificationAction(id).catch(() => {});
  }

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
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "post_like":
        return (
          <span className="w-6 h-6 rounded-full bg-rose/15 text-rose flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </span>
        );
      case "post_repost":
        return (
          <span className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
          </span>
        );
      case "new_follower":
        return (
          <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v6m3-3h-6m-1.5-4.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" />
            </svg>
          </span>
        );
      case "site_article":
        return (
          <span className="w-6 h-6 rounded-full bg-lilac/20 text-purple-deep flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
          </span>
        );
      case "site_deal":
        return (
          <span className="w-6 h-6 rounded-full bg-gold/25 text-gold flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
            </svg>
          </span>
        );
      case "site_banner":
        return (
          <span className="w-6 h-6 rounded-full bg-rose/20 text-rose flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.38-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.71 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535V4.625a23.848 23.848 0 00-8.835 2.535m0 9.18a23.848 23.848 0 010-9.18" />
            </svg>
          </span>
        );
      default:
        return (
          <span className="w-6 h-6 rounded-full bg-mauve-100 text-purple-deep flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
            </svg>
          </span>
        );
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="bg-cream min-h-screen py-6 sm:py-10 px-4 sm:px-6 md:px-12 text-ink">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Top Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-purple-deep">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose text-white text-xs font-bold shadow-xs">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-tan-dark mt-1">
                Stay up to date with community replies, new followers, and latest Lilac Drawer articles & deals.
              </p>
            </div>

            {currentUser && notifications.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={isPending}
                    className="px-3.5 py-1.5 rounded-xl border border-lilac/70 hover:border-lilac hover:bg-lilac hover:text-white text-xs font-bold text-purple-deep transition-all cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearRead}
                  disabled={isPending}
                  className="px-3.5 py-1.5 rounded-xl border border-border hover:bg-rose/10 hover:border-rose/30 hover:text-rose text-xs font-semibold text-tan-dark transition-all cursor-pointer"
                >
                  Clear read
                </button>
              </div>
            )}
          </div>

          {/* Web Push Notifications Settings Card */}
          {isPushSupported && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isPushSubscribed
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-mauve-50 text-purple-deep border border-mauve-100"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading font-bold text-sm text-purple-deep">Device Push Notifications</h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pushPermission === "denied"
                          ? "bg-rose/15 text-rose"
                          : isPushSubscribed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-mauve-100 text-purple-deep/70"
                      }`}
                    >
                      {pushPermission === "denied" ? "Blocked" : isPushSubscribed ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-xs text-tan-dark mt-0.5 leading-relaxed">
                    {pushPermission === "denied"
                      ? "Notifications are blocked by your browser settings. Please allow notifications for Lilac Drawer in your browser site permissions."
                      : isPushSubscribed
                      ? "Push alerts are active on this device. You will receive native notifications on your screen even when Lilac Drawer is closed."
                      : "Receive real-time push alerts on your lock screen and desktop for replies, mentions, and latest deals."}
                  </p>
                </div>
              </div>

              {pushPermission !== "denied" && (
                <button
                  type="button"
                  onClick={togglePush}
                  disabled={isPushLoading}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    isPushSubscribed
                      ? "bg-mauve-50 hover:bg-rose/10 border border-border hover:border-rose/30 hover:text-rose text-purple-deep"
                      : "bg-purple-deep hover:bg-lilac text-white"
                  }`}
                >
                  {isPushLoading ? "Processing..." : isPushSubscribed ? "Turn Off Push" : "Enable Push Alerts"}
                </button>
              )}
            </div>
          )}

          {!currentUser ? (
            /* Guest State */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-border text-center shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-full bg-mauve-50 flex items-center justify-center mx-auto text-lilac">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <h2 className="font-heading text-xl font-bold text-purple-deep">
                Log in to view your notifications
              </h2>
              <p className="text-xs sm:text-sm text-tan-dark max-w-md mx-auto leading-relaxed">
                Create an account or sign in to get alerts when other readers reply to your posts, follow your profile, or when new tested deals and care guides go live.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-full border border-lilac text-purple-deep text-xs font-bold hover:bg-mauve-50 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 rounded-full bg-lilac hover:bg-purple-deep text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          ) : (
            /* Logged In State */
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === "all"
                      ? "bg-purple-deep text-white shadow-xs"
                      : "bg-white border border-border text-purple-deep hover:bg-mauve-50"
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("unread")}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === "unread"
                      ? "bg-purple-deep text-white shadow-xs"
                      : "bg-white border border-border text-purple-deep hover:bg-mauve-50"
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("social")}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === "social"
                      ? "bg-purple-deep text-white shadow-xs"
                      : "bg-white border border-border text-purple-deep hover:bg-mauve-50"
                  }`}
                >
                  Community & Social
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("system")}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === "system"
                      ? "bg-purple-deep text-white shadow-xs"
                      : "bg-white border border-border text-purple-deep hover:bg-mauve-50"
                  }`}
                >
                  Site Updates & Deals
                </button>
              </div>

              {/* Notification Items */}
              {isLoading ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-border space-y-3">
                  <div className="w-7 h-7 border-2 border-lilac border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-xs text-tan-dark font-medium">Loading notifications…</div>
                </div>
              ) : displayedNotifications.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-border space-y-3 shadow-xs">
                  <div className="w-14 h-14 rounded-full bg-mauve-50 text-tan-dark flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-purple-deep">
                    No notifications in this section
                  </h3>
                  <p className="text-xs text-tan-dark max-w-sm mx-auto">
                    {activeTab === "unread"
                      ? "You're all caught up! Great job."
                      : "New notifications will appear here whenever there is activity."}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-border divide-y divide-mauve-100 overflow-hidden shadow-xs">
                  {displayedNotifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-colors cursor-pointer group relative ${
                        item.isRead ? "hover:bg-cream-alt/50 opacity-90" : "bg-mauve-50/70 hover:bg-mauve-100/70"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0 mt-0.5">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-mauve-100 shadow-xs bg-mauve-50"
                          />
                        ) : item.actorImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.actorImage}
                            alt={item.actorName || ""}
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-border"
                          />
                        ) : item.actorName ? (
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-lilac/30 text-purple-deep flex items-center justify-center font-bold text-sm">
                            {item.actorName.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-purple-deep text-gold flex items-center justify-center font-serif text-base font-bold shadow-xs">
                            L
                          </div>
                        )}

                        <div className="absolute -bottom-1 -right-1 shadow-xs rounded-full">
                          {renderTypeIcon(item.type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <h4 className="text-xs sm:text-sm font-bold text-purple-deep group-hover:text-lilac transition-colors">
                            {item.title}
                          </h4>
                          <span className="text-[11px] text-tan-dark">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        {item.message && (
                          <p className="text-xs text-purple-deep/80 leading-relaxed line-clamp-3">
                            {item.message}
                          </p>
                        )}
                      </div>

                      {/* Right Actions: Delete & Unread status */}
                      <div className="flex items-center gap-2 shrink-0 self-center">
                        {!item.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose shadow-xs" title="Unread" />
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(e, item.id)}
                          className="p-1.5 rounded-full text-tan-dark/70 hover:text-rose hover:bg-rose/10 transition-colors opacity-60 group-hover:opacity-100"
                          title="Delete notification"
                          aria-label="Delete notification"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
