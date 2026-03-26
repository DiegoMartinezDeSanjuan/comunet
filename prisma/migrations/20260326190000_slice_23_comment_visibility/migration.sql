-- Slice 2.3
-- Normalize incident comment visibility from PUBLIC to SHARED.
-- Existing PUBLIC rows become SHARED and the default moves to INTERNAL,
-- which is already the domain default used by the incident comment service.

ALTER TYPE "CommentVisibility" RENAME VALUE 'PUBLIC' TO 'SHARED';
ALTER TABLE "incident_comments"
  ALTER COLUMN "visibility" SET DEFAULT 'INTERNAL';
