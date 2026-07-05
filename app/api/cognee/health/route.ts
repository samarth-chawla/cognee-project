import { NextResponse } from "next/server";

import { healthCheck, recall, remember } from "@/services/cognee.service";

const CONNECTION_TEST_MEMORY = "Hello Cognee. This is a connection test.";
const CONNECTION_TEST_QUERY = "hello";

function containsConnectionTest(result: unknown): boolean {
  const text = JSON.stringify(result).toLowerCase();
  return text.includes("hello cognee") || text.includes("connection test");
}

export async function GET() {
  try {
    await healthCheck();
    await remember(CONNECTION_TEST_MEMORY);

    const recallResult = await recall(CONNECTION_TEST_QUERY);
    console.log("[Cognee health] recall response", recallResult);

    if (!containsConnectionTest(recallResult)) {
      return NextResponse.json(
        {
          success: false,
          error: "Cognee health check passed, but recall did not return the connection test memory.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (reason) {
    const error = reason instanceof Error ? reason.message : "Cognee is unavailable";
    return NextResponse.json({ success: false, error }, { status: 503 });
  }
}
