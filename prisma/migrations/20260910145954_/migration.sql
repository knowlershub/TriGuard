-- CreateTable
CREATE TABLE "tailride_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intakeTag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tailride_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tailride_connections_userId_key" ON "tailride_connections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tailride_connections_intakeTag_key" ON "tailride_connections"("intakeTag");

-- AddForeignKey
ALTER TABLE "tailride_connections" ADD CONSTRAINT "tailride_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
