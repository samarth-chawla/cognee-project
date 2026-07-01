import { prisma } from "./prisma";

export type DatabaseHealth = {
  ok: boolean;
  latencyMs: number;
  checkedAt: Date;
  error?: string;
};

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startedAt = performance.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      latencyMs: Math.round(performance.now() - startedAt),
      checkedAt: new Date(),
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - startedAt),
      checkedAt: new Date(),
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}
