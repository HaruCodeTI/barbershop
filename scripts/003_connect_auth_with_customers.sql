-- Migration 003: Connect Supabase Auth Users with Customers
-- Makes customers.id reference auth.users(id) for authenticated customers

-- 1. Add auth_user_id column to customers (optional - for authenticated customers)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_customers_auth_user ON customers(auth_user_id);

-- 2. Make phone non-unique (allow same phone for different stores or guest bookings)
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_key;

-- 3. Create unique constraint for authenticated users (one customer per user per store)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_auth_store_unique
ON customers(auth_user_id, store_id)
WHERE auth_user_id IS NOT NULL;

-- 4. Create function to automatically create customer profile on user signup
CREATE OR REPLACE FUNCTION create_customer_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if user has metadata (name, phone)
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    -- This will be called by the application, not automatically
    -- Just a helper function for reference
    NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The actual customer creation is handled in the application code
-- to ensure proper store_id assignment

-- 5. Add helper function to get customer by auth user
CREATE OR REPLACE FUNCTION get_customer_by_auth_user(
  p_auth_user_id UUID,
  p_store_id UUID
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  loyalty_points INTEGER,
  auth_user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.store_id,
    c.name,
    c.email,
    c.phone,
    c.loyalty_points,
    c.auth_user_id,
    c.created_at,
    c.updated_at
  FROM customers c
  WHERE c.auth_user_id = p_auth_user_id
    AND c.store_id = p_store_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add comments
COMMENT ON COLUMN customers.auth_user_id IS 'References auth.users(id) for authenticated customers. NULL for guest customers';
COMMENT ON FUNCTION get_customer_by_auth_user IS 'Helper function to get customer profile by auth user ID and store';

-- 7. Enable RLS policies for authenticated users
-- Create policy for customers to read their own data
CREATE POLICY "Customers can view their own profile"
ON customers FOR SELECT
USING (auth.uid() = auth_user_id);

-- Create policy for customers to update their own data
CREATE POLICY "Customers can update their own profile"
ON customers FOR UPDATE
USING (auth.uid() = auth_user_id);
