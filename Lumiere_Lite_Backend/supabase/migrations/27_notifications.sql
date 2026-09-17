-- 27_notifications.sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_target CHECK (target_user_id IS NOT NULL OR target_role_id IS NOT NULL)
);
