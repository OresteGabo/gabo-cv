// Used by production preparation and isolated PostgreSQL regression tests.
// All source data is bound as JSON; no purchase values are interpolated into SQL.
export function ownerPortfolioSeed(purchases) {
  if (!Array.isArray(purchases)) throw new Error("Invalid owner portfolio seed.");
  const defaults = { instrumentType:"treasury", issuer:"Government of Rwanda", currency:"RWF", market:"primary", isin:"", pricePercent:100, accruedInterestPaid:0, feesPaid:0, withholdingTaxRate:.05, firstCouponDate:null, couponDates:[], couponFrequency:2, scheduleConfidence:"estimated", broker:"", accountReference:"", sourceUrl:"", status:"active", notes:"" };
  const fields = "id instrumentType issuer currency market purchaseDate settlementDate bondName isin tenorYears faceValue pricePercent accruedInterestPaid feesPaid amountInvested couponRate withholdingTaxRate maturityDate firstCouponDate couponDates couponFrequency scheduleConfidence broker accountReference sourceUrl status notes createdAt".split(" ");
  const dateFields = new Set(["purchaseDate", "settlementDate", "maturityDate", "firstCouponDate"]);
  const numberFields = new Set(["tenorYears", "faceValue", "pricePercent", "accruedInterestPaid", "feesPaid", "amountInvested", "couponRate", "withholdingTaxRate"]);
  const column = name => name.replace(/[A-Z]/g, letter => "_" + letter.toLowerCase());
  const records = purchases.map(purchase => {
    const value = { ...defaults, ...purchase };
    value.settlementDate ||= value.purchaseDate;
    value.faceValue ??= value.amountInvested;
    value.amountInvested ??= value.faceValue * value.pricePercent / 100 + value.accruedInterestPaid + value.feesPaid;
    value.firstCouponDate ||= null;
    value.createdAt ||= new Date().toISOString();
    return Object.fromEntries(fields.map(name => [column(name), value[name]]));
  });
  const definitions = fields.map(name => `${column(name)} ${name === "id" ? "uuid" : name === "createdAt" ? "timestamptz" : name === "couponDates" ? "jsonb" : name === "couponFrequency" ? "smallint" : dateFields.has(name) ? "date" : numberFields.has(name) ? "numeric" : "text"}`).join(", ");
  return {
    text: `WITH applied AS (
      INSERT INTO bond_data_migrations (key) VALUES ('owner-json-portfolio-v1')
      ON CONFLICT DO NOTHING RETURNING key
    ), source AS (
      SELECT * FROM jsonb_to_recordset($1::jsonb) AS source(${definitions})
    )
    INSERT INTO bond_purchases (owner_id, dedup_key, ${fields.map(column).join(", ")})
    SELECT 'owner', concat(regexp_replace(upper(bond_name), '[^A-Z0-9]', '', 'g'), '|', currency, '|', market, '|', CASE WHEN market = 'primary' THEN '' ELSE purchase_date::text END, '|', settlement_date, '|', face_value::numeric(18,2)::text, '|', price_percent::numeric(10,6)::text), ${fields.map(column).join(", ")}
    FROM source WHERE EXISTS (SELECT 1 FROM applied)
    ON CONFLICT DO NOTHING`,
    values: [JSON.stringify(records)],
  };
}
