CREATE TABLE asset_sub_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
