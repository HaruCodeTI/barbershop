-- Migration 014: Create Manager User
-- Promotes an existing barber to manager role for testing

-- Update Marcus Johnson to be a manager
UPDATE barbers
SET role = 'manager',
    updated_at = NOW()
WHERE id = 'a1111111-1111-1111-1111-111111111111'
AND email = 'marcus.johnson@gobarber.com';

-- Verify the update
SELECT id, name, email, role, store_id
FROM barbers
WHERE id = 'a1111111-1111-1111-1111-111111111111';

-- Add comment
COMMENT ON TABLE barbers IS
'Staff members with roles: barber (can only manage own schedule), attendant (can manage appointments), manager (full access to store settings)';
