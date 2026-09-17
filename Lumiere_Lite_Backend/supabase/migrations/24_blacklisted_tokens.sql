-- 24_blacklisted_tokens.sql
CREATE TABLE blacklisted_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jti VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup during authentication
CREATE INDEX idx_blacklisted_tokens_jti ON blacklisted_tokens(jti);
