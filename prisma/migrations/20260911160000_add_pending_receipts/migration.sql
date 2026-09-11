-- CreateTable
CREATE TABLE "pending_receipts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "merchant" TEXT,
    "rawText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_receipts_userId_status_idx"
ON "pending_receipts"("userId", "status");

-- CreateIndex
CREATE INDEX "pending_receipts_userId_createdAt_idx"
ON "pending_receipts"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "pending_receipts"
ADD CONSTRAINT "pending_receipts_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
