import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const sessions = await prisma.deepgramSession.findMany();
  console.log("SESSIONS IN DB:", sessions);
  process.exit(0);
}
main().catch(console.error);
