import type { MemoryNode, MemoryQueryResult } from "@/types";
import { nowISO, uid } from "@/lib/utils";

export class CogneeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CogneeConfigurationError";
  }
}

type CogneeClientConfig = {
  baseUrl: string;
  apiKey: string;
  tenantId: string;
  userId: string;
};

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  formData?: FormData;
};

const REQUIRED_ENV_KEYS = [
  "COGNEE_BASE_URL",
  "COGNEE_API_KEY",
  "COGNEE_TENANT_ID",
  "COGNEE_USER_ID",
] as const;

let cogneeClient: CogneeClient | null = null;

function readRequiredEnv(): CogneeClientConfig {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new CogneeConfigurationError(
      `Cognee is not configured. Missing required environment variable${
        missing.length === 1 ? "" : "s"
      }: ${missing.join(", ")}`,
    );
  }

  return {
    baseUrl: process.env.COGNEE_BASE_URL!.trim().replace(/\/+$/, ""),
    apiKey: process.env.COGNEE_API_KEY!.trim(),
    tenantId: process.env.COGNEE_TENANT_ID!.trim(),
    userId: process.env.COGNEE_USER_ID!.trim(),
  };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function stringifyErrorBody(body: unknown): string {
  if (typeof body === "string") return body;

  try {
    return JSON.stringify(body);
  } catch {
    return "Unable to serialize Cognee error response";
  }
}

export class CogneeClient {
  readonly baseUrl: string;
  readonly tenantId: string;
  readonly userId: string;

  private readonly apiKey: string;
  private initialization: Promise<void> | null = null;

  constructor(config: CogneeClientConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.tenantId = config.tenantId;
    this.userId = config.userId;
  }

  async initialize(): Promise<void> {
    if (!this.initialization) {
      this.initialization = Promise.resolve();
    }

    return this.initialization;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: this.headers(options.formData),
      body:
        options.formData ??
        (options.body ? JSON.stringify(options.body) : undefined),
      cache: "no-store",
    });

    const responseBody = await parseResponseBody(response);

    if (!response.ok) {
      throw new Error(
        `Cognee request failed (${response.status} ${response.statusText}) for ${path}: ${stringifyErrorBody(
          responseBody,
        )}`,
      );
    }

    return responseBody as T;
  }

  private headers(formData?: FormData): HeadersInit {
    return {
      ...(formData ? {} : { "Content-Type": "application/json" }),
      "X-Api-Key": this.apiKey,
    };
  }
}

export function getCogneeClient(): CogneeClient {
  if (!cogneeClient) {
    cogneeClient = new CogneeClient(readRequiredEnv());
  }

  return cogneeClient;
}

const legacyStub: MemoryNode[] = [];

function legacyBaseUrl() {
  return (
    process.env.COGNEE_BASE_URL?.trim() || process.env.COGNEE_API_URL?.trim()
  );
}

function legacyHeaders(): HeadersInit {
  const key = process.env.COGNEE_API_KEY?.trim();

  return {
    "Content-Type": "application/json",
    ...(key ? { "X-Api-Key": key } : {}),
  };
}

/** Add content to the user's memory graph. Retained for existing memory routes. */
export async function addMemory(
  userId: string,
  content: string,
  kind: MemoryNode["kind"] = "note",
  source?: string,
): Promise<MemoryNode> {
  const node: MemoryNode = {
    id: uid("mem"),
    userId,
    content,
    kind,
    source,
    createdAt: nowISO(),
  };

  const baseUrl = legacyBaseUrl();
  if (!baseUrl) {
    legacyStub.push(node);
    return node;
  }

  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/add`, {
    method: "POST",
    headers: legacyHeaders(),
    body: JSON.stringify({ userId, content, kind, source }),
  });

  if (!res.ok) throw new Error(`Cognee add failed: ${res.status}`);
  return (await res.json()) as MemoryNode;
}

/** Trigger Cognee to build/refresh the knowledge graph. Retained for existing memory routes. */
export async function cognify(userId: string): Promise<void> {
  const baseUrl = legacyBaseUrl();
  if (!baseUrl) return;

  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/cognify`, {
    method: "POST",
    headers: legacyHeaders(),
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) throw new Error(`Cognee cognify failed: ${res.status}`);
}

/** Semantic search over the user's memory graph. Retained for existing memory routes. */
export async function searchMemory(
  userId: string,
  q: string,
): Promise<MemoryQueryResult> {
  const baseUrl = legacyBaseUrl();
  if (!baseUrl) {
    const nodes = legacyStub.filter(
      (node) =>
        node.userId === userId &&
        node.content.toLowerCase().includes(q.toLowerCase()),
    );
    return { nodes };
  }

  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/search`, {
    method: "POST",
    headers: legacyHeaders(),
    body: JSON.stringify({ userId, query: q }),
  });

  if (!res.ok) throw new Error(`Cognee search failed: ${res.status}`);
  return (await res.json()) as MemoryQueryResult;
}

/** List all memory nodes for a user. Retained for existing memory routes. */
export async function listMemory(userId: string): Promise<MemoryNode[]> {
  const baseUrl = legacyBaseUrl();
  if (!baseUrl) return legacyStub.filter((node) => node.userId === userId);

  const res = await fetch(
    `${baseUrl.replace(/\/+$/, "")}/list?userId=${encodeURIComponent(userId)}`,
    {
      headers: legacyHeaders(),
    },
  );

  if (!res.ok) throw new Error(`Cognee list failed: ${res.status}`);
  return (await res.json()) as MemoryNode[];
}
