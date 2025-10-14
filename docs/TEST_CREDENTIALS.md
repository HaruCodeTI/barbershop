# Credenciais de Teste - GoBarber

**IMPORTANTE:** Use estas credenciais para testar o sistema.

---

## 🔐 Credenciais de Acesso

### Manager (Gerente)
```
Email: james.rodriguez@gobarber.com
Senha: senha123
Role: manager
```

**Use esta conta para:**
- Acessar dashboard do manager
- Testar todas as funcionalidades de gestão
- Executar os testes T001-T048

---

### Barbers (Barbeiros)
```
Email: marcus.johnson@gobarber.com
Senha: senha123 (se necessário, pedir reset)
Role: barber

Email: david.chen@gobarber.com
Senha: senha123 (se necessário, pedir reset)
Role: barber
```

**Use estas contas para:**
- Testar permissões de barber
- Verificar restrições de acesso
- Testar gestão de disponibilidade

---

## 🏪 Informação da Loja

```
Nome: GoBarber Centro
Slug: gobarber-centro (ou o slug da sua loja)
ID: 00000000-0000-0000-0000-000000000001 (verificar no banco)
```

---

## ⚠️ Solução de Problemas

### Erro: "Database error querying schema"

Este erro ocorre quando:
1. **RLS Policies muito restritivas** - As políticas de segurança estão bloqueando a query
2. **Usuário não tem registro em auth.users** - A autenticação falha
3. **Senha incorreta ou expirada**

**Soluções aplicadas:**
✅ Senha do manager (james.rodriguez@gobarber.com) foi resetada para `senha123`

---

### Se ainda tiver erro de login:

#### 1. Verificar se usuário existe no banco
```sql
SELECT
  au.id,
  au.email,
  b.name,
  b.role,
  b.is_active
FROM auth.users au
JOIN barbers b ON au.id = b.id
WHERE au.email = 'james.rodriguez@gobarber.com';
```

#### 2. Verificar se usuário está ativo
```sql
SELECT is_active FROM barbers
WHERE email = 'james.rodriguez@gobarber.com';
```

Se `is_active = false`, ativar:
```sql
UPDATE barbers
SET is_active = true
WHERE email = 'james.rodriguez@gobarber.com';
```

#### 3. Resetar senha novamente
```sql
UPDATE auth.users
SET encrypted_password = crypt('senha123', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'james.rodriguez@gobarber.com';
```

#### 4. Verificar RLS Policies
Se o erro persistir, pode ser um problema com as políticas RLS. Veja `SUPABASE_VALIDATION.md` seção de performance para otimizações de RLS.

---

## 🆘 Alternativa: Criar Novo Manager

Se ainda não conseguir logar, você pode criar um novo usuário manager:

### Via Supabase Dashboard (Recomendado)
1. Acesse Supabase Dashboard → Authentication → Users
2. Clique em "Add user"
3. Email: `teste@gobarber.com`
4. Senha: `senha123`
5. Clique em "Create user"
6. Anote o UUID do usuário criado

Depois execute no SQL Editor:
```sql
-- Inserir na tabela barbers
INSERT INTO barbers (id, store_id, name, email, phone, role, is_active)
VALUES (
  '[UUID-DO-USUARIO]',  -- Substituir pelo UUID criado
  '00000000-0000-0000-0000-000000000001',  -- ID da store
  'Teste Manager',
  'teste@gobarber.com',
  '(11) 99999-9999',
  'manager',
  true
);
```

---

## 📧 Clientes de Teste

Os clientes não precisam de login auth, mas estão disponíveis para testes:

```
Pedro Henrique - pedro@email.com - (11) 98888-0001
Lucas Martins - lucas@email.com - (11) 98888-0002
Rafael Santos - rafael@email.com - (11) 98888-0003
Gabriel Silva - gabriel@email.com - (11) 98888-0004
Thiago Costa - thiago@email.com - (11) 98888-0005
```

---

## ✅ Checklist de Verificação

Antes de testar, certifique-se:
- [ ] Usuário manager existe em `auth.users`
- [ ] Usuário manager existe em `barbers` com role='manager'
- [ ] Usuário está ativo (`is_active = true`)
- [ ] Senha está correta (`senha123`)
- [ ] Store existe e tem ID correto
- [ ] Aplicação está rodando (`npm run dev`)

---

## 🔍 Logs Úteis

Se continuar com problema, verificar:

**Console do navegador (F12):**
```javascript
// Verificar qual erro específico está ocorrendo
localStorage.getItem('supabase.auth.token')
```

**Logs do Supabase:**
- Acesse Supabase Dashboard → Logs
- Filtre por "Auth" e "PostgREST"
- Procure por erros recentes

---

**Atualizado:** 13 de Outubro de 2025
**Status:** ✅ Senha do manager resetada para `senha123`
