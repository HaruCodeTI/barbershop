# Validação do Supabase - GoBarber

**Data de Validação:** 13 de Outubro de 2025
**Projeto:** gobarber (hobnkfghduuspsdvhkla)
**Região:** sa-east-1
**Status:** ACTIVE_HEALTHY
**PostgreSQL:** 17.6.1.016

---

## 1. Status do Schema

### ✅ Tabelas Existentes (10/11)

| Tabela | Linhas | RLS | Status | Observações |
|--------|--------|-----|---------|-------------|
| stores | 1 | ✅ | ✅ | Configurado corretamente |
| barbers | 3 | ✅ | ✅ | Inclui colunas rating, total_reviews, specialties |
| services | 6 | ✅ | ✅ | Configurado corretamente |
| customers | 7 | ✅ | ✅ | Inclui auth_user_id para autenticação |
| appointments | 4 | ✅ | ✅ | Inclui metadata JSONB e coupon_id |
| appointment_services | 9 | ✅ | ✅ | Tabela de relacionamento |
| coupons | 2 | ✅ | ✅ | Configurado corretamente |
| loyalty_programs | 3 | ✅ | ✅ | Com points_per_real e expiry_days |
| loyalty_transactions | 0 | ✅ | ✅ | Configurado corretamente |
| time_blocks | 0 | ✅ | ✅ | Para bloqueio de agenda |

### ❌ Tabelas Faltando (1)

| Tabela | Migração Necessária | Prioridade |
|--------|---------------------|------------|
| **store_hours** | `scripts/006_add_store_hours.sql` | 🔴 CRÍTICA |

**Impacto:** A página de Gestão de Horários (`/manager/hours`) NÃO funcionará até que esta migração seja aplicada.

---

## 2. Migrações Aplicadas

| Versão | Nome | Status |
|--------|------|--------|
| 20251010062847 | add_customer_appointment_update_policy | ✅ Aplicada |
| 20251013033622 | fix_coupons_and_loyalty | ✅ Aplicada |
| 20251013034008 | connect_auth_with_customers | ✅ Aplicada |
| 20251013035533 | add_appointment_metadata | ✅ Aplicada |

### 🔧 Ação Necessária

```bash
# Aplicar migração pendente
psql "postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" \
  -f scripts/006_add_store_hours.sql
```

---

## 3. Avisos de Segurança

### 🟡 WARN - Function Search Path Mutable (6 funções)

**Risco:** Potencial vulnerabilidade de segurança por search_path mutável.

**Funções Afetadas:**
1. `award_loyalty_points_on_completion`
2. `increment_coupon_usage`
3. `create_customer_profile_on_signup`
4. `get_customer_by_auth_user`
5. `handle_new_staff_user`
6. `handle_staff_user_update`

**Correção Recomendada:**
```sql
-- Exemplo para award_loyalty_points_on_completion
ALTER FUNCTION award_loyalty_points_on_completion()
SET search_path = pg_catalog, public;
```

**Documentação:** [Function Search Path Mutable](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)

### 🟡 WARN - Leaked Password Protection Disabled

**Descrição:** Proteção contra senhas vazadas (HaveIBeenPwned.org) está desabilitada.

**Correção:**
1. Acesse o painel Supabase: Authentication → Settings
2. Ative "Leaked Password Protection"

**Documentação:** [Password Security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

### 🟡 WARN - Insufficient MFA Options

**Descrição:** Poucas opções de MFA habilitadas.

**Correção:**
1. Acesse o painel Supabase: Authentication → Settings
2. Habilite mais métodos de MFA (TOTP, SMS, etc.)

**Documentação:** [Auth MFA](https://supabase.com/docs/guides/auth/auth-mfa)

---

## 4. Avisos de Performance

### 🟡 WARN - RLS Policies Não Otimizadas (37 políticas)

**Problema:** Políticas RLS usando `auth.uid()` diretamente sem `SELECT` wrapper.

**Impacto:** Performance subótima em grandes volumes de dados.

**Tabelas Afetadas:**
- stores (4 políticas)
- services (3 políticas)
- barbers (5 políticas)
- customers (4 políticas)
- appointments (1 política)
- coupons (4 políticas)
- loyalty_programs (4 políticas)
- appointment_services (1 política)
- loyalty_transactions (1 política)
- time_blocks (3 políticas)

**Correção Exemplo:**
```sql
-- ❌ Antes (não otimizado)
CREATE POLICY "stores_select_authenticated" ON stores
FOR SELECT TO authenticated
USING (auth.uid() IN (SELECT id FROM barbers WHERE store_id = stores.id));

-- ✅ Depois (otimizado)
CREATE POLICY "stores_select_authenticated" ON stores
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IN (SELECT id FROM barbers WHERE store_id = stores.id));
```

**Documentação:** [RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)

### 🟡 WARN - Multiple Permissive Policies (6 casos)

**Problema:** Tabela `customers` tem múltiplas políticas permissivas para mesma role e ação.

**Políticas Duplicadas:**
- anon SELECT: "Customers can view their own profile" + "customers_select_staff"
- anon UPDATE: "Customers can update their own profile" + "customers_update_staff"
- authenticated SELECT: duplicação
- authenticated UPDATE: duplicação
- authenticator SELECT: duplicação
- authenticator UPDATE: duplicação
- dashboard_user SELECT: duplicação
- dashboard_user UPDATE: duplicação

**Correção Recomendada:** Consolidar políticas em uma única política usando OR.

**Documentação:** [Multiple Permissive Policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)

### 🔵 INFO - Foreign Keys Não Indexadas (7 casos)

**Impacto:** Performance de queries com JOINs pode ser afetada.

**Foreign Keys Sem Índice:**
1. `appointment_services.appointment_id`
2. `appointment_services.service_id`
3. `coupons.store_id`
4. `loyalty_programs.store_id`
5. `loyalty_transactions.appointment_id`
6. `loyalty_transactions.customer_id`
7. `loyalty_transactions.loyalty_program_id`

**Correção:**
```sql
-- Criar índices para foreign keys
CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment
  ON appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service
  ON appointment_services(service_id);
CREATE INDEX IF NOT EXISTS idx_coupons_store
  ON coupons(store_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_store
  ON loyalty_programs(store_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_appointment
  ON loyalty_transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer
  ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_program
  ON loyalty_transactions(loyalty_program_id);
```

**Documentação:** [Unindexed Foreign Keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)

### 🔵 INFO - Índices Não Utilizados (11 casos)

**Nota:** Estes índices ainda não foram usados porque a aplicação tem poucos dados.

**Índices Reportados:**
1. `idx_services_store`
2. `idx_barbers_store`
3. `idx_customers_store`
4. `idx_appointments_store`
5. `idx_appointments_barber`
6. `idx_appointments_date`
7. `idx_time_blocks_barber`
8. `idx_barbers_rating`
9. `idx_appointments_coupon`
10. `idx_customers_auth_user`
11. `idx_appointments_metadata`

**Recomendação:** MANTER estes índices. Eles serão úteis quando houver mais dados.

---

## 5. Resumo de Ações

### 🔴 CRÍTICAS (Fazer AGORA)

1. **Aplicar migração 006_add_store_hours.sql**
   - Sem isso, a página `/manager/hours` não funcionará
   ```bash
   psql [connection-string] -f scripts/006_add_store_hours.sql
   ```

### 🟡 IMPORTANTES (Fazer ANTES de Produção)

2. **Corrigir search_path das funções** (6 funções)
   - Risco de segurança moderado

3. **Habilitar Leaked Password Protection**
   - Melhora segurança de autenticação

4. **Otimizar políticas RLS** (37 políticas)
   - Crítico para performance em escala

5. **Consolidar políticas RLS duplicadas na tabela customers**
   - Melhora performance de queries

### 🔵 OPCIONAIS (Melhorias Futuras)

6. **Adicionar índices para foreign keys** (7 índices)
   - Melhora performance de JOINs

7. **Habilitar MFA adicional**
   - Melhora segurança da aplicação

---

## 6. Status Geral

| Categoria | Status | Nota |
|-----------|--------|------|
| **Schema** | 🟡 Parcial | Falta tabela store_hours |
| **Segurança** | 🟡 Atenção | 8 warnings (não críticos) |
| **Performance** | 🟡 Atenção | 51 itens (maioria não críticos) |
| **Funcionalidade** | 🟢 OK | Com exceção de /manager/hours |
| **RLS** | 🟢 OK | Todas tabelas protegidas |
| **Migrações** | 🟡 Parcial | 1 migração pendente |

---

## 7. Priorização de Correções

### Fase 1 - IMEDIATO (Antes de Testar)
- ✅ Aplicar migração 006_add_store_hours.sql

### Fase 2 - PRÉ-PRODUÇÃO (Antes de Deploy)
- ⬜ Corrigir search_path de funções
- ⬜ Habilitar Leaked Password Protection
- ⬜ Otimizar políticas RLS com (SELECT auth.uid())
- ⬜ Consolidar políticas RLS duplicadas

### Fase 3 - PÓS-PRODUÇÃO (Monitoramento)
- ⬜ Adicionar índices para foreign keys conforme necessário
- ⬜ Remover índices não utilizados após 3 meses
- ⬜ Habilitar MFA adicional

---

## 8. Links Úteis

- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [RLS Performance Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Auth Security](https://supabase.com/docs/guides/auth/password-security)
- [Index Optimization](https://supabase.com/docs/guides/database/postgres/indexes)
