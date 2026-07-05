import { getCogneeClient } from "@/lib/cognee/client";

export type CogneeRecallResult = unknown[];

export async function healthCheck(): Promise<unknown> {
  const client = getCogneeClient();
  await client.initialize();
  return client.request("/health");
}

export async function remember(text: string): Promise<unknown> {
  const client = getCogneeClient();
  await client.initialize();

  const formData = new FormData();
  formData.append("data", new Blob([text], { type: "text/plain" }), "memory.txt");
  formData.append("datasetName", client.userId);
  formData.append("run_in_background", "false");

  return client.request("/api/v1/remember", {
    method: "POST",
    formData,
  });
}

export async function recall(query: string): Promise<CogneeRecallResult> {
  const client = getCogneeClient();
  await client.initialize();

  return client.request<CogneeRecallResult>("/api/v1/recall", {
    method: "POST",
    body: {
      query,
      datasets: [client.userId],
      scope: "graph",
      topK: 5,
    },
  });
}
