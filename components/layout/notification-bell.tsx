"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/lib/notification-actions";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  relatedBookingId: string | null;
  isRead: boolean;
  createdAt: Date;
};

type Props = {
  currentUserId: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function formatRelativeTime(date: Date | null): string {
  if (!date) return "";

  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationBell({ currentUserId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  // Real-time subscription (gracefully handles missing Supabase client)
  useEffect(() => {
    if (!supabase) {
      console.warn("Supabase client not initialized — Realtime disabled. Check NEXT_PUBLIC_SUPABASE_* env vars.");
      return;
    }

    // Use unique channel name per mount to avoid stale channel conflicts
    const channelName = `notifications:${currentUserId}:${Date.now()}`;

    const channel = supabase.channel(channelName);

    // Attach ALL listeners BEFORE subscribe
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${currentUserId}`,
      },
      (payload) => {
        loadNotifications();

        if ("Notification" in window && Notification.permission === "granted") {
          const data = payload.new as { title?: string; message?: string };
          new Notification(data.title || "New notification", {
            body: data.message || "",
            icon: "/favicon.ico",
          });
        }
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${currentUserId}`,
      },
      () => {
        loadNotifications();
      }
    );

    // Subscribe AFTER all listeners are attached
    channel.subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const [items, count] = await Promise.all([getMyNotifications(20), getUnreadCount()]);
      setNotifs(items);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    if (!open) {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
    setOpen((s) => !s);
  }

  function handleClickNotification(notif: Notification) {
    if (!notif.isRead) {
      startTransition(async () => {
        await markAsRead(notif.id);
        loadNotifications();
      });
    }

    if (notif.relatedBookingId) {
      setOpen(false);
      router.push(`/bookings/${notif.relatedBookingId}`);
    }
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead();
      loadNotifications();
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-semibold text-slate-900 text-sm">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs text-slate-500 font-normal">
                  ({unreadCount} unread)
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
            ) : notifs.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-medium">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Updates about your bookings will appear here
                </p>
              </div>
            ) : (
              <ul>
                {notifs.map((notif) => (
                  <li key={notif.id}>
                    <button
                      onClick={() => handleClickNotification(notif)}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors border-b border-slate-100 last:border-b-0 block",
                        notif.isRead
                          ? "hover:bg-slate-50"
                          : "bg-blue-50/50 hover:bg-blue-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-1.5">
                          {!notif.isRead ? (
                            <span className="block w-2 h-2 rounded-full bg-blue-500" />
                          ) : (
                            <span className="block w-2 h-2" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm leading-snug",
                              notif.isRead
                                ? "text-slate-700"
                                : "font-semibold text-slate-900"
                            )}
                          >
                            {notif.title}
                          </p>
                          {notif.message && (
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {formatRelativeTime(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-center">
              <p className="text-xs text-slate-500">
                Showing {notifs.length} most recent
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
