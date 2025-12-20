-- CreateTable
CREATE TABLE "monthly_statements" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "contactName" TEXT,
    "plants" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(12,0) NOT NULL,
    "vatRate" DECIMAL(4,2) NOT NULL DEFAULT 8,
    "vatAmount" DECIMAL(12,0) NOT NULL,
    "total" DECIMAL(12,0) NOT NULL,
    "needsConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "copiedFromId" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_statements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_statements_customerId_idx" ON "monthly_statements"("customerId");

-- CreateIndex
CREATE INDEX "monthly_statements_year_month_idx" ON "monthly_statements"("year", "month");

-- CreateIndex
CREATE INDEX "monthly_statements_needsConfirmation_idx" ON "monthly_statements"("needsConfirmation");

-- CreateIndex
CREATE INDEX "monthly_statements_periodStart_idx" ON "monthly_statements"("periodStart");

-- CreateIndex
CREATE INDEX "monthly_statements_periodEnd_idx" ON "monthly_statements"("periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_statements_customerId_year_month_key" ON "monthly_statements"("customerId", "year", "month");

-- AddForeignKey
ALTER TABLE "monthly_statements" ADD CONSTRAINT "monthly_statements_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_statements" ADD CONSTRAINT "monthly_statements_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
