import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/constants";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        AI-powered mock interviews with long-term memory. Practice, get scored,
        and watch the agent remember your weak spots across sessions.
      </p>
      <div className="flex gap-3">
        <Link href={ROUTES.login}>
          <Button>Get started</Button>
        </Link>
        <Link href={ROUTES.dashboard}>
          <Button variant="outline">Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
