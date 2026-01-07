-- Add Trigram Indexes for Vietnamese Fuzzy Search
-- Run this script directly on database since CONCURRENTLY cannot run in transaction
-- Usage: psql $DATABASE_URL -f scripts/add-trigram-indexes.sql

-- Ensure pg_trgm extension is installed
CREATE EXTENSION IF NOT EXISTS pg_trgm;

\echo 'Creating GIN index on customers.company_name_norm...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_company_name_trgm
  ON customers USING gin(company_name_norm gin_trgm_ops);

\echo 'Creating GIN index on customers.address_normalized...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_address_trgm
  ON customers USING gin(address_normalized gin_trgm_ops);

\echo 'Creating GIN index on plant_types.name_normalized...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plant_type_name_trgm
  ON plant_types USING gin(name_normalized gin_trgm_ops);

\echo 'Creating composite index on invoices for debt queries...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_customer_debt
  ON invoices(customer_id, status, outstanding_amount)
  WHERE status IN ('SENT', 'PARTIAL', 'OVERDUE') AND outstanding_amount > 0;

\echo 'Done! Verify with: \di+ *trgm*'
