# Bug Report - T001: Login Error

**Bug ID:** BUG-T001-001
**Teste Relacionado:** T001 - Acessar Dashboard do Manager
**Data Encontrado:** 13 de Outubro de 2025
**Severidade:** 🔴 **CRÍTICA** (Bloqueia acesso ao sistema)
**Status:** 🔍 EM INVESTIGAÇÃO

---

## Descrição

Ao tentar fazer login como Manager, o sistema retorna erro:
```json
{
  "code": "unexpected_failure",
  "message": "Database error querying schema"
}
```

---

## Ambiente

- **Navegador:** (informar)
- **URL:** `http://localhost:3000/login` ou `/app/login`
- **Usuário Testado:** james.rodriguez@gobarber.com
- **Senha Testada:** (várias senhas testadas)

---

## Passos para Reproduzir

1. Acessar página `/login`
2. Inserir email: `james.rodriguez@gobarber.com`
3. Inserir senha: `senha123` (ou qualquer senha)
4. Clicar em "Entrar"
5. Aguardar resposta

**Resultado:** Erro "Database error querying schema"

---

## Resultado Esperado

- Login bem-sucedido
- Redirecionamento para `/manager/dashboard`
- Token de autenticação armazenado
- Sessão criada

---

## Investigação Realizada

### ✅ Verificações Concluídas

1. **Usuário existe no banco:**
   ```sql
   SELECT * FROM auth.users WHERE email = 'james.rodriguez@gobarber.com';
   -- Resultado: Usuário existe (id: a3333333-3333-3333-3333-333333333333)
   ```

2. **Usuário está na tabela barbers:**
   ```sql
   SELECT * FROM barbers WHERE email = 'james.rodriguez@gobarber.com';
   -- Resultado: Existe com role='manager', is_active=true
   ```

3. **Store associada existe:**
   ```sql
   SELECT * FROM stores WHERE id = '00000000-0000-0000-0000-000000000001';
   -- Resultado: Store "GoBarber Centro" existe
   ```

4. **Senha resetada:**
   ```sql
   UPDATE auth.users
   SET encrypted_password = crypt('senha123', gen_salt('bf'))
   WHERE email = 'james.rodriguez@gobarber.com';
   -- Resultado: 1 row updated
   ```

5. **Políticas RLS verificadas:**
   - `barbers_select_active`: Permite SELECT se is_active=true OU auth.uid()=id ✅
   - Usuário tem is_active=true ✅

---

## Possíveis Causas

### 1. Extensão pgcrypto não carregada
O erro pode ocorrer se a extensão `pgcrypto` não está disponível durante a autenticação.

**Verificar:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
```

**Corrigir (se necessário):**
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 2. Problema com RLS Policy ao fazer SELECT
Mesmo com is_active=true, a política RLS pode estar causando problema durante o login.

**Código problemático (app/login/page.tsx:39-43):**
```typescript
const { data: barber, error: barberError } = await supabase
  .from("barbers")
  .select("role")
  .eq("id", data.user.id)
  .single()
```

A policy `barbers_select_active` usa:
```sql
(is_active = true) OR (auth.uid() = id)
```

**Problema:** Durante o login, `auth.uid()` pode não estar disponível imediatamente após `signInWithPassword`.

### 3. Senha incorreta ou formato inválido
Apesar de termos resetado a senha, pode haver problema com o hash.

### 4. Problema de permissões do schema auth
O erro "querying schema" pode indicar problema de acesso ao schema `auth`.

---

## Soluções Propostas

### Solução 1: Verificar extensões necessárias

```sql
-- Verificar extensões instaladas
SELECT * FROM pg_extension;

-- Instalar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Solução 2: Simplificar política RLS temporariamente

**TEMPORÁRIO APENAS PARA TESTE:**
```sql
-- Desabilitar RLS temporariamente na tabela barbers
ALTER TABLE barbers DISABLE ROW LEVEL SECURITY;

-- Testar login

-- IMPORTANTE: Reabilitar depois
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
```

**⚠️ ATENÇÃO:** NÃO deixar RLS desabilitado em produção!

### Solução 3: Otimizar política RLS

Substituir a política atual por uma otimizada:

```sql
-- Dropar política antiga
DROP POLICY IF EXISTS barbers_select_active ON barbers;

-- Criar política otimizada
CREATE POLICY "barbers_select_active" ON barbers
  FOR SELECT
  USING (
    (is_active = true) OR ((SELECT auth.uid()) = id)
  );
```

**Nota:** O `(SELECT auth.uid())` evita re-avaliação por linha.

### Solução 4: Criar usuário novo via Supabase Dashboard

Se nada funcionar, criar usuário completamente novo:

1. Supabase Dashboard → Authentication → Users → Add user
2. Email: `teste@gobarber.com`
3. Senha: `Teste123!`
4. Confirmar email automaticamente
5. Inserir na tabela barbers:

```sql
INSERT INTO barbers (id, store_id, name, email, role, is_active)
VALUES (
  '[UUID-DO-NOVO-USUARIO]',
  '00000000-0000-0000-0000-000000000001',
  'Teste Manager',
  'teste@gobarber.com',
  'manager',
  true
);
```

### Solução 5: Usar Service Role Key (APENAS PARA DEBUG)

Modificar temporariamente o código de login para usar service_role:

```typescript
// ⚠️ APENAS PARA DEBUG - REMOVER DEPOIS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Bypass RLS
)
```

**⚠️ NUNCA fazer isso em produção!**

---

## Próximos Passos

1. **Testar novamente com credenciais corretas:**
   - Email: `james.rodriguez@gobarber.com`
   - Senha: `senha123`

2. **Se ainda falhar:**
   - Verificar console do navegador (F12) para erros JavaScript
   - Verificar Network tab para ver resposta exata da API
   - Tentar Solução 1 (verificar extensões)

3. **Se Solução 1 não resolver:**
   - Tentar Solução 3 (otimizar RLS policy)

4. **Como último recurso:**
   - Tentar Solução 4 (criar usuário novo via dashboard)

---

## Logs e Evidências

### Console do Navegador
```
(Inserir screenshot ou copiar erros do console)
```

### Network Tab (Request/Response)
```
Request URL:
Request Method:
Status Code:
Response Body:
```

### Logs do Supabase
```
(Acessar Supabase Dashboard → Logs)
```

---

## Impacto

- **Usuários Afetados:** Todos os managers
- **Funcionalidades Bloqueadas:** Todo o painel de manager
- **Workaround Disponível:** Não (sem workaround óbvio)
- **Urgência:** CRÍTICA - impede testes completos

---

## Status das Correções

- [x] Senha resetada para `senha123`
- [x] Verificado que usuário está ativo
- [x] Verificado que store existe
- [x] Verificado que RLS policies estão corretas
- [ ] Extensões verificadas
- [ ] Política RLS otimizada
- [ ] Login testado novamente
- [ ] Bug confirmado como resolvido

---

## Informações de Contato

**Credenciais de Teste Atualizadas:**
- Email: `james.rodriguez@gobarber.com`
- Senha: `senha123`
- Role: `manager`
- Store: `GoBarber Centro` (gobarber-centro)

**Documentação:**
- Ver `docs/TEST_CREDENTIALS.md` para credenciais completas
- Ver `docs/SUPABASE_VALIDATION.md` para problemas conhecidos do banco

---

**Atualizado:** 13 de Outubro de 2025
**Responsável pela Investigação:** Claude (assistente)
**Próximo Revisor:** (você - tester)
