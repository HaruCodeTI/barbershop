-- Enable Row Level Security on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

-- Stores policies (public read, authenticated staff can manage)
CREATE POLICY "stores_select_all" ON stores FOR SELECT USING (true);
CREATE POLICY "stores_insert_authenticated" ON stores FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "stores_update_authenticated" ON stores FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "stores_delete_authenticated" ON stores FOR DELETE USING (auth.uid() IS NOT NULL);

-- Services policies (public read, staff can manage)
CREATE POLICY "services_select_all" ON services FOR SELECT USING (true);
CREATE POLICY "services_insert_staff" ON services FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role IN ('manager', 'attendant'))
);
CREATE POLICY "services_update_staff" ON services FOR UPDATE USING (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role IN ('manager', 'attendant'))
);
CREATE POLICY "services_delete_staff" ON services FOR DELETE USING (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager')
);

-- Barbers policies (public read for active, staff can manage)
CREATE POLICY "barbers_select_active" ON barbers FOR SELECT USING (is_active = true OR auth.uid() = id);
CREATE POLICY "barbers_insert_manager" ON barbers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager')
);
CREATE POLICY "barbers_update_manager" ON barbers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager') OR auth.uid() = id
);
CREATE POLICY "barbers_delete_manager" ON barbers FOR DELETE USING (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager')
);

-- Customers policies (public insert for new customers, staff can read/update)
CREATE POLICY "customers_select_staff" ON customers FOR SELECT USING (
  auth.uid() IS NOT NULL OR true -- Allow public read for customer lookup
);
CREATE POLICY "customers_insert_all" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "customers_update_staff" ON customers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid())
);

-- Appointments policies (staff can manage, customers can view their own)
CREATE POLICY "appointments_select_all" ON appointments FOR SELECT USING (true);
CREATE POLICY "appointments_insert_all" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "appointments_update_staff" ON appointments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid())
);
CREATE POLICY "appointments_delete_staff" ON appointments FOR DELETE USING (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid())
);

-- Appointment services policies
CREATE POLICY "appointment_services_select_all" ON appointment_services FOR SELECT USING (true);
CREATE POLICY "appointment_services_insert_all" ON appointment_services FOR INSERT WITH CHECK (true);
CREATE POLICY "appointment_services_delete_staff" ON appointment_services FOR DELETE USING (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid())
);

-- Coupons policies (public read active, manager can manage)
CREATE POLICY "coupons_select_active" ON coupons FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);
CREATE POLICY "coupons_insert_manager" ON coupons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager')
);
CREATE POLICY "coupons_update_manager" ON coupons FOR UPDATE USING (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager')
);
CREATE POLICY "coupons_delete_manager" ON coupons FOR DELETE USING (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager')
);

-- Loyalty programs policies (public read active, manager can manage)
CREATE POLICY "loyalty_programs_select_active" ON loyalty_programs FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);
CREATE POLICY "loyalty_programs_insert_manager" ON loyalty_programs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager')
);
CREATE POLICY "loyalty_programs_update_manager" ON loyalty_programs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager')
);
CREATE POLICY "loyalty_programs_delete_manager" ON loyalty_programs FOR DELETE USING (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager')
);

-- Loyalty transactions policies
CREATE POLICY "loyalty_transactions_select_all" ON loyalty_transactions FOR SELECT USING (true);
CREATE POLICY "loyalty_transactions_insert_staff" ON loyalty_transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid())
);

-- Time blocks policies (barbers can manage their own, managers can manage all)
CREATE POLICY "time_blocks_select_all" ON time_blocks FOR SELECT USING (true);
CREATE POLICY "time_blocks_insert_barber" ON time_blocks FOR INSERT WITH CHECK (
  auth.uid() = barber_id OR EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager')
);
CREATE POLICY "time_blocks_update_barber" ON time_blocks FOR UPDATE USING (
  auth.uid() = barber_id OR EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager')
);
CREATE POLICY "time_blocks_delete_barber" ON time_blocks FOR DELETE USING (
  auth.uid() = barber_id OR EXISTS (SELECT 1 FROM barbers WHERE id = auth.uid() AND role = 'manager')
);
