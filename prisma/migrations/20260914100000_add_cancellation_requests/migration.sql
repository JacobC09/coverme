CREATE TABLE "CancellationRequest" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancellationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CancellationRequest_shiftId_key" ON "CancellationRequest"("shiftId");
CREATE INDEX "CancellationRequest_requesterId_idx" ON "CancellationRequest"("requesterId");
CREATE INDEX "CancellationRequest_approverId_idx" ON "CancellationRequest"("approverId");
CREATE INDEX "CancellationRequest_createdAt_idx" ON "CancellationRequest"("createdAt");

ALTER TABLE "CancellationRequest"
ADD CONSTRAINT "CancellationRequest_shiftId_fkey"
FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CancellationRequest"
ADD CONSTRAINT "CancellationRequest_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CancellationRequest"
ADD CONSTRAINT "CancellationRequest_approverId_fkey"
FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
