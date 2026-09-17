CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Append-only trigger function
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $body
BEGIN
    RAISE EXCEPTION 'audit_log is an append-only table. UPDATE and DELETE operations are strictly forbidden.';
END;
$body LANGUAGE plpgsql;

-- Append-only triggers
CREATE TRIGGER trg_audit_log_no_update
BEFORE UPDATE ON audit_log
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER trg_audit_log_no_delete
BEFORE DELETE ON audit_log
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();
