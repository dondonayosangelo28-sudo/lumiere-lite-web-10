CREATE TABLE event_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    quotation_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    estimated_asset_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    estimated_gross_margin DECIMAL(12,2) GENERATED ALWAYS AS (quotation_amount - estimated_asset_cost) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
