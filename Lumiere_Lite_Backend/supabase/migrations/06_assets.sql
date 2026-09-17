CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_sub_type_id UUID NOT NULL REFERENCES asset_sub_types(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    asset_tier INTEGER NOT NULL DEFAULT 1,
    asset_state VARCHAR(50) NOT NULL CHECK (asset_state IN ('Available', 'Committed', 'In-Transit Outbound', 'On-Site', 'In-Transit Return', 'Pending Count', 'Available Unprepped', 'Prepping', 'Lost In Action')),
    quantity INTEGER NOT NULL DEFAULT 1,
    catalog_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
