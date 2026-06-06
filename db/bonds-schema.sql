CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS bond_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_date DATE NOT NULL,
  bond_name TEXT NOT NULL CHECK (char_length(bond_name) BETWEEN 1 AND 120),
  isin TEXT NOT NULL DEFAULT '' CHECK (char_length(isin) <= 32),
  tenor_years NUMERIC(5, 2) NOT NULL CHECK (tenor_years IN (3, 5, 7, 10, 15, 20)),
  amount_invested NUMERIC(18, 2) NOT NULL CHECK (
    amount_invested >= 100000 AND mod(amount_invested, 100000) = 0
  ),
  coupon_rate NUMERIC(8, 6) NOT NULL CHECK (
    coupon_rate >= 0.1065 AND coupon_rate <= 0.135
  ),
  maturity_date DATE NOT NULL,
  coupon_frequency SMALLINT NOT NULL DEFAULT 2 CHECK (coupon_frequency BETWEEN 1 AND 12),
  notes TEXT NOT NULL DEFAULT '' CHECK (char_length(notes) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT maturity_after_purchase CHECK (maturity_date > purchase_date)
);

CREATE INDEX IF NOT EXISTS bond_purchases_maturity_date_idx
  ON bond_purchases (maturity_date);

CREATE INDEX IF NOT EXISTS bond_purchases_purchase_date_idx
  ON bond_purchases (purchase_date DESC);
