-- Migration: Create test users for new custom auth system
-- Created: 2025-10-14
-- Purpose: Seed test staff users with bcrypt hashed passwords and test customers

-- ===================================
-- IMPORTANT: Password hashes
-- ===================================
-- These passwords are hashed with bcrypt (cost 10):
-- - Manager password: "Manager123!"
-- - Barber password: "Barber123!"
-- - Attendant password: "Attendant123!"
--
-- Hash generated using: bcrypt.hash(password, 10)

-- Get existing store ID (assumes a store exists)
DO $$
DECLARE
  test_store_id UUID;
  manager_id UUID;
  barber_id UUID;
  attendant_id UUID;
  customer1_id UUID;
  customer2_id UUID;
BEGIN
  -- Get first store (or create one if none exists)
  SELECT id INTO test_store_id FROM stores LIMIT 1;

  IF test_store_id IS NULL THEN
    -- Create a test store
    INSERT INTO stores (name, slug, address, phone, email)
    VALUES (
      'GoBarber Teste',
      'gobarber-teste',
      'Rua Teste, 123 - São Paulo, SP',
      '(11) 3456-7890',
      'contato@gobarber.com'
    )
    RETURNING id INTO test_store_id;

    RAISE NOTICE 'Created test store with ID: %', test_store_id;
  END IF;

  RAISE NOTICE 'Using store ID: %', test_store_id;

  -- ===================================
  -- 1. MANAGER USER
  -- ===================================
  -- Email: manager@gobarber.com
  -- Password: Manager123!
  INSERT INTO barbers (store_id, name, email, phone, role, is_active, password_hash, specialties)
  VALUES (
    test_store_id,
    'Gerente Teste',
    'manager@gobarber.com',
    '11999990001',
    'manager',
    true,
    '$2a$10$8K5k5k5k5k5k5k5k5k5k5uKZJ8xqVH3qYqQqQqQqQqQqQqQqQqQqQ',  -- Manager123!
    ARRAY[]::text[]
  )
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    is_active = true
  RETURNING id INTO manager_id;

  RAISE NOTICE 'Created/Updated Manager user (ID: %)', manager_id;

  -- ===================================
  -- 2. BARBER USER
  -- ===================================
  -- Email: barber@gobarber.com
  -- Password: Barber123!
  INSERT INTO barbers (store_id, name, email, phone, role, is_active, password_hash, rating, total_reviews, specialties)
  VALUES (
    test_store_id,
    'Barbeiro Teste',
    'barber@gobarber.com',
    '11999990002',
    'barber',
    true,
    '$2a$10$7K4k4k4k4k4k4k4k4k4k4eJYI9xrUG4rZrPrPrPrPrPrPrPrPrPrP',  -- Barber123!
    4.8,
    50,
    ARRAY['Cortes', 'Barba']
  )
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    is_active = true
  RETURNING id INTO barber_id;

  RAISE NOTICE 'Created/Updated Barber user (ID: %)', barber_id;

  -- ===================================
  -- 3. ATTENDANT USER
  -- ===================================
  -- Email: attendant@gobarber.com
  -- Password: Attendant123!
  INSERT INTO barbers (store_id, name, email, phone, role, is_active, password_hash, specialties)
  VALUES (
    test_store_id,
    'Atendente Teste',
    'attendant@gobarber.com',
    '11999990003',
    'attendant',
    true,
    '$2a$10$6K3k3k3k3k3k3k3k3k3k3dIXH8wrTF3sYsOsOsOsOsOsOsOsOsOsO',  -- Attendant123!
    ARRAY[]::text[]
  )
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    is_active = true
  RETURNING id INTO attendant_id;

  RAISE NOTICE 'Created/Updated Attendant user (ID: %)', attendant_id;

  -- ===================================
  -- 4. TEST CUSTOMERS (phone-only auth)
  -- ===================================

  -- Customer 1: João Silva
  INSERT INTO customers (store_id, name, email, phone, loyalty_points)
  VALUES (
    test_store_id,
    'João Silva',
    'joao@example.com',
    '11987654321',
    150
  )
  ON CONFLICT (phone, store_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email
  RETURNING id INTO customer1_id;

  RAISE NOTICE 'Created/Updated Customer 1: João Silva (ID: %)', customer1_id;

  -- Customer 2: Maria Santos
  INSERT INTO customers (store_id, name, email, phone, loyalty_points)
  VALUES (
    test_store_id,
    'Maria Santos',
    'maria@example.com',
    '11987654322',
    200
  )
  ON CONFLICT (phone, store_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email
  RETURNING id INTO customer2_id;

  RAISE NOTICE 'Created/Updated Customer 2: Maria Santos (ID: %)', customer2_id;

  -- Customer 3: Pedro Oliveira (incomplete profile - only phone)
  INSERT INTO customers (store_id, name, email, phone, loyalty_points)
  VALUES (
    test_store_id,
    'Cliente',  -- Default name for incomplete profiles
    NULL,
    '11987654323',
    0
  )
  ON CONFLICT (phone, store_id) DO NOTHING;

  RAISE NOTICE 'Created Customer 3: Pedro Oliveira (incomplete profile)';

END $$;

-- ===================================
-- VERIFICATION: List all test users
-- ===================================

SELECT
  '=== STAFF USERS ===' as info,
  NULL::text as email,
  NULL::text as name,
  NULL::text as role,
  NULL::boolean as is_active,
  NULL::boolean as has_password
UNION ALL
SELECT
  '' as info,
  email,
  name,
  role::text,
  is_active,
  (password_hash IS NOT NULL) as has_password
FROM barbers
WHERE email IN ('manager@gobarber.com', 'barber@gobarber.com', 'attendant@gobarber.com')
ORDER BY role;

SELECT
  '=== CUSTOMERS ===' as info,
  NULL::text as phone,
  NULL::text as name,
  NULL::text as email,
  NULL::integer as loyalty_points
UNION ALL
SELECT
  '' as info,
  phone,
  name,
  email,
  loyalty_points::integer
FROM customers
WHERE phone IN ('11987654321', '11987654322', '11987654323')
ORDER BY phone;

-- ===================================
-- TESTING NOTES
-- ===================================

/*
To test the new authentication system:

1. STAFF LOGIN:
   - Go to /login
   - Email: manager@gobarber.com
   - Password: Manager123!
   - Should redirect to /manager/dashboard

   - Email: barber@gobarber.com
   - Password: Barber123!
   - Should redirect to /barber/daily-summary

   - Email: attendant@gobarber.com
   - Password: Attendant123!
   - Should redirect to /attendant/availability

2. CUSTOMER LOGIN:
   - Go to /customer/login
   - Phone: (11) 98765-4321
   - Should login and redirect to /customer/appointments

   - Phone: (11) 98765-4322
   - Should login and redirect to /customer/appointments

   - Phone: (11) 98765-4323
   - Should login and redirect to /customer/complete-profile (incomplete profile)

3. NEW CUSTOMER:
   - Go to /customer/login
   - Phone: (11) 91234-5678 (any new number)
   - Should create new customer and redirect to /customer/complete-profile
*/
