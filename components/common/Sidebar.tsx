"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/utils/constants";

interface SidebarProps {
  currentRole?: string;
}

export default function Sidebar({ currentRole = "Software Engineer" }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: ROUTES.dashboard, icon: "dashboard" },
    { name: "Interviews", href: ROUTES.interview, icon: "video_chat" },
    { name: "Reports", href: ROUTES.reports, icon: "description" },
    { name: "Memory", href: ROUTES.memory, icon: "psychology" },
    { name: "Flow", href: "/flow", icon: "route" },
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
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
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

      <div className="pt-lg border-t border-outline-variant/20">
        <div className="mt-md px-4 py-3 rounded-2xl bg-surface-container flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center overflow-hidden shrink-0">
            <img
              className="w-full h-full object-cover"
              alt="Samarth profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu2xcTJEgh6AeExYKNVFDMOSh0Knu6LiRMsLDoz4vAvwajF27spYC3JauQygEccryBsB30Pq8qym7M-NMJGPcmoyZvfFqhKNJ3qoU0KNaCBZLkuOUmX12eJjWsKjkkkBi8GRNWC0BkYALt2RRLw36A5r1ZIhSPLsUibRXQzQV1Ag6MnhI-Nimz6RVF0buLAXowvM64TtjgbIWGm3hgPLBtuK9iCwZtBhJkLrAChsx0JecwCh95QWWQSeXRbDgF9sK3M5iCIdi6gxGN"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate text-on-surface">Samarth</p>
            <p className="text-[10px] text-on-surface-muted font-medium truncate">{currentRole}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
