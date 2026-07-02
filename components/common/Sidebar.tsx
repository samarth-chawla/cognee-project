"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { ROUTES } from "@/lib/utils/constants";

interface SidebarProps {
  targetRole?: string;
  experience?: string;
  hasResume?: boolean;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  profileLoaded?: boolean;
}

export default function Sidebar({
  githubUrl,
  linkedinUrl,
  profileLoaded,
}: SidebarProps) {
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

  const confirmDialog =
    confirmOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => !signingOut && setConfirmOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-sm rounded-3xl bg-surface border border-outline-variant/30 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-11 h-11 rounded-2xl bg-error-red/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-error-red">logout</span>
              </div>
              <h2 className="text-xl font-bold text-on-surface">Log out?</h2>
              <p className="text-sm text-on-surface-variant mt-2">
                You&apos;ll need to sign in again to access your dashboard.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={signingOut}
                  className="py-3 rounded-xl bg-surface-container text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="py-3 rounded-xl bg-error-red text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {signingOut ? "Logging out..." : "Log out"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  const navItems = [
    { name: "Dashboard", href: ROUTES.dashboard, icon: "dashboard" },
    { name: "Interviews", href: ROUTES.interview, icon: "video_chat" },
    { name: "Reports", href: ROUTES.reports, icon: "description" },
    { name: "Memory", href: ROUTES.memory, icon: "psychology" },
  ];

  return (
    <nav className="h-screen w-64 fixed left-0 top-0 border-r border-outline-variant/30 flex flex-col py-lg px-md bg-white z-50">
      <div className="mb-10 px-sm">
        <Link href={ROUTES.home}>
          <h1 className="font-display text-xl md:text-2xl font-extrabold text-primary hover:opacity-85 transition-opacity">
            Interview AI
          </h1>
        </Link>
        <p className="font-bold text-[9px] uppercase tracking-widest text-on-surface-variant mt-1">
          Professional Grade
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== ROUTES.dashboard &&
              pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? "text-primary font-bold bg-primary/10"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}


      </div>

      <div className="pt-4 border-t border-outline-variant/20 space-y-4">
        <Link
          href={ROUTES.settings}
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 ${
            pathname.startsWith(ROUTES.settings)
              ? "text-primary font-bold bg-primary/10"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-sm font-medium">Settings</span>
        </Link>
        
        <button
          onClick={() => setConfirmOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container/50 hover:bg-surface-container transition-all active:scale-95 cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="w-full h-full object-cover"
                alt={displayName}
                src={avatarUrl}
              />
            ) : (
              <span className="text-sm font-bold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate text-on-surface">
              {displayName}
            </p>
            <p className="text-[10px] text-on-surface-variant font-medium">
              Free Plan
            </p>
          </div>
        </button>
      </div>

      {confirmDialog}
    </nav>
  );
}
