-- Migration: Fix NULL token fields in auth.users
-- Created: 2025-10-14
-- Issue: Supabase Auth Go code cannot handle NULL values in token fields
-- Error: "sql: Scan error on column index 3, name 'confirmation_token': converting NULL to string is unsupported"

-- This occurs when users are created directly via SQL (seed data) instead of through Supabase Auth API
-- Supabase Auth expects empty strings ('') instead of NULL for token fields

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  phone_change = COALESCE(phone_change, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL
  OR email_change_token_current IS NULL
  OR phone_change_token IS NULL
  OR reauthentication_token IS NULL
  OR phone_change IS NULL;

-- NOTE: A trigger would be ideal to prevent future issues, but requires superuser access to auth schema
-- For now, ensure all new users are created via Supabase Auth API (not direct SQL)
-- Or manually run the UPDATE statement above after creating users via SQL

-- Verification query (run after migration to confirm fix)
-- SELECT
--   COUNT(*) FILTER (WHERE confirmation_token = '') as confirmation_fixed,
--   COUNT(*) FILTER (WHERE recovery_token = '') as recovery_fixed,
--   COUNT(*) FILTER (WHERE email_change_token_current = '') as email_change_fixed,
--   COUNT(*) as total_users
-- FROM auth.users;

-- IMPORTANT: When creating new staff users via SQL in the future, always use:
-- INSERT INTO auth.users (..., confirmation_token, recovery_token, ...)
-- VALUES (..., '', '', ...)
-- OR create users via Supabase Auth API which handles this automatically
