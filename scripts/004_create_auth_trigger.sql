-- Create function to automatically sync auth.users with barbers table
-- This ensures that when staff members are created through Supabase Auth,
-- they are automatically added to the barbers table

CREATE OR REPLACE FUNCTION public.handle_new_staff_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create barber entry if user metadata indicates they are staff
  IF NEW.raw_user_meta_data->>'role' IN ('barber', 'attendant', 'manager') THEN
    INSERT INTO public.barbers (id, store_id, name, email, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'store_id')::UUID,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.email,
      NEW.raw_user_meta_data->>'role'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_staff_user();

-- Create function to update barbers table when auth.users is updated
CREATE OR REPLACE FUNCTION public.handle_staff_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update barber entry if it exists
  UPDATE public.barbers
  SET 
    name = COALESCE(NEW.raw_user_meta_data->>'name', name),
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_staff_user_update();
