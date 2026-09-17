CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    date_of_event DATE NOT NULL,
    ingress_date DATE NOT NULL,
    ingress_time TIME NOT NULL,
    full_stop_time TIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    geo_classification VARCHAR(50) NOT NULL CHECK (geo_classification IN ('Local', 'National')),
    event_pegs TEXT,
    color_palette TEXT,
    branding_textures TEXT,
    notes TEXT,
    estimated_revenue DECIMAL(12,2),
    is_loss_maker BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
