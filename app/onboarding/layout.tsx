import { redirect } from "next/navigation";

import { syncCurrentClerkUserToDatabase } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db";
import { ROUTES } from "@/lib/utils/constants";
import Footer from "@/components/Footer";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await syncCurrentClerkUserToDatabase();

  if (user) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    // Onboarding already completed — a profile exists. Send to dashboard.
    if (profile) {
      redirect(ROUTES.dashboard);
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {children}
      <Footer variant="minimal" />
    </div>
  );
}
