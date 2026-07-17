import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const sessions = await prisma.deepgramSession.findMany({ where: { pipelineUsageId: null } });
  for(const s of sessions) {
    const u = await prisma.interviewPipelineUsage.findUnique({ where: { interviewId: s.interviewId } });
    if(u) {
      await prisma.deepgramSession.update({ where: { id: s.id }, data: { pipelineUsageId: u.id } });
      console.log('Fixed', s.id);
    }
  }
}
main().catch(console.log).finally(()=>prisma.$disconnect());
