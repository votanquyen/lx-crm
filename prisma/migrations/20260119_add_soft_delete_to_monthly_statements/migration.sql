-- AlterTable
ALTER TABLE "monthly_statements" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" TEXT;

-- CreateIndex
CREATE INDEX "monthly_statements_deletedAt_idx" ON "monthly_statements"("deletedAt");

-- CreateIndex
CREATE INDEX "monthly_statements_customerId_year_month_deletedAt_idx" ON "monthly_statements"("customerId", "year", "month", "deletedAt");

-- AddForeignKey
ALTER TABLE "monthly_statements" ADD CONSTRAINT "monthly_statements_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
