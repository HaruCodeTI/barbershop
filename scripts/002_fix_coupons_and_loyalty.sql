-- Migration 002: Fix Coupons and Loyalty System
-- Adds coupon tracking and automatic loyalty points

-- 1. Add coupon_id field to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_coupon ON appointments(coupon_id);

-- 2. Update loyalty_programs table to match actual usage
-- Drop old columns and add new ones
ALTER TABLE loyalty_programs
DROP COLUMN IF EXISTS points_required,
DROP COLUMN IF EXISTS reward_type,
DROP COLUMN IF EXISTS reward_value,
DROP COLUMN IF EXISTS service_id;

ALTER TABLE loyalty_programs
ADD COLUMN IF NOT EXISTS points_per_real INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS points_expiry_days INTEGER DEFAULT 365;

-- 3. Update loyalty_transactions table to include loyalty_program_id
ALTER TABLE loyalty_transactions
ADD COLUMN IF NOT EXISTS loyalty_program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE;

-- Update transaction_type enum to match code
ALTER TABLE loyalty_transactions
DROP CONSTRAINT IF EXISTS loyalty_transactions_transaction_type_check;

ALTER TABLE loyalty_transactions
ADD CONSTRAINT loyalty_transactions_transaction_type_check
CHECK (transaction_type IN ('earn', 'redeem', 'expire'));

-- 4. Create function to automatically award loyalty points when appointment is completed
CREATE OR REPLACE FUNCTION award_loyalty_points_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id UUID;
  v_customer_id UUID;
  v_final_price DECIMAL;
  v_loyalty_program_id UUID;
  v_points_per_real INTEGER;
  v_points_to_award INTEGER;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- Get appointment details
    v_store_id := NEW.store_id;
    v_customer_id := NEW.customer_id;
    v_final_price := NEW.final_price;

    -- Get active loyalty program for this store
    SELECT id, points_per_real
    INTO v_loyalty_program_id, v_points_per_real
    FROM loyalty_programs
    WHERE store_id = v_store_id
      AND is_active = true
    LIMIT 1;

    -- If loyalty program exists, calculate and award points
    IF v_loyalty_program_id IS NOT NULL THEN
      -- Calculate points: final_price * points_per_real
      v_points_to_award := FLOOR(v_final_price * v_points_per_real);

      -- Only award if points > 0
      IF v_points_to_award > 0 THEN
        -- Insert loyalty transaction
        INSERT INTO loyalty_transactions (
          customer_id,
          loyalty_program_id,
          appointment_id,
          points,
          transaction_type,
          description
        ) VALUES (
          v_customer_id,
          v_loyalty_program_id,
          NEW.id,
          v_points_to_award,
          'earn',
          'Pontos ganhos por agendamento concluído'
        );

        -- Update customer loyalty_points
        UPDATE customers
        SET loyalty_points = loyalty_points + v_points_to_award
        WHERE id = v_customer_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_award_loyalty_points ON appointments;

CREATE TRIGGER trigger_award_loyalty_points
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION award_loyalty_points_on_completion();

-- 5. Create function to automatically increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
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

-- Create trigger for coupon usage
DROP TRIGGER IF EXISTS trigger_increment_coupon_usage ON appointments;

CREATE TRIGGER trigger_increment_coupon_usage
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION increment_coupon_usage();

-- 6. Add comment documentation
COMMENT ON COLUMN appointments.coupon_id IS 'References the coupon used for this appointment';
COMMENT ON FUNCTION award_loyalty_points_on_completion() IS 'Automatically awards loyalty points when an appointment status changes to completed';
COMMENT ON FUNCTION increment_coupon_usage() IS 'Automatically increments coupon usage counter when appointment is confirmed or completed';
