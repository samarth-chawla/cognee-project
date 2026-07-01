import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { clerkId: "demo_clerk_user_001" },
    update: {
      email: "demo@example.com",
      fullName: "Demo Candidate",
    },
    create: {
      clerkId: "demo_clerk_user_001",
      email: "demo@example.com",
      fullName: "Demo Candidate",
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      currentRole: "Frontend Engineer",
      experience: "3 years",
      githubUrl: "https://github.com/demo-candidate",
      linkedinUrl: "https://www.linkedin.com/in/demo-candidate",
      targetRole: "Full Stack Engineer",
      preferredInterviewMode: "VOICE",
      preferredDifficulty: "MEDIUM",
      targetCompanies: ["Neon", "Vercel", "OpenAI"],
      interviewTypes: ["technical", "behavioral"],
    },
    create: {
      userId: user.id,
      currentRole: "Frontend Engineer",
      experience: "3 years",
      githubUrl: "https://github.com/demo-candidate",
      linkedinUrl: "https://www.linkedin.com/in/demo-candidate",
      targetRole: "Full Stack Engineer",
      preferredInterviewMode: "VOICE",
      preferredDifficulty: "MEDIUM",
      targetCompanies: ["Neon", "Vercel", "OpenAI"],
      interviewTypes: ["technical", "behavioral"],
    },
  });

  const resume = await prisma.resume.upsert({
    where: { id: "demo_resume_001" },
    update: {
      userId: user.id,
      fileUrl: "https://example.com/demo-resume.pdf",
      parsedText: "Demo resume text for a full stack engineer.",
      extractedSkills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
      extractedProjects: [
        {
          name: "Interview Memory Agent",
          summary: "AI-assisted interview practice application.",
        },
      ],
    },
    create: {
      id: "demo_resume_001",
      userId: user.id,
      fileUrl: "https://example.com/demo-resume.pdf",
      parsedText: "Demo resume text for a full stack engineer.",
      extractedSkills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
      extractedProjects: [
        {
          name: "Interview Memory Agent",
          summary: "AI-assisted interview practice application.",
        },
      ],
    },
  });

  const jobDescription = await prisma.jobDescription.upsert({
    where: { id: "demo_job_description_001" },
    update: {
      userId: user.id,
      company: "Acme AI",
      title: "Full Stack Engineer",
      fileUrl: "https://example.com/demo-job-description.pdf",
      rawText: "Build AI-powered products with TypeScript and PostgreSQL.",
      parsedSkills: ["TypeScript", "Next.js", "PostgreSQL", "AI APIs"],
    },
    create: {
      id: "demo_job_description_001",
      userId: user.id,
      company: "Acme AI",
      title: "Full Stack Engineer",
      fileUrl: "https://example.com/demo-job-description.pdf",
      rawText: "Build AI-powered products with TypeScript and PostgreSQL.",
      parsedSkills: ["TypeScript", "Next.js", "PostgreSQL", "AI APIs"],
    },
  });

  await prisma.interviewAnalytics.upsert({
    where: { userId: user.id },
    update: {
      totalInterviews: 0,
      averageScore: 0,
      currentStreak: 0,
      readinessScore: 35,
    },
    create: {
      userId: user.id,
      totalInterviews: 0,
      averageScore: 0,
      currentStreak: 0,
      readinessScore: 35,
    },
  });

  await prisma.interview.upsert({
    where: { id: "demo_interview_001" },
    update: {
      userId: user.id,
      resumeId: resume.id,
      jobDescriptionId: jobDescription.id,
      company: jobDescription.company,
      role: jobDescription.title,
      status: "PENDING",
    },
    create: {
      id: "demo_interview_001",
      userId: user.id,
      resumeId: resume.id,
      jobDescriptionId: jobDescription.id,
      company: jobDescription.company,
      role: jobDescription.title,
      status: "PENDING",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
