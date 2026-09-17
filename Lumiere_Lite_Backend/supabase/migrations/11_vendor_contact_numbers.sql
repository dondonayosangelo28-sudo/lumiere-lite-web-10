CREATE TABLE vendor_contact_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_representative_id UUID NOT NULL REFERENCES vendor_representatives(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL,
    type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
