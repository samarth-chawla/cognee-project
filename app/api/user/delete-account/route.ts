import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { deleteClerkUserFromDatabase } from "@/lib/auth/sync-user";

export const runtime = "nodejs";

// Full account deletion, triggered from Settings → Delete Account.
// 1. Writes the tombstone (usedCount snapshot) + forgets Cognee + hard-deletes
//    all DB rows for the user  (deleteClerkUserFromDatabase).
// 2. Deletes the Clerk user, which also invalidates every session → the client
//    is effectively logged out.
// The Clerk "user.deleted" webhook may also fire afterwards; it calls the same
// helper, which no-ops because the DB row is already gone (idempotent).
export async function DELETE() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Tombstone + Cognee + DB rows. Safe if the row is already missing.
    await deleteClerkUserFromDatabase(clerkId);

    // Delete the Clerk account last. If this throws we still deleted the DB
    // side; surface the error so the client can retry the Clerk step.
    const client = await clerkClient();
    await client.users.deleteUser(clerkId);

    return NextResponse.json({
      success: true,
      message: "Account deleted",
    });
  } catch (error: any) {
    console.error("[DeleteAccount] failed", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to delete account" },
      { status: 500 }
    );
  }
}
