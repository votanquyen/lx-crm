-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis" WITH VERSION "3.5.0";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF', 'VIEWER');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('LEAD', 'ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "CustomerTier" AS ENUM ('STANDARD', 'PREMIUM', 'VIP');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT', 'NEGOTIATING', 'SIGNED', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'CARD', 'MOMO', 'ZALOPAY', 'VNPAY');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "CareStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ExchangeStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExchangePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NoteCategory" AS ENUM ('GENERAL', 'URGENT', 'COMPLAINT', 'REQUEST', 'FEEDBACK', 'EXCHANGE', 'CARE', 'PAYMENT');

-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('LOCAL', 'MINIO', 'GDRIVE');

-- CreateEnum
CREATE TYPE "PlantStatus" AS ENUM ('ACTIVE', 'REMOVED', 'REPLACED');

-- CreateEnum
CREATE TYPE "PlantCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DEAD');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "googleId" TEXT,
    "staffCode" TEXT,
    "department" TEXT,
    "hireDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "plant_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT,
    "description" TEXT,
    "category" TEXT,
    "sizeSpec" TEXT,
    "heightMin" INTEGER,
    "heightMax" INTEGER,
    "potSize" TEXT,
    "potDiameter" INTEGER,
    "rentalPrice" DECIMAL(12,0) NOT NULL DEFAULT 50000,
    "depositPrice" DECIMAL(12,0),
    "salePrice" DECIMAL(12,0),
    "replacementPrice" DECIMAL(12,0),
    "avgLifespanDays" INTEGER NOT NULL DEFAULT 30,
    "wateringFrequency" TEXT,
    "lightRequirement" TEXT,
    "temperatureRange" TEXT,
    "careInstructions" TEXT,
    "careLevel" TEXT,
    "imageUrl" TEXT,
    "images" JSONB,
    "thumbnailUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plant_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "plantTypeId" TEXT NOT NULL,
    "totalStock" INTEGER NOT NULL DEFAULT 0,
    "availableStock" INTEGER NOT NULL DEFAULT 0,
    "rentedStock" INTEGER NOT NULL DEFAULT 0,
    "reservedStock" INTEGER NOT NULL DEFAULT 0,
    "damagedStock" INTEGER NOT NULL DEFAULT 0,
    "maintenanceStock" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "reorderPoint" INTEGER NOT NULL DEFAULT 20,
    "reorderQuantity" INTEGER NOT NULL DEFAULT 50,
    "warehouseLocation" TEXT,
    "shelfNumber" TEXT,
    "lastRestockDate" TIMESTAMP(3),
    "lastAuditDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyNameNorm" TEXT,
    "shortName" TEXT,
    "taxCode" TEXT,
    "businessType" TEXT,
    "address" TEXT NOT NULL,
    "addressNormalized" TEXT,
    "ward" TEXT,
    "district" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Hồ Chí Minh',
    "country" TEXT NOT NULL DEFAULT 'Việt Nam',
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "contactPosition" TEXT,
    "contact2Name" TEXT,
    "contact2Phone" TEXT,
    "contact2Email" TEXT,
    "contact2Position" TEXT,
    "accountingName" TEXT,
    "accountingPhone" TEXT,
    "accountingEmail" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'LEAD',
    "tier" "CustomerTier" NOT NULL DEFAULT 'STANDARD',
    "source" TEXT,
    "industry" TEXT,
    "careWeekday" INTEGER DEFAULT 1,
    "careTimeSlot" TEXT,
    "preferredStaffId" TEXT,
    "careFrequency" TEXT DEFAULT 'weekly',
    "requiresAppointment" BOOLEAN NOT NULL DEFAULT false,
    "buildingName" TEXT,
    "floorCount" INTEGER,
    "hasElevator" BOOLEAN NOT NULL DEFAULT true,
    "parkingNote" TEXT,
    "securityNote" TEXT,
    "accessInstructions" TEXT,
    "billingCycle" TEXT DEFAULT 'monthly',
    "paymentTermDays" INTEGER NOT NULL DEFAULT 30,
    "preferredPayment" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "notes" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstContractDate" TIMESTAMP(3),
    "lastCareDate" TIMESTAMP(3),
    "lastContactDate" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_plants" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "plantTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT,
    "floor" TEXT,
    "room" TEXT,
    "position" TEXT,
    "potType" TEXT,
    "potColor" TEXT,
    "hasSaucer" BOOLEAN NOT NULL DEFAULT true,
    "condition" "PlantCondition" NOT NULL DEFAULT 'GOOD',
    "conditionNotes" TEXT,
    "healthScore" INTEGER,
    "status" "PlantStatus" NOT NULL DEFAULT 'ACTIVE',
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastExchanged" TIMESTAMP(3),
    "nextExchange" TIMESTAMP(3),
    "lastInspected" TIMESTAMP(3),
    "notes" TEXT,
    "specialCareNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdById" TEXT,
    "contractType" TEXT NOT NULL DEFAULT 'rental',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "signedDate" TIMESTAMP(3),
    "terminatedDate" TIMESTAMP(3),
    "terminationReason" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "renewalTerms" TEXT,
    "renewalPeriod" INTEGER NOT NULL DEFAULT 12,
    "renewalReminder" INTEGER NOT NULL DEFAULT 30,
    "monthlyFee" DECIMAL(12,0) NOT NULL,
    "depositAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "setupFee" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(4,2) NOT NULL DEFAULT 10,
    "discountPercent" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "totalMonthlyAmount" DECIMAL(12,0),
    "totalContractValue" DECIMAL(14,0),
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "signingMethod" TEXT,
    "signedBy" TEXT,
    "signerPosition" TEXT,
    "witnessName" TEXT,
    "draftFileUrl" TEXT,
    "signedFileUrl" TEXT,
    "appendixUrls" JSONB,
    "gdriveFolderId" TEXT,
    "gdriveFileId" TEXT,
    "termsNotes" TEXT,
    "specialTerms" TEXT,
    "paymentTerms" TEXT,
    "deliveryTerms" TEXT,
    "warrantyTerms" TEXT,
    "previousContractId" TEXT,
    "quotationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_items" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "plantTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,0) NOT NULL,
    "discountRate" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(12,0) NOT NULL,
    "locationNote" TEXT,
    "careIncluded" BOOLEAN NOT NULL DEFAULT true,
    "exchangeIncluded" BOOLEAN NOT NULL DEFAULT true,
    "exchangeFrequency" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contractId" TEXT,
    "createdById" TEXT,
    "invoiceType" TEXT NOT NULL DEFAULT 'service',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "periodLabel" TEXT,
    "subtotal" DECIMAL(12,0) NOT NULL,
    "discountAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(4,2) NOT NULL DEFAULT 10,
    "vatAmount" DECIMAL(12,0) NOT NULL,
    "totalAmount" DECIMAL(12,0) NOT NULL,
    "paidAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "outstandingAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "sentDate" TIMESTAMP(3),
    "vatInvoiceNumber" TEXT,
    "vatInvoiceDate" TIMESTAMP(3),
    "vatInvoiceUrl" TEXT,
    "vatInvoiceSeries" TEXT,
    "vatInvoiceIssuer" TEXT,
    "pdfUrl" TEXT,
    "attachments" JSONB,
    "notes" TEXT,
    "paymentNotes" TEXT,
    "internalNote" TEXT,
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "lastReminderDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,0) NOT NULL,
    "totalPrice" DECIMAL(12,0) NOT NULL,
    "plantTypeCode" TEXT,
    "serviceType" TEXT,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,0) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "bankRef" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "receivedBy" TEXT,
    "receiptNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "notes" TEXT,
    "receiptUrl" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdById" TEXT,
    "title" TEXT,
    "description" TEXT,
    "subtotal" DECIMAL(12,0) NOT NULL,
    "discountRate" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(4,2) NOT NULL DEFAULT 10,
    "vatAmount" DECIMAL(12,0) NOT NULL,
    "totalAmount" DECIMAL(12,0) NOT NULL,
    "proposedStartDate" TIMESTAMP(3),
    "proposedDuration" INTEGER,
    "proposedMonthlyFee" DECIMAL(12,0),
    "proposedDeposit" DECIMAL(12,0),
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "customerResponse" TEXT,
    "responseDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "convertedToContractId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "notes" TEXT,
    "termsConditions" TEXT,
    "internalNotes" TEXT,
    "pdfUrl" TEXT,
    "attachments" JSONB,
    "followUpDate" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "plantTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,0) NOT NULL,
    "discountRate" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(12,0) NOT NULL,
    "locationNote" TEXT,
    "notes" TEXT,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_schedules" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "staffId" TEXT,
    "scheduledDate" DATE NOT NULL,
    "scheduledTime" TIME,
    "timeSlot" TEXT,
    "status" "CareStatus" NOT NULL DEFAULT 'SCHEDULED',
    "estimatedDurationMins" INTEGER NOT NULL DEFAULT 30,
    "actualDurationMins" INTEGER,
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "checkedInLat" DOUBLE PRECISION,
    "checkedInLng" DOUBLE PRECISION,
    "checkedOutLat" DOUBLE PRECISION,
    "checkedOutLng" DOUBLE PRECISION,
    "workNotes" TEXT,
    "issuesFound" TEXT,
    "actionsToken" TEXT,
    "plantCount" INTEGER,
    "plantAssessments" JSONB,
    "hasPendingRequests" BOOLEAN NOT NULL DEFAULT false,
    "pendingRequestsSummary" TEXT,
    "photoUrls" JSONB,
    "beforePhotos" JSONB,
    "afterPhotos" JSONB,
    "customerFeedback" TEXT,
    "satisfactionRating" INTEGER,
    "originalDate" TIMESTAMP(3),
    "rescheduleReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sticky_notes" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdById" TEXT,
    "assignedToId" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "category" "NoteCategory" NOT NULL DEFAULT 'GENERAL',
    "status" "NoteStatus" NOT NULL DEFAULT 'OPEN',
    "aiAnalysis" JSONB,
    "aiSuggestions" JSONB,
    "aiProcessedAt" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 5,
    "priorityReason" TEXT,
    "isAiPriority" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "sourceRef" TEXT,
    "callerName" TEXT,
    "callerPhone" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolution" TEXT,
    "linkedCareId" TEXT,
    "linkedExchangeId" TEXT,
    "linkedInvoiceId" TEXT,
    "linkedQuotationId" TEXT,
    "dueDate" TIMESTAMP(3),
    "reminderDate" TIMESTAMP(3),
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sticky_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_schedules" (
    "id" TEXT NOT NULL,
    "scheduleDate" DATE NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "totalStops" INTEGER NOT NULL DEFAULT 0,
    "totalPlants" INTEGER NOT NULL DEFAULT 0,
    "estimatedDurationMins" INTEGER,
    "estimatedDistanceKm" DECIMAL(6,2),
    "actualDurationMins" INTEGER,
    "routeOrder" JSONB,
    "isOptimized" BOOLEAN NOT NULL DEFAULT false,
    "optimizedAt" TIMESTAMP(3),
    "optimizationNotes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "googleSheetId" TEXT,
    "googleSheetUrl" TEXT,
    "scheduleImageUrl" TEXT,
    "pdfUrl" TEXT,
    "notes" TEXT,
    "briefingNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_requests" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requestNumber" TEXT,
    "plantLocation" TEXT,
    "currentPlant" TEXT,
    "currentCondition" TEXT,
    "requestedPlant" TEXT,
    "reason" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priority" "ExchangePriority" NOT NULL DEFAULT 'MEDIUM',
    "priorityScore" INTEGER NOT NULL DEFAULT 5,
    "priorityNote" TEXT,
    "status" "ExchangeStatus" NOT NULL DEFAULT 'PENDING',
    "preferredDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "scheduledRouteId" TEXT,
    "completedAt" TIMESTAMP(3),
    "completionNotes" TEXT,
    "beforePhotoUrls" JSONB,
    "afterPhotoUrls" JSONB,
    "source" TEXT,
    "sourceRefId" TEXT,
    "notes" TEXT,
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_exchanges" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "plantsData" JSONB NOT NULL DEFAULT '[]',
    "totalPlantCount" INTEGER NOT NULL DEFAULT 0,
    "plantsToRemove" INTEGER NOT NULL DEFAULT 0,
    "plantsToInstall" INTEGER NOT NULL DEFAULT 0,
    "scheduledTime" TIME,
    "estimatedArrival" TIME,
    "estimatedDurationMins" INTEGER NOT NULL DEFAULT 25,
    "status" "ExchangeStatus" NOT NULL DEFAULT 'PENDING',
    "arrivedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "customerVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationMethod" TEXT,
    "staffReport" JSONB,
    "skipReason" TEXT,
    "skipApprovedBy" TEXT,
    "photoUrls" JSONB,
    "beforePhotos" JSONB,
    "afterPhotos" JSONB,
    "signatureUrl" TEXT,
    "exchangeRequestId" TEXT,
    "notes" TEXT,
    "customerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_history" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "scheduledExchangeId" TEXT,
    "exchangeDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plantsRemoved" JSONB NOT NULL DEFAULT '[]',
    "plantsInstalled" JSONB NOT NULL DEFAULT '[]',
    "totalRemoved" INTEGER NOT NULL DEFAULT 0,
    "totalInstalled" INTEGER NOT NULL DEFAULT 0,
    "staffId" TEXT,
    "staffName" TEXT,
    "location" TEXT,
    "staffNotes" TEXT,
    "customerFeedback" TEXT,
    "satisfactionRating" INTEGER,
    "issuesReported" TEXT,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpNotes" TEXT,
    "photoUrls" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageType" "StorageType" NOT NULL DEFAULT 'MINIO',
    "storageKey" TEXT NOT NULL,
    "bucket" TEXT,
    "url" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedById" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isTemp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "templateCode" TEXT,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_staffCode_key" ON "users"("staffCode");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_staffCode_idx" ON "users"("staffCode");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "plant_types_code_key" ON "plant_types"("code");

-- CreateIndex
CREATE INDEX "plant_types_code_idx" ON "plant_types"("code");

-- CreateIndex
CREATE INDEX "plant_types_category_idx" ON "plant_types"("category");

-- CreateIndex
CREATE INDEX "plant_types_isActive_idx" ON "plant_types"("isActive");

-- CreateIndex
CREATE INDEX "plant_types_rentalPrice_idx" ON "plant_types"("rentalPrice");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_plantTypeId_key" ON "inventory"("plantTypeId");

-- CreateIndex
CREATE INDEX "inventory_plantTypeId_idx" ON "inventory"("plantTypeId");

-- CreateIndex
CREATE INDEX "inventory_availableStock_idx" ON "inventory"("availableStock");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_taxCode_key" ON "customers"("taxCode");

-- CreateIndex
CREATE INDEX "customers_code_idx" ON "customers"("code");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- CreateIndex
CREATE INDEX "customers_district_idx" ON "customers"("district");

-- CreateIndex
CREATE INDEX "customers_tier_idx" ON "customers"("tier");

-- CreateIndex
CREATE INDEX "customers_careWeekday_idx" ON "customers"("careWeekday");

-- CreateIndex
CREATE INDEX "customers_taxCode_idx" ON "customers"("taxCode");

-- CreateIndex
CREATE INDEX "customer_plants_customerId_idx" ON "customer_plants"("customerId");

-- CreateIndex
CREATE INDEX "customer_plants_plantTypeId_idx" ON "customer_plants"("plantTypeId");

-- CreateIndex
CREATE INDEX "customer_plants_status_idx" ON "customer_plants"("status");

-- CreateIndex
CREATE INDEX "customer_plants_condition_idx" ON "customer_plants"("condition");

-- CreateIndex
CREATE INDEX "customer_plants_nextExchange_idx" ON "customer_plants"("nextExchange");

-- CreateIndex
CREATE UNIQUE INDEX "customer_plants_customerId_plantTypeId_location_key" ON "customer_plants"("customerId", "plantTypeId", "location");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "contracts_contractNumber_idx" ON "contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "contracts_customerId_idx" ON "contracts"("customerId");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_endDate_idx" ON "contracts"("endDate");

-- CreateIndex
CREATE INDEX "contracts_startDate_idx" ON "contracts"("startDate");

-- CreateIndex
CREATE INDEX "contract_items_contractId_idx" ON "contract_items"("contractId");

-- CreateIndex
CREATE INDEX "contract_items_plantTypeId_idx" ON "contract_items"("plantTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_customerId_idx" ON "invoices"("customerId");

-- CreateIndex
CREATE INDEX "invoices_contractId_idx" ON "invoices"("contractId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

-- CreateIndex
CREATE INDEX "invoices_issueDate_idx" ON "invoices"("issueDate");

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_paymentDate_idx" ON "payments"("paymentDate");

-- CreateIndex
CREATE INDEX "payments_paymentMethod_idx" ON "payments"("paymentMethod");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quoteNumber_key" ON "quotations"("quoteNumber");

-- CreateIndex
CREATE INDEX "quotations_quoteNumber_idx" ON "quotations"("quoteNumber");

-- CreateIndex
CREATE INDEX "quotations_customerId_idx" ON "quotations"("customerId");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotations_validUntil_idx" ON "quotations"("validUntil");

-- CreateIndex
CREATE INDEX "quotation_items_quotationId_idx" ON "quotation_items"("quotationId");

-- CreateIndex
CREATE INDEX "quotation_items_plantTypeId_idx" ON "quotation_items"("plantTypeId");

-- CreateIndex
CREATE INDEX "care_schedules_scheduledDate_idx" ON "care_schedules"("scheduledDate");

-- CreateIndex
CREATE INDEX "care_schedules_staffId_idx" ON "care_schedules"("staffId");

-- CreateIndex
CREATE INDEX "care_schedules_customerId_idx" ON "care_schedules"("customerId");

-- CreateIndex
CREATE INDEX "care_schedules_status_idx" ON "care_schedules"("status");

-- CreateIndex
CREATE INDEX "sticky_notes_customerId_idx" ON "sticky_notes"("customerId");

-- CreateIndex
CREATE INDEX "sticky_notes_status_idx" ON "sticky_notes"("status");

-- CreateIndex
CREATE INDEX "sticky_notes_category_idx" ON "sticky_notes"("category");

-- CreateIndex
CREATE INDEX "sticky_notes_priority_idx" ON "sticky_notes"("priority");

-- CreateIndex
CREATE INDEX "sticky_notes_dueDate_idx" ON "sticky_notes"("dueDate");

-- CreateIndex
CREATE INDEX "sticky_notes_createdAt_idx" ON "sticky_notes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "daily_schedules_scheduleDate_key" ON "daily_schedules"("scheduleDate");

-- CreateIndex
CREATE INDEX "daily_schedules_scheduleDate_idx" ON "daily_schedules"("scheduleDate");

-- CreateIndex
CREATE INDEX "daily_schedules_status_idx" ON "daily_schedules"("status");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_requests_requestNumber_key" ON "exchange_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "exchange_requests_customerId_idx" ON "exchange_requests"("customerId");

-- CreateIndex
CREATE INDEX "exchange_requests_status_idx" ON "exchange_requests"("status");

-- CreateIndex
CREATE INDEX "exchange_requests_priority_idx" ON "exchange_requests"("priority");

-- CreateIndex
CREATE INDEX "exchange_requests_scheduledDate_idx" ON "exchange_requests"("scheduledDate");

-- CreateIndex
CREATE INDEX "scheduled_exchanges_scheduleId_idx" ON "scheduled_exchanges"("scheduleId");

-- CreateIndex
CREATE INDEX "scheduled_exchanges_customerId_idx" ON "scheduled_exchanges"("customerId");

-- CreateIndex
CREATE INDEX "scheduled_exchanges_status_idx" ON "scheduled_exchanges"("status");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_exchanges_scheduleId_stopOrder_key" ON "scheduled_exchanges"("scheduleId", "stopOrder");

-- CreateIndex
CREATE INDEX "exchange_history_customerId_idx" ON "exchange_history"("customerId");

-- CreateIndex
CREATE INDEX "exchange_history_exchangeDate_idx" ON "exchange_history"("exchangeDate");

-- CreateIndex
CREATE INDEX "exchange_history_staffId_idx" ON "exchange_history"("staffId");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "settings_category_idx" ON "settings"("category");

-- CreateIndex
CREATE INDEX "file_uploads_entityType_entityId_idx" ON "file_uploads"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "file_uploads_uploadedById_idx" ON "file_uploads"("uploadedById");

-- CreateIndex
CREATE INDEX "file_uploads_storageType_idx" ON "file_uploads"("storageType");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_code_key" ON "notification_templates"("code");

-- CreateIndex
CREATE INDEX "notification_templates_channel_idx" ON "notification_templates"("channel");

-- CreateIndex
CREATE INDEX "notification_templates_isActive_idx" ON "notification_templates"("isActive");

-- CreateIndex
CREATE INDEX "notification_logs_channel_status_idx" ON "notification_logs"("channel", "status");

-- CreateIndex
CREATE INDEX "notification_logs_entityType_entityId_idx" ON "notification_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "notification_logs_createdAt_idx" ON "notification_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "plant_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_preferredStaffId_fkey" FOREIGN KEY ("preferredStaffId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_plants" ADD CONSTRAINT "customer_plants_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_plants" ADD CONSTRAINT "customer_plants_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "plant_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_items" ADD CONSTRAINT "contract_items_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_items" ADD CONSTRAINT "contract_items_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "plant_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "plant_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_schedules" ADD CONSTRAINT "care_schedules_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_schedules" ADD CONSTRAINT "care_schedules_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sticky_notes" ADD CONSTRAINT "sticky_notes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sticky_notes" ADD CONSTRAINT "sticky_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sticky_notes" ADD CONSTRAINT "sticky_notes_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sticky_notes" ADD CONSTRAINT "sticky_notes_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_schedules" ADD CONSTRAINT "daily_schedules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_schedules" ADD CONSTRAINT "daily_schedules_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_requests" ADD CONSTRAINT "exchange_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_exchanges" ADD CONSTRAINT "scheduled_exchanges_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "daily_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_exchanges" ADD CONSTRAINT "scheduled_exchanges_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_history" ADD CONSTRAINT "exchange_history_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_history" ADD CONSTRAINT "exchange_history_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
