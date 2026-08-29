-- CreateTable
CREATE TABLE "web_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "web_accounts_userId_key" ON "web_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "web_accounts_email_key" ON "web_accounts"("email");

-- CreateIndex
CREATE INDEX "web_accounts_userId_idx" ON "web_accounts"("userId");
