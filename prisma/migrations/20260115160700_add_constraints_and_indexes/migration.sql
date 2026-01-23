-- Migration: Add CHECK constraints and performance indexes
-- Safe migration - constraints use NOT VALID to skip existing data validation
-- Does NOT modify existing data or break current functionality
-- Uses camelCase column names (Prisma default)

-- ============================================================
-- PART 1: CHECK CONSTRAINTS (Data Integrity)
-- Using NOT VALID to avoid validating existing rows
-- ============================================================

-- Contract constraints
ALTER TABLE contracts
  ADD CONSTRAINT chk_contracts_monthly_fee_positive
  CHECK ("monthlyFee" >= 0) NOT VALID;

ALTER TABLE contracts
  ADD CONSTRAINT chk_contracts_deposit_positive
  CHECK ("depositAmount" >= 0) NOT VALID;

ALTER TABLE contracts
  ADD CONSTRAINT chk_contracts_vat_rate_valid
  CHECK ("vatRate" >= 0 AND "vatRate" <= 100) NOT VALID;

ALTER TABLE contracts
  ADD CONSTRAINT chk_contracts_dates_valid
  CHECK ("endDate" >= "startDate") NOT VALID;

-- Contract items constraints
ALTER TABLE contract_items
  ADD CONSTRAINT chk_contract_items_quantity_positive
  CHECK (quantity > 0) NOT VALID;

ALTER TABLE contract_items
  ADD CONSTRAINT chk_contract_items_unit_price_positive
  CHECK ("unitPrice" >= 0) NOT VALID;

-- Invoice constraints
ALTER TABLE invoices
  ADD CONSTRAINT chk_invoices_amounts_positive
  CHECK (subtotal >= 0 AND "totalAmount" >= 0) NOT VALID;

ALTER TABLE invoices
  ADD CONSTRAINT chk_invoices_vat_valid
  CHECK ("vatRate" >= 0 AND "vatRate" <= 100) NOT VALID;

ALTER TABLE invoices
  ADD CONSTRAINT chk_invoices_due_after_issue
  CHECK ("dueDate" >= "issueDate") NOT VALID;

-- Invoice items constraints
ALTER TABLE invoice_items
  ADD CONSTRAINT chk_invoice_items_quantity_positive
  CHECK (quantity > 0) NOT VALID;

ALTER TABLE invoice_items
  ADD CONSTRAINT chk_invoice_items_prices_positive
  CHECK ("unitPrice" >= 0 AND "totalPrice" >= 0) NOT VALID;

-- Payment constraints
ALTER TABLE payments
  ADD CONSTRAINT chk_payments_amount_positive
  CHECK (amount > 0) NOT VALID;

-- Quotation constraints
ALTER TABLE quotations
  ADD CONSTRAINT chk_quotations_amounts_positive
  CHECK (subtotal >= 0 AND "totalAmount" >= 0) NOT VALID;

ALTER TABLE quotations
  ADD CONSTRAINT chk_quotations_validity
  CHECK ("validUntil" >= "validFrom") NOT VALID;

-- Quotation items constraints
ALTER TABLE quotation_items
  ADD CONSTRAINT chk_quotation_items_quantity_positive
  CHECK (quantity > 0) NOT VALID;

-- Monthly statements constraints
ALTER TABLE monthly_statements
  ADD CONSTRAINT chk_statements_amounts_positive
  CHECK (subtotal >= 0 AND total >= 0) NOT VALID;

ALTER TABLE monthly_statements
  ADD CONSTRAINT chk_statements_period_valid
  CHECK ("periodEnd" >= "periodStart") NOT VALID;

ALTER TABLE monthly_statements
  ADD CONSTRAINT chk_statements_month_valid
  CHECK (month >= 1 AND month <= 12) NOT VALID;

-- Customer plants constraints
ALTER TABLE customer_plants
  ADD CONSTRAINT chk_customer_plants_quantity_positive
  CHECK (quantity > 0) NOT VALID;

ALTER TABLE customer_plants
  ADD CONSTRAINT chk_customer_plants_health_score
  CHECK ("healthScore" IS NULL OR ("healthScore" >= 1 AND "healthScore" <= 10)) NOT VALID;

-- Exchange request constraints
ALTER TABLE exchange_requests
  ADD CONSTRAINT chk_exchange_requests_quantity_positive
  CHECK (quantity > 0) NOT VALID;

ALTER TABLE exchange_requests
  ADD CONSTRAINT chk_exchange_requests_priority_score
  CHECK ("priorityScore" >= 1 AND "priorityScore" <= 10) NOT VALID;

-- Plant type constraints
ALTER TABLE plant_types
  ADD CONSTRAINT chk_plant_types_rental_price_positive
  CHECK ("rentalPrice" >= 0) NOT VALID;

-- Inventory constraints
ALTER TABLE inventory
  ADD CONSTRAINT chk_inventory_stocks_non_negative
  CHECK ("totalStock" >= 0 AND "availableStock" >= 0 AND "rentedStock" >= 0) NOT VALID;

-- Care schedule constraints
ALTER TABLE care_schedules
  ADD CONSTRAINT chk_care_schedules_duration_positive
  CHECK ("estimatedDurationMins" > 0) NOT VALID;

ALTER TABLE care_schedules
  ADD CONSTRAINT chk_care_schedules_satisfaction
  CHECK ("satisfactionRating" IS NULL OR ("satisfactionRating" >= 1 AND "satisfactionRating" <= 5)) NOT VALID;

-- Sticky notes constraints
ALTER TABLE sticky_notes
  ADD CONSTRAINT chk_sticky_notes_priority
  CHECK (priority >= 1 AND priority <= 10) NOT VALID;

-- ============================================================
-- PART 2: TRIGRAM INDEXES (Search Performance)
-- Requires pg_trgm extension (already enabled in schema)
-- ============================================================

-- Customer name search (Vietnamese with diacritics removed)
CREATE INDEX IF NOT EXISTS idx_customers_company_name_norm_trgm
  ON customers USING gin ("companyNameNorm" gin_trgm_ops);

-- Plant type name search
CREATE INDEX IF NOT EXISTS idx_plant_types_name_normalized_trgm
  ON plant_types USING gin ("nameNormalized" gin_trgm_ops);

-- Customer address search
CREATE INDEX IF NOT EXISTS idx_customers_address_normalized_trgm
  ON customers USING gin ("addressNormalized" gin_trgm_ops);

-- ============================================================
-- PART 3: GIN INDEXES FOR JSONB (Query Performance)
-- ============================================================

-- Monthly statements plants data
CREATE INDEX IF NOT EXISTS idx_monthly_statements_plants_gin
  ON monthly_statements USING gin (plants);

-- Scheduled exchanges plants data
CREATE INDEX IF NOT EXISTS idx_scheduled_exchanges_plants_data_gin
  ON scheduled_exchanges USING gin ("plantsData");

-- Exchange history plants
CREATE INDEX IF NOT EXISTS idx_exchange_history_plants_removed_gin
  ON exchange_history USING gin ("plantsRemoved");

CREATE INDEX IF NOT EXISTS idx_exchange_history_plants_installed_gin
  ON exchange_history USING gin ("plantsInstalled");

-- Sticky notes AI analysis
CREATE INDEX IF NOT EXISTS idx_sticky_notes_ai_analysis_gin
  ON sticky_notes USING gin ("aiAnalysis");

-- Sticky notes tags
CREATE INDEX IF NOT EXISTS idx_sticky_notes_tags_gin
  ON sticky_notes USING gin (tags);

-- Care schedule photo urls
CREATE INDEX IF NOT EXISTS idx_care_schedules_photo_urls_gin
  ON care_schedules USING gin ("photoUrls");

-- Daily schedule route order
CREATE INDEX IF NOT EXISTS idx_daily_schedules_route_order_gin
  ON daily_schedules USING gin ("routeOrder");

-- ============================================================
-- PART 4: PARTIAL INDEXES (Common Filter Optimization)
-- ============================================================

-- Active customers only
CREATE INDEX IF NOT EXISTS idx_customers_status_active
  ON customers (status) WHERE status IN ('ACTIVE', 'LEAD');

-- Active contracts only
CREATE INDEX IF NOT EXISTS idx_contracts_status_active
  ON contracts (status) WHERE status = 'ACTIVE';

-- Unpaid invoices
CREATE INDEX IF NOT EXISTS idx_invoices_status_unpaid
  ON invoices (status, "dueDate") WHERE status IN ('SENT', 'PARTIAL', 'OVERDUE');

-- Pending exchange requests
CREATE INDEX IF NOT EXISTS idx_exchange_requests_status_pending
  ON exchange_requests (status, priority) WHERE status IN ('PENDING', 'SCHEDULED');

-- Open sticky notes
CREATE INDEX IF NOT EXISTS idx_sticky_notes_status_open
  ON sticky_notes (status, priority) WHERE status IN ('OPEN', 'IN_PROGRESS');

-- Active plant types
CREATE INDEX IF NOT EXISTS idx_plant_types_is_active
  ON plant_types ("isActive") WHERE "isActive" = true;

-- Unconfirmed monthly statements
CREATE INDEX IF NOT EXISTS idx_monthly_statements_needs_confirmation
  ON monthly_statements ("needsConfirmation", year, month) WHERE "needsConfirmation" = true;
