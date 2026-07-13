import React from "react";
import { APP_NAME } from "@/lib/utils/constants";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const Header = () => {
  return (
    <header className="flex items-center justify-between border-b border-outline-variant/20 bg-white/80 backdrop-blur-md px-6 py-4 text-on-surface sticky top-0 z-50">
      <div className="flex flex-1 items-center justify-start">
        <Link
          href="/"
          className="font-extrabold tracking-tight text-lg text-primary"
        >
          {APP_NAME}
        </Link>
      </div>
      <nav className="hidden items-center justify-center gap-8 md:flex">
        <Link
          href="/#features"
          className="text-sm font-medium text-on-surface-variant transition hover:text-on-surface"
        >
          Features
        </Link>
        <Link
          href="/#how-it-works"
          className="text-sm font-medium text-on-surface-variant transition hover:text-on-surface"
        >
          How it works
        </Link>
        <Link
          href="/#memory"
          className="text-sm font-medium text-on-surface-variant transition hover:text-on-surface"
        >
          Memory
        </Link>
      </nav>
      <div className="flex flex-1 items-center justify-end gap-3">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="text-sm font-medium text-on-surface-variant transition hover:text-on-surface cursor-pointer">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4338CA] cursor-pointer">
              Start Practicing
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
};

export default Header