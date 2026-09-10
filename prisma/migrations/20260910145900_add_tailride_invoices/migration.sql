-- CreateTable
CREATE TABLE "tailride_invoices" (
    "id" TEXT NOT NULL,
    "tailrideId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "documentType" TEXT,
    "amount" TEXT,
    "currency" TEXT,
    "merchant" TEXT,
    "occurredAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'received',
    "payload" JSONB NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tailride_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tailride_invoices_tailrideId_key" ON "tailride_invoices"("tailrideId");

-- CreateIndex
CREATE INDEX "tailride_invoices_userId_idx" ON "tailride_invoices"("userId");

-- CreateIndex
CREATE INDEX "tailride_invoices_status_idx" ON "tailride_invoices"("status");

-- AddForeignKey
ALTER TABLE "tailride_invoices" ADD CONSTRAINT "tailride_invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
