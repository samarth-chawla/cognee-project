/**
 * Prisma adapter boundary. Install `prisma` and `@prisma/client`, then replace
 * this guard with a generated PrismaClient singleton when Prisma is enabled.
 */
export function getPrisma(): never {
  throw new Error("Prisma client is not installed; use the Neon adapter for now");
}
