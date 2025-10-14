-- Migration 009: Fix Loyalty Trigger RLS Issue
-- Adds SECURITY DEFINER to allow trigger to bypass RLS policies

-- Drop and recreate function with SECURITY DEFINER
-- This allows the trigger to insert into loyalty_transactions
-- without being blocked by RLS policies
CREATE OR REPLACE FUNCTION award_loyalty_points_on_completion()
RETURNS TRIGGER
SECURITY DEFINER -- This is the key fix!
SET search_path = public
AS $$
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

-- Recreate trigger (if it doesn't exist, it will be created)
DROP TRIGGER IF EXISTS trigger_award_loyalty_points ON appointments;

CREATE TRIGGER trigger_award_loyalty_points
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION award_loyalty_points_on_completion();

-- Add helpful comment
COMMENT ON FUNCTION award_loyalty_points_on_completion() IS
'Automatically awards loyalty points when appointment is completed. Uses SECURITY DEFINER to bypass RLS policies.';
