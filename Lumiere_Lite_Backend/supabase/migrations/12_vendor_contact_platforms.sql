CREATE TABLE vendor_contact_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_representative_id UUID NOT NULL REFERENCES vendor_representatives(id) ON DELETE CASCADE,
    platform_name VARCHAR(100) NOT NULL,
    handle VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
