import { syncCurrentClerkUserToDatabase } from "@/lib/auth/sync-user";

export async function UserSync() {
  try {
    await syncCurrentClerkUserToDatabase();
  } catch (error) {
    if (
      error instanceof Error &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }

    console.error("Unable to sync Clerk user to database", error);
  }

  return null;
}
