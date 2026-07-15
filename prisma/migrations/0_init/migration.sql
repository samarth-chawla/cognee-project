-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'ONGOING', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('VOICE', 'TEXT', 'HYBRID');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "JobFailureReason" AS ENUM ('RATE_LIMITED', 'SERVICE_UNAVAILABLE', 'NETWORK_ERROR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PipelineFailureReason" AS ENUM ('NONE', 'RATE_LIMITED', 'TIMEOUT', 'NETWORK_ERROR', 'SERVICE_UNAVAILABLE', 'DATABASE_ERROR', 'AUTH_ERROR', 'PROVIDER_ERROR', 'INVALID_INPUT', 'UNKNOWN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experience" TEXT,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "targetRole" TEXT,
    "preferredInterviewMode" "InterviewMode" NOT NULL DEFAULT 'VOICE',
    "preferredDifficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "targetCompanies" TEXT[],
    "interviewTypes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storedFileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "rawText" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDescription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "rawText" TEXT,
    "parsedSkills" TEXT[],
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT,
    "jobDescriptionId" TEXT,
    "company" TEXT,
    "companyType" TEXT,
    "customCompanyName" TEXT,
    "role" TEXT NOT NULL,
    "interviewType" TEXT,
    "difficulty" "Difficulty",
    "status" "InterviewStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "questions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "technicalScore" DOUBLE PRECISION NOT NULL,
    "communicationScore" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "behavioralScore" DOUBLE PRECISION NOT NULL,
    "problemSolvingScore" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "missingTopics" TEXT[],
    "recommendations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewAnalytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalInterviews" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "readinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountDeletionLog" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'clerk-webhook',
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountDeletionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportGenerationJob" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" "JobFailureReason",
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewPipelineUsage" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pipelineStatus" "PipelineStatus" NOT NULL DEFAULT 'PENDING',
    "pipelineStartedAt" TIMESTAMP(3),
    "pipelineCompletedAt" TIMESTAMP(3),
    "totalPipelineDurationMs" INTEGER NOT NULL DEFAULT 0,
    "totalPipelineCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pricingVersion" TEXT NOT NULL DEFAULT '',
    "pipelineVersion" TEXT NOT NULL DEFAULT '',
    "isFirstInterview" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT,
    "company" TEXT,
    "difficulty" TEXT,
    "interviewMode" TEXT,
    "reportScore" DOUBLE PRECISION,
    "resumeParsingStatus" "PipelineStatus" NOT NULL DEFAULT 'PENDING',
    "resumeParsingFailureReason" "PipelineFailureReason" NOT NULL DEFAULT 'NONE',
    "resumeParsingLastError" TEXT,
    "resumeParsingAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "resumeParsingRetryCount" INTEGER NOT NULL DEFAULT 0,
    "resumeParsingStartedAt" TIMESTAMP(3),
    "resumeParsingCompletedAt" TIMESTAMP(3),
    "resumeParsingDurationMs" INTEGER NOT NULL DEFAULT 0,
    "resumeParsingProvider" TEXT NOT NULL DEFAULT 'System',
    "questionGenerationStatus" "PipelineStatus" NOT NULL DEFAULT 'PENDING',
    "questionGenerationFailureReason" "PipelineFailureReason" NOT NULL DEFAULT 'NONE',
    "questionGenerationLastError" TEXT,
    "questionGenerationAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "questionGenerationRetryCount" INTEGER NOT NULL DEFAULT 0,
    "questionGenerationStartedAt" TIMESTAMP(3),
    "questionGenerationCompletedAt" TIMESTAMP(3),
    "questionGenerationDurationMs" INTEGER NOT NULL DEFAULT 0,
    "questionGenerationProvider" TEXT NOT NULL DEFAULT 'Gemini',
    "geminiModel" TEXT,
    "geminiInputTokens" INTEGER NOT NULL DEFAULT 0,
    "geminiOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "geminiTotalTokens" INTEGER NOT NULL DEFAULT 0,
    "geminiInputCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "geminiOutputCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "geminiTotalCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "deepgramStatus" "PipelineStatus" NOT NULL DEFAULT 'PENDING',
    "deepgramFailureReason" "PipelineFailureReason" NOT NULL DEFAULT 'NONE',
    "deepgramLastError" TEXT,
    "deepgramAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "deepgramRetryCount" INTEGER NOT NULL DEFAULT 0,
    "deepgramStartedAt" TIMESTAMP(3),
    "deepgramCompletedAt" TIMESTAMP(3),
    "deepgramDurationMs" INTEGER NOT NULL DEFAULT 0,
    "deepgramProvider" TEXT NOT NULL DEFAULT 'Deepgram',
    "deepgramModel" TEXT,
    "deepgramAudioSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deepgramCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "reportGenerationStatus" "PipelineStatus" NOT NULL DEFAULT 'PENDING',
    "reportGenerationFailureReason" "PipelineFailureReason" NOT NULL DEFAULT 'NONE',
    "reportGenerationLastError" TEXT,
    "reportGenerationAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "reportGenerationRetryCount" INTEGER NOT NULL DEFAULT 0,
    "reportGenerationStartedAt" TIMESTAMP(3),
    "reportGenerationCompletedAt" TIMESTAMP(3),
    "reportGenerationDurationMs" INTEGER NOT NULL DEFAULT 0,
    "reportGenerationProvider" TEXT NOT NULL DEFAULT 'Gemini',
    "reportGeminiModel" TEXT,
    "reportInputTokens" INTEGER NOT NULL DEFAULT 0,
    "reportOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "reportTotalTokens" INTEGER NOT NULL DEFAULT 0,
    "reportSizeBytes" INTEGER NOT NULL DEFAULT 0,
    "reportInputCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "reportOutputCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "reportTotalCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "cogneeSaveStatus" "PipelineStatus" NOT NULL DEFAULT 'PENDING',
    "cogneeSaveFailureReason" "PipelineFailureReason" NOT NULL DEFAULT 'NONE',
    "cogneeSaveLastError" TEXT,
    "cogneeSaveAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "cogneeSaveRetryCount" INTEGER NOT NULL DEFAULT 0,
    "cogneeSaveStartedAt" TIMESTAMP(3),
    "cogneeSaveCompletedAt" TIMESTAMP(3),
    "cogneeSaveDurationMs" INTEGER NOT NULL DEFAULT 0,
    "cogneeProvider" TEXT NOT NULL DEFAULT 'Cognee',
    "cogneeNodesCreated" INTEGER NOT NULL DEFAULT 0,
    "cogneeEdgesCreated" INTEGER NOT NULL DEFAULT 0,
    "cogneeSaveCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "cogneeRetrievalStatus" "PipelineStatus" NOT NULL DEFAULT 'PENDING',
    "cogneeRetrievalFailureReason" "PipelineFailureReason" NOT NULL DEFAULT 'NONE',
    "cogneeRetrievalLastError" TEXT,
    "cogneeRetrievalAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "cogneeRetrievalRetryCount" INTEGER NOT NULL DEFAULT 0,
    "cogneeRetrievalStartedAt" TIMESTAMP(3),
    "cogneeRetrievalCompletedAt" TIMESTAMP(3),
    "cogneeRetrievalDurationMs" INTEGER NOT NULL DEFAULT 0,
    "cogneeRetrievedNodes" INTEGER NOT NULL DEFAULT 0,
    "cogneeRetrievedEdges" INTEGER NOT NULL DEFAULT 0,
    "cogneeRetrievalCostUsd" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewPipelineUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_targetRole_idx" ON "UserProfile"("targetRole");

-- CreateIndex
CREATE INDEX "Resume_userId_idx" ON "Resume"("userId");

-- CreateIndex
CREATE INDEX "Resume_storedFileName_idx" ON "Resume"("storedFileName");

-- CreateIndex
CREATE INDEX "Resume_uploadedAt_idx" ON "Resume"("uploadedAt");

-- CreateIndex
CREATE INDEX "JobDescription_userId_idx" ON "JobDescription"("userId");

-- CreateIndex
CREATE INDEX "JobDescription_company_idx" ON "JobDescription"("company");

-- CreateIndex
CREATE INDEX "JobDescription_title_idx" ON "JobDescription"("title");

-- CreateIndex
CREATE INDEX "JobDescription_uploadedAt_idx" ON "JobDescription"("uploadedAt");

-- CreateIndex
CREATE INDEX "Interview_userId_idx" ON "Interview"("userId");

-- CreateIndex
CREATE INDEX "Interview_userId_status_updatedAt_idx" ON "Interview"("userId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Interview_resumeId_idx" ON "Interview"("resumeId");

-- CreateIndex
CREATE INDEX "Interview_jobDescriptionId_idx" ON "Interview"("jobDescriptionId");

-- CreateIndex
CREATE INDEX "Interview_status_idx" ON "Interview"("status");

-- CreateIndex
CREATE INDEX "Interview_createdAt_idx" ON "Interview"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_interviewId_key" ON "Answer"("interviewId");

-- CreateIndex
CREATE INDEX "Answer_userId_idx" ON "Answer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_interviewId_key" ON "Report"("interviewId");

-- CreateIndex
CREATE INDEX "Report_overallScore_idx" ON "Report"("overallScore");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewAnalytics_userId_key" ON "InterviewAnalytics"("userId");

-- CreateIndex
CREATE INDEX "InterviewAnalytics_readinessScore_idx" ON "InterviewAnalytics"("readinessScore");

-- CreateIndex
CREATE INDEX "AccountDeletionLog_clerkId_idx" ON "AccountDeletionLog"("clerkId");

-- CreateIndex
CREATE INDEX "AccountDeletionLog_email_idx" ON "AccountDeletionLog"("email");

-- CreateIndex
CREATE INDEX "AccountDeletionLog_deletedAt_idx" ON "AccountDeletionLog"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReportGenerationJob_interviewId_key" ON "ReportGenerationJob"("interviewId");

-- CreateIndex
CREATE INDEX "ReportGenerationJob_status_nextRetryAt_idx" ON "ReportGenerationJob"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "ReportGenerationJob_userId_idx" ON "ReportGenerationJob"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewPipelineUsage_interviewId_key" ON "InterviewPipelineUsage"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewPipelineUsage_userId_idx" ON "InterviewPipelineUsage"("userId");

-- CreateIndex
CREATE INDEX "InterviewPipelineUsage_interviewId_idx" ON "InterviewPipelineUsage"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewPipelineUsage_createdAt_idx" ON "InterviewPipelineUsage"("createdAt");

-- CreateIndex
CREATE INDEX "InterviewPipelineUsage_pipelineStatus_idx" ON "InterviewPipelineUsage"("pipelineStatus");

-- CreateIndex
CREATE INDEX "InterviewPipelineUsage_questionGenerationStatus_idx" ON "InterviewPipelineUsage"("questionGenerationStatus");

-- CreateIndex
CREATE INDEX "InterviewPipelineUsage_reportGenerationStatus_idx" ON "InterviewPipelineUsage"("reportGenerationStatus");

-- CreateIndex
CREATE INDEX "InterviewPipelineUsage_deepgramStatus_idx" ON "InterviewPipelineUsage"("deepgramStatus");

-- CreateIndex
CREATE INDEX "InterviewPipelineUsage_cogneeSaveStatus_idx" ON "InterviewPipelineUsage"("cogneeSaveStatus");

-- CreateIndex
CREATE INDEX "InterviewPipelineUsage_cogneeRetrievalStatus_idx" ON "InterviewPipelineUsage"("cogneeRetrievalStatus");

-- CreateIndex
CREATE INDEX "InterviewPipelineUsage_isFirstInterview_idx" ON "InterviewPipelineUsage"("isFirstInterview");

-- CreateIndex
CREATE INDEX "InterviewPipelineUsage_userId_createdAt_idx" ON "InterviewPipelineUsage"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAnalytics" ADD CONSTRAINT "InterviewAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportGenerationJob" ADD CONSTRAINT "ReportGenerationJob_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPipelineUsage" ADD CONSTRAINT "InterviewPipelineUsage_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
