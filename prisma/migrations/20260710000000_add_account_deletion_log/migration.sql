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

-- CreateIndex
CREATE INDEX "AccountDeletionLog_clerkId_idx" ON "AccountDeletionLog"("clerkId");

-- CreateIndex
CREATE INDEX "AccountDeletionLog_email_idx" ON "AccountDeletionLog"("email");

-- CreateIndex
CREATE INDEX "AccountDeletionLog_deletedAt_idx" ON "AccountDeletionLog"("deletedAt");
