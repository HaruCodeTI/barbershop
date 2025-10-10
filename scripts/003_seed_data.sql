-- Insert a demo store
INSERT INTO stores (id, name, slug, address, phone, email)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'GoBarber Centro',
  'gobarber-centro',
  'Rua Principal, 123 - Centro',
  '(11) 98765-4321',
  'contato@gobarber.com.br'
) ON CONFLICT (id) DO NOTHING;

-- Insert services
INSERT INTO services (store_id, name, description, duration, price, category) VALUES
('00000000-0000-0000-0000-000000000001', 'Corte Clássico', 'Corte tradicional com máquina e tesoura', 30, 45.00, 'haircut'),
('00000000-0000-0000-0000-000000000001', 'Corte Premium', 'Corte moderno com finalização e styling', 45, 65.00, 'haircut'),
('00000000-0000-0000-0000-000000000001', 'Barba Completa', 'Aparar, modelar e finalizar com toalha quente', 30, 35.00, 'beard'),
('00000000-0000-0000-0000-000000000001', 'Combo Corte + Barba', 'Corte clássico + barba completa', 60, 70.00, 'combo'),
('00000000-0000-0000-0000-000000000001', 'Platinado', 'Descoloração completa dos cabelos', 120, 150.00, 'finishing'),
('00000000-0000-0000-0000-000000000001', 'Luzes', 'Mechas e luzes personalizadas', 90, 120.00, 'finishing')
ON CONFLICT DO NOTHING;

-- Adding demo staff members (manager, attendants, barbers)
-- Note: In production, these users should be created through Supabase Auth
-- For demo purposes, we're creating placeholder entries
-- Passwords should be set through Supabase dashboard or auth flow

-- Insert demo manager
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'gerente@gobarber.com.br',
  crypt('senha123', gen_salt('bf')), -- In production, use proper auth flow
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO barbers (id, store_id, name, email, phone, role, avatar_url) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Carlos Silva', 'gerente@gobarber.com.br', '(11) 99999-0001', 'manager', '/avatars/manager.jpg')
ON CONFLICT (id) DO NOTHING;

-- Insert demo attendants
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('20000000-0000-0000-0000-000000000001', 'atendente1@gobarber.com.br', crypt('senha123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000002', 'atendente2@gobarber.com.br', crypt('senha123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO barbers (id, store_id, name, email, phone, role, avatar_url) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ana Santos', 'atendente1@gobarber.com.br', '(11) 99999-0002', 'attendant', '/avatars/attendant1.jpg'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Julia Costa', 'atendente2@gobarber.com.br', '(11) 99999-0003', 'attendant', '/avatars/attendant2.jpg')
ON CONFLICT (id) DO NOTHING;

-- Insert demo barbers
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('30000000-0000-0000-0000-000000000001', 'barbeiro1@gobarber.com.br', crypt('senha123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000002', 'barbeiro2@gobarber.com.br', crypt('senha123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000003', 'barbeiro3@gobarber.com.br', crypt('senha123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000004', 'barbeiro4@gobarber.com.br', crypt('senha123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000005', 'barbeiro5@gobarber.com.br', crypt('senha123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000006', 'barbeiro6@gobarber.com.br', crypt('senha123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000007', 'barbeiro7@gobarber.com.br', crypt('senha123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000008', 'barbeiro8@gobarber.com.br', crypt('senha123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO barbers (id, store_id, name, email, phone, role, avatar_url, rating, total_reviews, specialties) VALUES
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'João Pedro', 'barbeiro1@gobarber.com.br', '(11) 99999-1001', 'barber', '/avatars/barber1.jpg', 4.9, 127, ARRAY['Cortes Clássicos', 'Barba']),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Ricardo Alves', 'barbeiro2@gobarber.com.br', '(11) 99999-1002', 'barber', '/avatars/barber2.jpg', 4.8, 98, ARRAY['Cortes Modernos', 'Degradê']),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Fernando Lima', 'barbeiro3@gobarber.com.br', '(11) 99999-1003', 'barber', '/avatars/barber3.jpg', 4.7, 85, ARRAY['Barba', 'Finalização']),
('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Marcos Vieira', 'barbeiro4@gobarber.com.br', '(11) 99999-1004', 'barber', '/avatars/barber4.jpg', 4.9, 142, ARRAY['Cortes Premium', 'Coloração']),
('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'André Costa', 'barbeiro5@gobarber.com.br', '(11) 99999-1005', 'barber', '/avatars/barber5.jpg', 4.6, 73, ARRAY['Cortes Clássicos', 'Barba']),
('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Paulo Henrique', 'barbeiro6@gobarber.com.br', '(11) 99999-1006', 'barber', '/avatars/barber6.jpg', 4.8, 105, ARRAY['Degradê', 'Desenhos']),
('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Thiago Martins', 'barbeiro7@gobarber.com.br', '(11) 99999-1007', 'barber', '/avatars/barber7.jpg', 4.7, 91, ARRAY['Cortes Modernos', 'Barba']),
('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Rafael Souza', 'barbeiro8@gobarber.com.br', '(11) 99999-1008', 'barber', '/avatars/barber8.jpg', 4.9, 156, ARRAY['Todos os Estilos', 'Especialista'])
ON CONFLICT (id) DO NOTHING;

-- Adding demo customers
INSERT INTO customers (id, store_id, name, email, phone, loyalty_points) VALUES
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Pedro Henrique', 'pedro@email.com', '(11) 98888-0001', 150),
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Lucas Martins', 'lucas@email.com', '(11) 98888-0002', 320),
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Rafael Santos', 'rafael@email.com', '(11) 98888-0003', 80),
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Gabriel Silva', 'gabriel@email.com', '(11) 98888-0004', 0),
('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Thiago Costa', 'thiago@email.com', '(11) 98888-0005', 450)
ON CONFLICT (id) DO NOTHING;

-- Adding sample appointments with history
INSERT INTO appointments (id, store_id, customer_id, barber_id, appointment_date, appointment_time, status, total_price, discount_amount, final_price, notes) VALUES
-- Completed appointments (history)
('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '30 days', '10:00', 'completed', 45.00, 0, 45.00, 'Cliente satisfeito'),
('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '15 days', '14:00', 'completed', 70.00, 0, 70.00, 'Combo completo'),
('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '20 days', '11:00', 'completed', 65.00, 0, 65.00, NULL),
('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '5 days', '15:30', 'completed', 35.00, 0, 35.00, NULL),
-- Upcoming appointments
('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '2 days', '09:00', 'confirmed', 45.00, 0, 45.00, NULL),
('50000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', CURRENT_DATE + INTERVAL '3 days', '16:00', 'pending', 70.00, 10.50, 59.50, 'Cupom BEMVINDO aplicado')
ON CONFLICT (id) DO NOTHING;

-- Adding appointment services relationships
INSERT INTO appointment_services (appointment_id, service_id, price) VALUES
-- Appointment 1: Corte Clássico
('50000000-0000-0000-0000-000000000001', (SELECT id FROM services WHERE name = 'Corte Clássico' LIMIT 1), 45.00),
-- Appointment 2: Combo
('50000000-0000-0000-0000-000000000002', (SELECT id FROM services WHERE name = 'Combo Corte + Barba' LIMIT 1), 70.00),
-- Appointment 3: Corte Premium
('50000000-0000-0000-0000-000000000003', (SELECT id FROM services WHERE name = 'Corte Premium' LIMIT 1), 65.00),
-- Appointment 4: Barba
('50000000-0000-0000-0000-000000000004', (SELECT id FROM services WHERE name = 'Barba Completa' LIMIT 1), 35.00),
-- Appointment 5: Corte Clássico
('50000000-0000-0000-0000-000000000005', (SELECT id FROM services WHERE name = 'Corte Clássico' LIMIT 1), 45.00),
-- Appointment 6: Combo
('50000000-0000-0000-0000-000000000006', (SELECT id FROM services WHERE name = 'Combo Corte + Barba' LIMIT 1), 70.00)
ON CONFLICT DO NOTHING;

-- Adding loyalty transactions for customers with points
INSERT INTO loyalty_transactions (customer_id, appointment_id, points, transaction_type, description) VALUES
('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 45, 'earned', 'Pontos ganhos no agendamento'),
('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 70, 'earned', 'Pontos ganhos no agendamento'),
('40000000-0000-0000-0000-000000000001', NULL, -35, 'redeemed', 'Resgate de recompensa Bronze'),
('40000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000003', 65, 'earned', 'Pontos ganhos no agendamento'),
('40000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000004', 35, 'earned', 'Pontos ganhos no agendamento'),
('40000000-0000-0000-0000-000000000002', NULL, -220, 'redeemed', 'Resgate de recompensa Prata'),
('40000000-0000-0000-0000-000000000003', NULL, 80, 'earned', 'Pontos de bônus de boas-vindas'),
('40000000-0000-0000-0000-000000000005', NULL, 450, 'earned', 'Pontos acumulados de agendamentos anteriores')
ON CONFLICT DO NOTHING;

-- Insert sample coupons
INSERT INTO coupons (store_id, code, description, discount_type, discount_value, min_purchase, max_uses, valid_from, valid_until) VALUES
('00000000-0000-0000-0000-000000000001', 'BEMVINDO', 'Desconto de boas-vindas para novos clientes', 'percentage', 15.00, 40.00, 100, NOW(), NOW() + INTERVAL '30 days'),
('00000000-0000-0000-0000-000000000001', 'COMBO50', 'R$ 50 de desconto em combos', 'fixed', 50.00, 100.00, 50, NOW(), NOW() + INTERVAL '60 days')
ON CONFLICT DO NOTHING;

-- Insert loyalty programs
INSERT INTO loyalty_programs (store_id, name, description, points_required, reward_type, reward_value) VALUES
('00000000-0000-0000-0000-000000000001', 'Desconto Bronze', '10% de desconto na próxima visita', 100, 'discount_percentage', 10.00),
('00000000-0000-0000-0000-000000000001', 'Desconto Prata', '20% de desconto na próxima visita', 250, 'discount_percentage', 20.00),
('00000000-0000-0000-0000-000000000001', 'Desconto Ouro', 'R$ 50 de desconto', 500, 'discount_fixed', 50.00)
ON CONFLICT DO NOTHING;
