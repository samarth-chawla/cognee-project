"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { ROUTES } from "@/lib/utils/constants";

interface SidebarProps {
  currentRole?: string;
}

export default function Sidebar({ currentRole = "Software Engineer" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const displayName = user?.fullName || user?.firstName || "User";
  const avatarUrl = user?.imageUrl;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut(() => router.push(ROUTES.home));
  };

  const navItems = [
    { name: "Dashboard", href: ROUTES.dashboard, icon: "dashboard" },
    { name: "Interviews", href: ROUTES.interview, icon: "video_chat" },
    { name: "Reports", href: ROUTES.reports, icon: "description" },
    { name: "Memory", href: ROUTES.memory, icon: "psychology" },
    { name: "Flow", href: ROUTES.flow, icon: "route" },
    { name: "Settings", href: ROUTES.settings, icon: "settings" },
  ];

  return (
    <nav className="h-screen w-64 fixed left-0 top-0 border-r border-outline-variant/30 flex flex-col py-lg px-md bg-surface z-50">
      <div className="mb-xxl px-sm">
        <Link href={ROUTES.home}>
          <h1 className="font-display text-xl md:text-2xl font-extrabold text-primary hover:opacity-85 transition-opacity">
            Interview AI
          </h1>
        </Link>
        <p className="font-semibold text-[9px] uppercase tracking-widest text-on-surface-muted mt-1">
          Professional Grade
        </p>
      </div>

      <div className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== ROUTES.dashboard && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? "text-primary font-bold bg-primary-container/10 border-l-4 border-primary"
                  : "text-on-surface-muted hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="pt-lg border-t border-outline-variant/20 space-y-2">
        <div className="mt-md px-4 py-3 rounded-2xl bg-surface-container flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center overflow-hidden shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="w-full h-full object-cover" alt={displayName} src={avatarUrl} />
            ) : (
              <span className="text-sm font-bold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate text-on-surface">{displayName}</p>
            <p className="text-[10px] text-on-surface-muted font-medium truncate">{currentRole}</p>
          </div>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-muted hover:bg-surface-container transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-md"
          onClick={() => !signingOut && setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-3xl bg-surface border border-outline-variant/30 shadow-2xl p-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-error-red/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-error-red">logout</span>
            </div>
            <h2 className="text-lg font-bold text-on-surface">Log out?</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              You&apos;ll need to sign in again to access your dashboard.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={signingOut}
                className="flex-1 py-2.5 rounded-xl bg-surface-container text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex-1 py-2.5 rounded-xl bg-error-red text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
