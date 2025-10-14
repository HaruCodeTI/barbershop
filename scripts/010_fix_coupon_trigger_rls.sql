-- Migration 010: Fix Coupon Trigger RLS Issue
-- Adds SECURITY DEFINER to allow trigger to bypass RLS policies

-- Drop and recreate function with SECURITY DEFINER
-- This allows the trigger to update coupons usage counter
-- without being blocked by RLS policies (which require manager role)
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER
SECURITY DEFINER -- Bypass RLS policies
SET search_path = public
AS $$
BEGIN
  -- Only process if coupon_id is set and appointment is confirmed or completed
  IF NEW.coupon_id IS NOT NULL AND NEW.status IN ('confirmed', 'completed') THEN
    -- Check if this is a new appointment or status change
    IF OLD IS NULL OR OLD.coupon_id IS NULL OR OLD.status NOT IN ('confirmed', 'completed') THEN
      -- Increment coupon usage
      UPDATE coupons
      SET current_uses = current_uses + 1
      WHERE id = NEW.coupon_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_increment_coupon_usage ON appointments;

CREATE TRIGGER trigger_increment_coupon_usage
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION increment_coupon_usage();

-- Add helpful comment
COMMENT ON FUNCTION increment_coupon_usage() IS
'Automatically increments coupon usage when appointment is confirmed or completed. Uses SECURITY DEFINER to bypass RLS policies.';
