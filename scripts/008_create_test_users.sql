-- Migration: Create test users with known passwords for testing
-- Created: 2025-10-14
-- Purpose: Create staff users that can actually log in

-- IMPORTANT: These users should be created via Supabase Dashboard, not SQL
-- This file documents the users that should be created

/*
=========================================
 STAFF USERS TO CREATE VIA SUPABASE DASHBOARD
=========================================

Go to: Supabase Dashboard → Authentication → Users → Add User

1. MANAGER USER
   Email: manager@gobarber.com
   Password: Manager123!
   Auto Confirm Email: YES

   After creating, run this SQL to add to barbers table:
   */

DO $$
DECLARE
  manager_uuid UUID;
BEGIN
  -- Get the UUID of the manager user from auth.users
  SELECT id INTO manager_uuid FROM auth.users WHERE email = 'manager@gobarber.com' LIMIT 1;

  IF manager_uuid IS NOT NULL THEN
    -- Insert or update in barbers table
    INSERT INTO barbers (id, store_id, name, email, phone, role, is_active)
    VALUES (
      manager_uuid,
      '00000000-0000-0000-0000-000000000001',
      'Gerente Teste',
      'manager@gobarber.com',
      '(11) 99999-0001',
      'manager',
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      store_id = EXCLUDED.store_id,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active;

    RAISE NOTICE 'Manager user configured successfully';
  ELSE
    RAISE NOTICE 'Manager user not found in auth.users - please create it first via Supabase Dashboard';
  END IF;
END $$;

/*
2. BARBER USER
   Email: barber@gobarber.com
   Password: Barber123!
   Auto Confirm Email: YES

   After creating, run this SQL:
   */

DO $$
DECLARE
  barber_uuid UUID;
BEGIN
  SELECT id INTO barber_uuid FROM auth.users WHERE email = 'barber@gobarber.com' LIMIT 1;

  IF barber_uuid IS NOT NULL THEN
    INSERT INTO barbers (id, store_id, name, email, phone, role, is_active, rating, total_reviews, specialties)
    VALUES (
      barber_uuid,
      '00000000-0000-0000-0000-000000000001',
      'Barbeiro Teste',
      'barber@gobarber.com',
      '(11) 99999-0002',
      'barber',
      true,
      4.8,
      50,
      ARRAY['Cortes', 'Barba']
    )
    ON CONFLICT (id) DO UPDATE SET
      store_id = EXCLUDED.store_id,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active;

    RAISE NOTICE 'Barber user configured successfully';
  ELSE
    RAISE NOTICE 'Barber user not found in auth.users - please create it first via Supabase Dashboard';
  END IF;
END $$;

/*
3. ATTENDANT USER
   Email: attendant@gobarber.com
   Password: Attendant123!
   Auto Confirm Email: YES

   After creating, run this SQL:
   */

DO $$
DECLARE
  attendant_uuid UUID;
BEGIN
  SELECT id INTO attendant_uuid FROM auth.users WHERE email = 'attendant@gobarber.com' LIMIT 1;

  IF attendant_uuid IS NOT NULL THEN
    INSERT INTO barbers (id, store_id, name, email, phone, role, is_active)
    VALUES (
      attendant_uuid,
      '00000000-0000-0000-0000-000000000001',
      'Atendente Teste',
      'attendant@gobarber.com',
      '(11) 99999-0003',
      'attendant',
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      store_id = EXCLUDED.store_id,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active;

    RAISE NOTICE 'Attendant user configured successfully';
  ELSE
    RAISE NOTICE 'Attendant user not found in auth.users - please create it first via Supabase Dashboard';
  END IF;
END $$;

-- Verification: Check all test users
SELECT
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  b.name,
  b.role,
  b.is_active
FROM auth.users au
LEFT JOIN barbers b ON au.id = b.id
WHERE au.email IN ('manager@gobarber.com', 'barber@gobarber.com', 'attendant@gobarber.com')
ORDER BY b.role;
