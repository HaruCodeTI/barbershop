# Guia de Testes - GoBarber Phase 6

Este guia explica como usar a documentação de testes criada para validar a Phase 6.

---

## 📚 Documentos Disponíveis

### 1. `SUPABASE_VALIDATION.md`
**O que é:** Relatório técnico da validação do banco de dados Supabase

**Quando usar:** ANTES de começar os testes

**O que contém:**
- Status completo do schema (tabelas existentes e faltantes)
- Migrações aplicadas e pendentes
- Avisos de segurança (8 warnings)
- Avisos de performance (51 items)
- Ações prioritizadas (Críticas, Importantes, Opcionais)

**Ações necessárias:**
```bash
# 1. CRÍTICO: Aplicar migração pendente
psql "postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" \
  -f scripts/006_add_store_hours.sql
```

---

### 2. `MANUAL_TEST_FLOWS.md`
**O que é:** Guia detalhado de 48 testes manuais

**Quando usar:** Durante a execução dos testes

**O que contém:**
- 48 casos de teste organizados em 10 fases
- Pré-condições, passos e resultados esperados para cada teste
- Testes de funcionalidade, integração, performance e UI/UX
- Referência a bugs conhecidos do code review

**Como usar:**
1. Siga os testes na ordem (T001 → T048)
2. Execute os passos descritos
3. Compare resultado obtido com resultado esperado
4. Anote observações e evidências

---

### 3. `TEST_REPORT_TEMPLATE.md`
**O que é:** Template para registrar resultados dos testes

**Quando usar:** Durante e após execução dos testes

**O que contém:**
- Checkbox para cada teste (✅ OK | ❌ ERRO | ⏸️ Bloqueado)
- Campos para evidências (screenshots, logs, tempos)
- Seções para bugs encontrados
- Seções para melhorias sugeridas
- Resumo executivo e aprovação final

**Como usar:**
1. Faça uma cópia do template
2. Preencha conforme executa cada teste
3. Documente bugs e melhorias
4. Escreva resumo executivo ao final

---

## 🚀 Fluxo de Trabalho Recomendado

### Fase 0: Preparação (30 minutos)

1. **Ler documentação completa**
   ```
   ✅ Ler SUPABASE_VALIDATION.md
   ✅ Ler MANUAL_TEST_FLOWS.md (overview)
   ✅ Fazer cópia de TEST_REPORT_TEMPLATE.md
   ```

2. **Preparar ambiente**
   ```bash
   # Aplicar migração pendente
   psql [connection-string] -f scripts/006_add_store_hours.sql

   # Iniciar aplicação
   npm run dev

   # Verificar dados de seed
   # - Pelo menos 4 agendamentos
   # - Pelo menos 7 clientes
   # - Pelo menos 3 barbers (com diferentes roles)
   ```

3. **Criar usuário Manager**
   ```sql
   -- Se não existe, criar no Supabase
   -- Verificar que role = 'manager'
   ```

4. **Preparar ferramentas**
   ```
   ✅ Abrir Chrome DevTools (Console + Network)
   ✅ Preparar ferramenta de screenshot
   ✅ Ter acesso ao banco de dados (para validações)
   ```

---

### Fase 1: Testes Críticos (1 hora)

Focar nos **testes bloqueadores** primeiro:

```
T001 - Acessar Dashboard (5 min)
T003 - Visualizar Agendamentos (10 min)
T005 - Confirmar Agendamento (10 min)
T015 - Visualizar Horários (10 min)
T022 - Visualizar Configurações (10 min)
T027 - Visualizar Usuários (10 min)
```

**Se QUALQUER teste crítico falhar → PARAR e reportar bug crítico**

---

### Fase 2: Testes Funcionais Completos (2-3 horas)

Executar todos os testes de funcionalidade:

```
FASE 1: Dashboard (T001-T002) - 15 min
FASE 2: Agendamentos (T003-T009) - 30 min
FASE 3: Clientes (T010-T014) - 30 min
FASE 4: Horários (T015-T021) - 30 min
FASE 5: Configurações (T022-T026) - 20 min
FASE 6: Usuários (T027-T032) - 30 min
FASE 7: Integração (T033-T036) - 30 min
```

---

### Fase 3: Testes de Performance e UI/UX (1 hora)

```
FASE 8: Performance (T037-T039) - 20 min
FASE 9: UI/UX (T040-T043) - 30 min
```

---

### Fase 4: Testes de Edge Cases (1 hora)

```
FASE 10: Erros e Edge Cases (T044-T048) - 1 hora
```

---

### Fase 5: Documentação e Relatório (30 minutos)

1. **Compilar resultados**
   ```
   ✅ Preencher estatísticas no relatório
   ✅ Documentar todos os bugs encontrados
   ✅ Listar melhorias sugeridas
   ```

2. **Escrever resumo executivo**
   ```
   ✅ O que está funcionando bem
   ✅ Problemas críticos (bloqueadores)
   ✅ Problemas não-críticos
   ✅ Recomendações
   ```

3. **Definir status final**
   ```
   [ ] APROVADO - pode ir para produção
   [ ] APROVADO COM RESSALVAS - bugs não-críticos
   [ ] REPROVADO - bugs críticos precisam ser corrigidos
   ```

---

## 🐛 Como Reportar Bugs

### Template de Bug

```markdown
### Bug #X
- **ID:** BUG-00X
- **Teste Relacionado:** T0XX
- **Severidade:** 🔴 Crítica | 🟡 Alta | 🟢 Média | 🔵 Baixa
- **Descrição:** [Descrição clara e concisa]
- **Passos para Reproduzir:**
  1. Passo 1
  2. Passo 2
  3. Passo 3
- **Resultado Esperado:** [O que deveria acontecer]
- **Resultado Obtido:** [O que realmente aconteceu]
- **Screenshot/Log:** [Anexar evidências]
- **Prioridade:** [Alta/Média/Baixa]
```

### Critérios de Severidade

| Severidade | Descrição | Exemplo |
|------------|-----------|---------|
| 🔴 **Crítica** | Bloqueia funcionalidade essencial | Página não carrega, dados perdidos |
| 🟡 **Alta** | Funcionalidade prejudicada mas tem workaround | Validação faltando, UX ruim |
| 🟢 **Média** | Problema menor que não impede uso | Texto errado, layout quebrado |
| 🔵 **Baixa** | Problema cosmético | Cor errada, espaçamento |

---

## ✅ Checklist Rápido

### Antes de Começar
- [ ] Migração 006 aplicada
- [ ] Aplicação rodando
- [ ] Usuário Manager criado
- [ ] Dados de seed carregados
- [ ] DevTools aberto
- [ ] Cópia do template de relatório criada

### Durante os Testes
- [ ] Seguindo ordem dos testes
- [ ] Preenchendo relatório em tempo real
- [ ] Tirando screenshots de bugs
- [ ] Verificando console para erros
- [ ] Medindo performance quando relevante

### Após os Testes
- [ ] Todos os testes executados
- [ ] Todos os bugs documentados
- [ ] Estatísticas calculadas
- [ ] Resumo executivo escrito
- [ ] Status final definido
- [ ] Relatório revisado

---

## 🎯 Dicas Importantes

### 1. Priorize Testes Críticos
Se você tem tempo limitado, foque nos testes marcados como CRÍTICOS (T001, T003, T005, T015, T022, T027).

### 2. Documente em Tempo Real
Não deixe para preencher o relatório depois. Anote observações durante cada teste.

### 3. Use Screenshots
Uma imagem vale mais que mil palavras. Tire screenshot de qualquer comportamento inesperado.

### 4. Valide no Banco
Sempre que o teste mencionar "verificar no banco", use uma query SQL para confirmar:
```sql
-- Exemplo: verificar se agendamento foi atualizado
SELECT status, notes FROM appointments WHERE id = 'xxx';

-- Exemplo: verificar se horários foram salvos
SELECT * FROM store_hours WHERE store_id = 'xxx';
```

### 5. Teste em Diferentes Resoluções
Não esqueça os testes de responsividade (T040, T041).

### 6. Anote Tempos de Performance
Use o Network tab do DevTools para medir tempos reais de API.

### 7. Bugs Conhecidos
O code review já identificou 4 bugs. Confirme se eles existem:
- BUG-001: cancelAppointment sobrescreve notes (T007)
- BUG-002: updateStoreHours sem transação (T019)
- BUG-003: Filtro de customers incorreto (T010, T011)
- BUG-004: Validação de horário faltando (T021)

---

## 📊 Métricas de Sucesso

### Mínimo para Aprovação
- ✅ 100% dos testes críticos (6) passando
- ✅ 90% dos testes funcionais (42) passando
- ✅ 0 bugs de severidade crítica
- ✅ Máximo 2 bugs de severidade alta

### Ideal para Produção
- ✅ 95% de todos os testes passando
- ✅ 0 bugs críticos ou altos
- ✅ Performance <2s para carregamento de páginas
- ✅ UI responsiva em todas resoluções

---

## 🆘 Problemas Comuns

### Problema: Página /manager/hours não carrega
**Solução:** Aplicar migração 006_add_store_hours.sql

### Problema: Métricas mostram valores errados
**Solução:** Verificar se há dados de seed suficientes no banco

### Problema: Usuário não consegue acessar
**Solução:** Verificar que role = 'manager' na tabela barbers

### Problema: Toast não aparece
**Solução:** Verificar console para erros, pode ser problema de connection

---

## 📞 Contato para Dúvidas

Se encontrar problemas durante os testes:
1. Verificar console do navegador
2. Verificar logs do servidor (npm run dev)
3. Consultar SUPABASE_VALIDATION.md para problemas de banco
4. Documentar no relatório como "Bloqueado" (⏸️)

---

## 🎉 Resultado Final

Após completar todos os testes, você terá:
- ✅ Validação completa da Phase 6
- ✅ Lista de bugs encontrados com prioridades
- ✅ Lista de melhorias sugeridas
- ✅ Relatório profissional de testes
- ✅ Decisão clara: Aprovar ou Reprovar para produção

**Tempo total estimado:** 5-7 horas para teste completo e documentação.

---

**Boa sorte com os testes! 🚀**
