-- Resume upload now stores original PDF metadata plus raw extracted text only.

ALTER TABLE "Resume"
  ADD COLUMN "originalFileName" TEXT NOT NULL DEFAULT 'resume.pdf',
  ADD COLUMN "storedFileName" TEXT NOT NULL DEFAULT 'resume.pdf',
  ADD COLUMN "fileSize" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
  ADD COLUMN "pageCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "rawText" TEXT NOT NULL DEFAULT '';

UPDATE "Resume"
SET
  "storedFileName" = COALESCE(NULLIF(regexp_replace("fileUrl", '^.*/', ''), ''), 'resume.pdf'),
  "originalFileName" = COALESCE(NULLIF(regexp_replace("fileUrl", '^.*/', ''), ''), 'resume.pdf'),
  "rawText" = COALESCE("parsedText", '');

ALTER TABLE "Resume"
  ALTER COLUMN "originalFileName" DROP DEFAULT,
  ALTER COLUMN "storedFileName" DROP DEFAULT,
  ALTER COLUMN "fileSize" DROP DEFAULT,
  ALTER COLUMN "mimeType" DROP DEFAULT,
  ALTER COLUMN "pageCount" DROP DEFAULT,
  ALTER COLUMN "rawText" DROP DEFAULT,
  DROP COLUMN "parsedText",
  DROP COLUMN "extractedSkills",
  DROP COLUMN "extractedProjects";

CREATE INDEX "Resume_storedFileName_idx" ON "Resume"("storedFileName");
