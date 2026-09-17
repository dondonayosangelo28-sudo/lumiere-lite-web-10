ALTER TABLE dispatch_preparation_queue ADD COLUMN assigned_warehouse_staff_id UUID REFERENCES users(id);
