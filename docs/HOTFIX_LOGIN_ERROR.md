# HOTFIX: Login Error - Database Schema Query

**Status:** ✅ **RESOLVIDO**
**Data:** 14 de Outubro de 2025
**Erro:** `{"code":"unexpected_failure","message":"Database error querying schema"}`

---

## 🐛 Problema Identificado

### Erro no Login
Ao tentar fazer login, o sistema retornava:
```json
{
  "code": "unexpected_failure",
  "message": "Database error querying schema"
}
```

### Causa Raiz
**Erro nos logs do Supabase Auth:**
```
sql: Scan error on column index 3, name "confirmation_token":
converting NULL to string is unsupported
```

**Explicação:**
- Os usuários foram criados diretamente via SQL (seed data) e não através da API do Supabase Auth
- Campos de token (`confirmation_token`, `recovery_token`, etc.) ficaram como `NULL`
- O código Go do Supabase Auth não trata valores `NULL` corretamente nestes campos
- Supabase Auth espera **strings vazias** (`''`) ao invés de `NULL`

---

## ✅ Solução Aplicada

### 1. Correção dos Dados Existentes
Atualizei todos os 3 usuários existentes para terem strings vazias nos campos de token:

```sql
UPDATE auth.users
SET
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change_token_current = '',
  phone_change_token = '',
  reauthentication_token = '',
  phone_change = ''
WHERE [campos eram NULL];
```

**Resultado:** 3 usuários atualizados com sucesso ✅

### 2. Migração Criada
Criei a migração `scripts/007_fix_auth_null_tokens.sql` para documentar esta correção.

**Nota:** A migração já foi aplicada via MCP do Supabase, então você não precisa rodá-la manualmente.

---

## 🧪 Como Testar

### Credenciais de Teste
Use qualquer um dos usuários existentes:

**Manager:**
- Email: `marcus.johnson@gobarber.com` (ou david.chen, james.rodriguez)
- Senha: Verifique no seed data (scripts/003_seed_data.sql)

### Passos:
1. Acesse `http://localhost:3000`
2. Faça login com um dos usuários acima
3. Deve redirecionar para `/manager/dashboard` ✅
4. Não deve haver erros no console ✅

---

## 📋 Status dos Usuários

| Email | Role | Status | Tokens Fixed |
|-------|------|--------|-------------|
| marcus.johnson@gobarber.com | manager | ✅ Ativo | ✅ |
| david.chen@gobarber.com | barber | ✅ Ativo | ✅ |
| james.rodriguez@gobarber.com | attendant | ✅ Ativo | ✅ |

---

## ⚠️ Prevenção de Futuros Problemas

### Se Criar Novos Usuários via SQL

**❌ NÃO FAÇA ASSIM:**
```sql
INSERT INTO auth.users (id, email, encrypted_password, ...)
VALUES (uuid_generate_v4(), 'user@example.com', crypt('password', gen_salt('bf')), ...);
-- Deixa confirmation_token e outros como NULL
```

**✅ FAÇA ASSIM:**
```sql
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  confirmation_token,      -- Adicione estes campos
  recovery_token,
  email_change_token_current,
  phone_change_token,
  reauthentication_token,
  phone_change,
  ...
)
VALUES (
  uuid_generate_v4(),
  'user@example.com',
  crypt('password', gen_salt('bf')),
  '',  -- String vazia, não NULL
  '',
  '',
  '',
  '',
  '',
  ...
);
```

### Recomendação
**Use a API do Supabase Auth para criar usuários** em vez de SQL direto. A API lida com todos esses campos automaticamente.

---

## 📊 Verificação da Correção

Para confirmar que todos os usuários estão corretos:

```sql
SELECT
  email,
  confirmation_token = '' as token_ok,
  recovery_token = '' as recovery_ok,
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users;
```

**Resultado Esperado:**
- `token_ok`: `true`
- `recovery_ok`: `true`
- `has_password`: `true`
- `email_confirmed`: `true`

---

## 🚀 Próximos Passos

1. ✅ **Problema corrigido** - Usuários atualizados
2. ✅ **Migração criada** - Documentado em 007_fix_auth_null_tokens.sql
3. ⏳ **VOCÊ:** Testar login novamente
4. ⏳ **VOCÊ:** Se funcionar, continuar com os testes da Phase 6

---

## 📁 Arquivos Relacionados

```
scripts/
└── 007_fix_auth_null_tokens.sql     # Migração da correção

docs/
├── HOTFIX_LOGIN_ERROR.md            # Este documento
└── MANUAL_TEST_FLOWS.md             # Continue com T001 após login funcionar
```

---

## 🎯 Teste Agora

**Passo a Passo:**
1. Abra o navegador: `http://localhost:3000`
2. Tente fazer login com `marcus.johnson@gobarber.com`
3. Se funcionar → ✅ Continue com os testes T001-T048
4. Se ainda falhar → ❌ Reporte o erro no console/logs

---

**Status:** Correção aplicada e pronta para teste! 🎉
