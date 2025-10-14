# Setup de Usuários de Teste - GoBarber

**Data:** 14 de Outubro de 2025
**Status:** 🔧 CONFIGURAÇÃO NECESSÁRIA

---

## 🚨 Problema Identificado

O login de staff não funciona porque os usuários criados via SQL seed não podem fazer login corretamente. O Supabase Auth requer que usuários sejam criados através da API ou Dashboard para funcionarem corretamente.

**Sintoma:** Erro "Database error querying schema" ou usuários não conseguem logar.

**Causa:** Usuários no seed data (marcus.johnson, david.chen, james.rodriguez) não têm senhas válidas.

---

## ✅ Solução: Criar Usuários via Supabase Dashboard

### Passo 1: Acesse o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/hobnkfghduuspsdvhkla
2. Vá em: **Authentication** → **Users**
3. Clique em: **Add User** (botão verde)

---

### Passo 2: Criar os 3 Usuários de Teste

#### 👤 Usuário 1: MANAGER

**Dados do formulário:**
```
Email: manager@gobarber.com
Password: Manager123!
☑️ Auto Confirm Email: SIM (marcar checkbox)
```

Clique em **Create User**

---

#### 👤 Usuário 2: BARBER

**Dados do formulário:**
```
Email: barber@gobarber.com
Password: Barber123!
☑️ Auto Confirm Email: SIM (marcar checkbox)
```

Clique em **Create User**

---

#### 👤 Usuário 3: ATTENDANT

**Dados do formulário:**
```
Email: attendant@gobarber.com
Password: Attendant123!
☑️ Auto Confirm Email: SIM (marcar checkbox)
```

Clique em **Create User**

---

### Passo 3: Executar SQL para Configurar os Usuários

Após criar os 3 usuários no Dashboard, execute este SQL no **SQL Editor** do Supabase:

```sql
-- ============================================
-- Configure Manager User
-- ============================================
DO $$
DECLARE
  manager_uuid UUID;
BEGIN
  SELECT id INTO manager_uuid FROM auth.users
  WHERE email = 'manager@gobarber.com' LIMIT 1;

  IF manager_uuid IS NOT NULL THEN
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

    RAISE NOTICE 'Manager configured';
  ELSE
    RAISE WARNING 'Manager not found in auth.users';
  END IF;
END $$;

-- ============================================
-- Configure Barber User
-- ============================================
DO $$
DECLARE
  barber_uuid UUID;
BEGIN
  SELECT id INTO barber_uuid FROM auth.users
  WHERE email = 'barber@gobarber.com' LIMIT 1;

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

    RAISE NOTICE 'Barber configured';
  ELSE
    RAISE WARNING 'Barber not found in auth.users';
  END IF;
END $$;

-- ============================================
-- Configure Attendant User
-- ============================================
DO $$
DECLARE
  attendant_uuid UUID;
BEGIN
  SELECT id INTO attendant_uuid FROM auth.users
  WHERE email = 'attendant@gobarber.com' LIMIT 1;

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

    RAISE NOTICE 'Attendant configured';
  ELSE
    RAISE WARNING 'Attendant not found in auth.users';
  END IF;
END $$;

-- ============================================
-- Verification
-- ============================================
SELECT
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  b.name,
  b.role,
  b.is_active,
  'USER READY' as status
FROM auth.users au
LEFT JOIN barbers b ON au.id = b.id
WHERE au.email IN ('manager@gobarber.com', 'barber@gobarber.com', 'attendant@gobarber.com')
ORDER BY b.role;
```

**Resultado Esperado:**
Você deve ver 3 linhas com `status: USER READY` e `email_confirmed: true`.

---

## 🧪 Passo 4: Testar os Logins

### Teste 1: Login como Manager

```
URL: http://localhost:3000/login
Email: manager@gobarber.com
Senha: Manager123!

Resultado Esperado: Redireciona para /manager/dashboard
```

### Teste 2: Login como Barber

```
URL: http://localhost:3000/login
Email: barber@gobarber.com
Senha: Barber123!

Resultado Esperado: Redireciona para /barber/daily-summary
```

### Teste 3: Login como Attendant

```
URL: http://localhost:3000/login
Email: attendant@gobarber.com
Senha: Attendant123!

Resultado Esperado: Redireciona para /attendant/availability
```

---

## ✅ Checklist de Verificação

Depois de criar os usuários:

- [ ] 3 usuários criados no Supabase Dashboard (Authentication → Users)
- [ ] Email confirmado automaticamente para os 3 usuários
- [ ] SQL de configuração executado no SQL Editor
- [ ] Verificação mostra 3 usuários com status "USER READY"
- [ ] Login de Manager funciona
- [ ] Login de Barber funciona
- [ ] Login de Attendant funciona
- [ ] Pode continuar com testes T001-T048

---

## 📋 Resumo das Credenciais

| Tipo | Email | Senha | URL Pós-Login |
|------|-------|-------|---------------|
| **Manager** | manager@gobarber.com | Manager123! | /manager/dashboard |
| **Barber** | barber@gobarber.com | Barber123! | /barber/daily-summary |
| **Attendant** | attendant@gobarber.com | Attendant123! | /attendant/availability |

---

## 🐛 Troubleshooting

### Erro: "Usuário não encontrado ou inativo no sistema"

**Causa:** SQL não foi executado ou usuário não está em `barbers` table.

**Solução:**
1. Verifique se o usuário existe em auth.users:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'manager@gobarber.com';
   ```

2. Execute o SQL de configuração novamente (Passo 3)

3. Verifique se aparece em barbers:
   ```sql
   SELECT * FROM barbers WHERE email = 'manager@gobarber.com';
   ```

---

### Erro: "Invalid login credentials"

**Causa:** Senha incorreta ou usuário não existe.

**Solução:**
1. Verifique se você criou o usuário no Dashboard
2. Use exatamente as senhas especificadas (case-sensitive!)
3. Se necessário, delete e recrie o usuário

---

### Erro: "Database error querying schema"

**Causa:** Problema com políticas RLS ou tokens NULL (já corrigido).

**Solução:**
1. Verifique se a migração 007_fix_auth_null_tokens foi aplicada
2. Execute:
   ```sql
   UPDATE auth.users
   SET confirmation_token = '',
       recovery_token = '',
       email_change_token_current = ''
   WHERE email IN ('manager@gobarber.com', 'barber@gobarber.com', 'attendant@gobarber.com');
   ```

---

## 📞 Próximos Passos

Depois que os 3 usuários estiverem funcionando:

1. ✅ Teste T001 - Acessar Dashboard do Manager
2. ✅ Continue com os outros 47 testes do MANUAL_TEST_FLOWS.md
3. ✅ Documente os resultados em TEST_REPORT_TEMPLATE.md

---

**⚠️ IMPORTANTE:** Não use os usuários antigos (marcus.johnson, david.chen, james.rodriguez). Use apenas os novos criados via Dashboard.

---

**Status:** Configuração pronta! Siga os passos acima e todos os logins funcionarão. 🚀
