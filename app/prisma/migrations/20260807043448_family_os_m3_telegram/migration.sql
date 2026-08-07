-- CreateTable
CREATE TABLE "TelegramChat" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "linkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramLinkCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramLinkCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramChat_chatId_key" ON "TelegramChat"("chatId");

-- CreateIndex
CREATE INDEX "TelegramChat_userId_idx" ON "TelegramChat"("userId");

-- CreateIndex
CREATE INDEX "TelegramChat_tenantId_idx" ON "TelegramChat"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramLinkCode_code_key" ON "TelegramLinkCode"("code");

-- CreateIndex
CREATE INDEX "TelegramLinkCode_userId_idx" ON "TelegramLinkCode"("userId");

-- AddForeignKey
ALTER TABLE "TelegramChat" ADD CONSTRAINT "TelegramChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramLinkCode" ADD CONSTRAINT "TelegramLinkCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
