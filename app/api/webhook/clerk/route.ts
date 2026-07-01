import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import {
  deleteClerkUserFromDatabase,
  syncClerkUserToDatabase,
} from "@/lib/auth/sync-user";
import { fail, ok } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);

    if (event.type === "user.created" || event.type === "user.updated") {
      await syncClerkUserToDatabase(event.data);
    }

    if (event.type === "user.deleted" && event.data.id) {
      await deleteClerkUserFromDatabase(event.data.id);
    }

    return NextResponse.json(ok({ received: true }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Clerk webhook failed";

    return NextResponse.json(fail(message), { status: 400 });
  }
}
