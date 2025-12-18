-- Enable PostgreSQL extensions for Lộc Xanh V4
-- PostGIS for spatial queries (customer locations, map)
CREATE EXTENSION IF NOT EXISTS postgis;

-- pg_trgm for Vietnamese fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent for removing Vietnamese diacritics in search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create normalized Vietnamese text function
CREATE OR REPLACE FUNCTION normalize_vietnamese(text) RETURNS text AS $$
  SELECT lower(unaccent($1));
$$ LANGUAGE SQL IMMUTABLE;
