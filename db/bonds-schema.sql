CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS bond_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_type TEXT NOT NULL DEFAULT 'treasury' CHECK (
    instrument_type IN ('treasury', 'government', 'corporate', 'municipal', 'other')
  ),
  issuer TEXT NOT NULL DEFAULT 'Government of Rwanda' CHECK (char_length(issuer) BETWEEN 1 AND 160),
  currency CHAR(3) NOT NULL DEFAULT 'RWF',
  market TEXT NOT NULL DEFAULT 'primary' CHECK (market IN ('primary', 'secondary', 'other')),
  purchase_date DATE NOT NULL,
  settlement_date DATE,
  bond_name TEXT NOT NULL CHECK (char_length(bond_name) BETWEEN 1 AND 120),
  isin TEXT NOT NULL DEFAULT '' CHECK (char_length(isin) <= 32),
  tenor_years NUMERIC(5, 2) NOT NULL CHECK (tenor_years > 0 AND tenor_years <= 100),
  face_value NUMERIC(18, 2) NOT NULL CHECK (face_value > 0),
  price_percent NUMERIC(10, 6) NOT NULL DEFAULT 100 CHECK (price_percent > 0 AND price_percent <= 1000),
  accrued_interest_paid NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (accrued_interest_paid >= 0),
  fees_paid NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (fees_paid >= 0),
  amount_invested NUMERIC(18, 2) NOT NULL CHECK (amount_invested > 0),
  coupon_rate NUMERIC(8, 6) NOT NULL CHECK (coupon_rate >= 0 AND coupon_rate <= 1),
  withholding_tax_rate NUMERIC(8, 6) NOT NULL DEFAULT 0.05 CHECK (
    withholding_tax_rate >= 0 AND withholding_tax_rate <= 1
  ),
  maturity_date DATE NOT NULL,
  first_coupon_date DATE,
  coupon_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  coupon_frequency SMALLINT NOT NULL DEFAULT 2 CHECK (coupon_frequency BETWEEN 1 AND 12),
  schedule_confidence TEXT NOT NULL DEFAULT 'confirmed' CHECK (
    schedule_confidence IN ('confirmed', 'estimated')
  ),
  broker TEXT NOT NULL DEFAULT '' CHECK (char_length(broker) <= 120),
  account_reference TEXT NOT NULL DEFAULT '' CHECK (char_length(account_reference) <= 120),
  source_url TEXT NOT NULL DEFAULT '' CHECK (char_length(source_url) <= 1000),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'matured')),
  notes TEXT NOT NULL DEFAULT '' CHECK (char_length(notes) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT maturity_after_purchase CHECK (maturity_date > purchase_date)
);

-- Backward-compatible migration for databases created with the original schema.
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS instrument_type TEXT NOT NULL DEFAULT 'treasury';
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS issuer TEXT NOT NULL DEFAULT 'Government of Rwanda';
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'RWF';
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS market TEXT NOT NULL DEFAULT 'primary';
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS settlement_date DATE;
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS face_value NUMERIC(18, 2);
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS price_percent NUMERIC(10, 6) NOT NULL DEFAULT 100;
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS accrued_interest_paid NUMERIC(18, 2) NOT NULL DEFAULT 0;
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS fees_paid NUMERIC(18, 2) NOT NULL DEFAULT 0;
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS withholding_tax_rate NUMERIC(8, 6) NOT NULL DEFAULT 0.05;
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS first_coupon_date DATE;
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS coupon_dates JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS schedule_confidence TEXT NOT NULL DEFAULT 'confirmed';
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS broker TEXT NOT NULL DEFAULT '';
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS account_reference TEXT NOT NULL DEFAULT '';
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS source_url TEXT NOT NULL DEFAULT '';
ALTER TABLE bond_purchases ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

UPDATE bond_purchases
SET
  settlement_date = COALESCE(settlement_date, purchase_date),
  face_value = COALESCE(face_value, amount_invested)
WHERE settlement_date IS NULL OR face_value IS NULL;

ALTER TABLE bond_purchases ALTER COLUMN face_value SET NOT NULL;

ALTER TABLE bond_purchases DROP CONSTRAINT IF EXISTS bond_purchases_tenor_years_check;
ALTER TABLE bond_purchases DROP CONSTRAINT IF EXISTS bond_purchases_amount_invested_check;
ALTER TABLE bond_purchases DROP CONSTRAINT IF EXISTS bond_purchases_coupon_rate_check;
ALTER TABLE bond_purchases ADD CONSTRAINT bond_purchases_tenor_years_check
  CHECK (tenor_years > 0 AND tenor_years <= 100);
ALTER TABLE bond_purchases ADD CONSTRAINT bond_purchases_amount_invested_check
  CHECK (amount_invested > 0);
ALTER TABLE bond_purchases ADD CONSTRAINT bond_purchases_coupon_rate_check
  CHECK (coupon_rate >= 0 AND coupon_rate <= 1);

CREATE INDEX IF NOT EXISTS bond_purchases_maturity_date_idx
  ON bond_purchases (maturity_date);

CREATE INDEX IF NOT EXISTS bond_purchases_purchase_date_idx
  ON bond_purchases (purchase_date DESC);

CREATE TABLE IF NOT EXISTS bond_market_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observed_date DATE NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_url TEXT NOT NULL CHECK (char_length(source_url) <= 1000),
  bond_name TEXT NOT NULL CHECK (char_length(bond_name) BETWEEN 1 AND 160),
  normalized_bond_name TEXT NOT NULL CHECK (char_length(normalized_bond_name) BETWEEN 1 AND 160),
  closing_price NUMERIC(10, 6),
  previous_price NUMERIC(10, 6),
  change_text TEXT NOT NULL DEFAULT '' CHECK (char_length(change_text) <= 80),
  volume_text TEXT NOT NULL DEFAULT '' CHECK (char_length(volume_text) <= 80),
  value_text TEXT NOT NULL DEFAULT '' CHECK (char_length(value_text) <= 80),
  raw_row JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (closing_price IS NULL OR closing_price > 0),
  CHECK (previous_price IS NULL OR previous_price > 0)
);

ALTER TABLE bond_market_observations ADD COLUMN IF NOT EXISTS observed_date DATE;
ALTER TABLE bond_market_observations ADD COLUMN IF NOT EXISTS observed_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE bond_market_observations ADD COLUMN IF NOT EXISTS source_url TEXT NOT NULL DEFAULT '';
ALTER TABLE bond_market_observations ADD COLUMN IF NOT EXISTS bond_name TEXT NOT NULL DEFAULT '';
ALTER TABLE bond_market_observations ADD COLUMN IF NOT EXISTS normalized_bond_name TEXT NOT NULL DEFAULT '';
ALTER TABLE bond_market_observations ADD COLUMN IF NOT EXISTS closing_price NUMERIC(10, 6);
ALTER TABLE bond_market_observations ADD COLUMN IF NOT EXISTS previous_price NUMERIC(10, 6);
ALTER TABLE bond_market_observations ADD COLUMN IF NOT EXISTS change_text TEXT NOT NULL DEFAULT '';
ALTER TABLE bond_market_observations ADD COLUMN IF NOT EXISTS volume_text TEXT NOT NULL DEFAULT '';
ALTER TABLE bond_market_observations ADD COLUMN IF NOT EXISTS value_text TEXT NOT NULL DEFAULT '';
ALTER TABLE bond_market_observations ADD COLUMN IF NOT EXISTS raw_row JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE bond_market_observations
SET observed_date = COALESCE(observed_date, observed_at::date)
WHERE observed_date IS NULL;

ALTER TABLE bond_market_observations ALTER COLUMN observed_date SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bond_market_observations_daily_trade_idx
  ON bond_market_observations (
    observed_date,
    normalized_bond_name,
    COALESCE(closing_price, -1),
    volume_text,
    value_text
  );

CREATE INDEX IF NOT EXISTS bond_market_observations_recent_idx
  ON bond_market_observations (normalized_bond_name, observed_date DESC, observed_at DESC);
