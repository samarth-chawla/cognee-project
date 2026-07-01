import { syncCurrentClerkUserToDatabase } from "@/lib/auth/sync-user";

export async function UserSync() {
  try {
    await syncCurrentClerkUserToDatabase();
  } catch (error) {
    console.error("Unable to sync Clerk user to database", error);
  }

  return null;
}
