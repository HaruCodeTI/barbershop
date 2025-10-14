# Fluxos de Teste Manual - GoBarber Phase 6

**Versão:** 1.0
**Data:** 13 de Outubro de 2025
**Objetivo:** Validar todas as funcionalidades implementadas na Phase 6

---

## Pré-requisitos

### 1. Ambiente Preparado

- ✅ Migração `006_add_store_hours.sql` aplicada no Supabase
- ✅ Aplicação rodando localmente: `npm run dev`
- ✅ Acesso como usuário Manager (role: manager)
- ✅ Dados de seed carregados no banco

### 2. Credenciais de Teste

**Manager:**
- Email: (verificar no banco `barbers` table, role='manager')
- URL Base: `http://localhost:3000`

### 3. Navegador e Ferramentas

- Chrome/Firefox com DevTools aberto (Console + Network tabs)
- Verificar erros no console durante testes
- Anotar tempos de resposta de APIs lentas (>2s)

---

## Estrutura de Teste

Cada teste segue o formato:

```
## [ID] Nome do Teste
**Pré-condição:** Estado necessário antes do teste
**Passos:** Lista numerada de ações
**Resultado Esperado:** O que deve acontecer
**Resultado Obtido:** [ ] OK | [ ] ERRO - descrever
**Evidências:** Screenshots, logs, observações
```

---

# FASE 1: DASHBOARD PRINCIPAL

## T001 - Acessar Dashboard do Manager

**Pré-condição:** Usuário autenticado como Manager

**Passos:**
1. Fazer login como Manager
2. Navegar para `/manager/dashboard`
3. Verificar carregamento da página

**Resultado Esperado:**
- Página carrega em <2s
- Exibe seções "Gestão Principal" e "Configurações"
- Cards clicáveis: Agendamentos, Clientes, Barbeiros, Serviços, Cupons, Fidelidade, Loja, Horários, Usuários
- Sem erros no console

**Resultado Obtido:** [ ] OK | [X] ERRO

**Evidências:**
```
Console Errors:
Network Errors:
Performance:
Screenshots:
```

---

## T002 - Navegação entre Cards do Dashboard

**Pré-condição:** Dashboard carregado

**Passos:**
1. Clicar em cada card do dashboard
2. Verificar que a página correta é aberta
3. Verificar botão "Voltar" em cada página

**Resultado Esperado:**
- Card "Agendamentos" → `/manager/appointments`
- Card "Clientes" → `/manager/customers`
- Card "Barbeiros" → `/manager/barbers`
- Card "Serviços" → `/manager/services`
- Card "Cupons" → `/manager/coupons`
- Card "Fidelidade" → `/manager/loyalty`
- Card "Loja" → `/manager/settings`
- Card "Horários" → `/manager/hours`
- Card "Usuários" → `/manager/users`
- Botão "Voltar" retorna ao dashboard

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Páginas com erro:
```

---

# FASE 2: GESTÃO DE AGENDAMENTOS

## T003 - Visualizar Lista de Agendamentos

**Pré-condição:** Pelo menos 4 agendamentos no banco (com diferentes status)

**Passos:**
1. Acessar `/manager/appointments`
2. Aguardar carregamento da página

**Resultado Esperado:**
- Exibe 4 cards de métricas:
  - Total de Agendamentos (número correto)
  - Pendentes (número correto)
  - Confirmados (número correto)
  - Receita Total (formato R$ X.XX)
- Exibe 5 tabs: Todos, Pendentes, Confirmados, Concluídos, Cancelados
- Tab "Todos" ativo por padrão
- Tabela mostra todos agendamentos
- Colunas: Data/Hora, Cliente, Barbeiro, Serviços, Status, Valor, Ações

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Total Agendamentos Esperado: ___
Total Agendamentos Mostrado: ___
Métricas Corretas? [ ] Sim [ ] Não
```

---

## T004 - Filtrar Agendamentos por Status

**Pré-condição:** Agendamentos com diferentes status existem

**Passos:**
1. Clicar na tab "Pendentes"
2. Verificar que apenas agendamentos pendentes são exibidos
3. Clicar na tab "Confirmados"
4. Verificar que apenas agendamentos confirmados são exibidos
5. Repetir para "Concluídos" e "Cancelados"
6. Clicar em "Todos" novamente

**Resultado Esperado:**
- Cada tab filtra corretamente os agendamentos
- Apenas agendamentos do status correspondente são exibidos
- Badge de status corresponde à tab selecionada
- Tab "Todos" exibe todos os agendamentos novamente

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Tab "Pendentes": ___ registros
Tab "Confirmados": ___ registros
Tab "Concluídos": ___ registros
Tab "Cancelados": ___ registros
```

---

## T005 - Confirmar Agendamento Pendente

**Pré-condição:** Existe pelo menos 1 agendamento com status "pending"

**Passos:**
1. Na tab "Pendentes", localizar um agendamento
2. Clicar no botão "Confirmar" na linha do agendamento
3. Aguardar toast de sucesso
4. Verificar que o agendamento mudou para tab "Confirmados"

**Resultado Esperado:**
- Toast exibe "Agendamento confirmado com sucesso!"
- Agendamento some da tab "Pendentes"
- Agendamento aparece na tab "Confirmados"
- Badge de status muda para "Confirmado" (verde)
- Métrica "Confirmados" aumenta em 1
- Métrica "Pendentes" diminui em 1

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Toast mostrado? [ ] Sim [ ] Não
Status atualizado? [ ] Sim [ ] Não
Métricas atualizadas? [ ] Sim [ ] Não
```

---

## T006 - Completar Agendamento Confirmado

**Pré-condição:** Existe pelo menos 1 agendamento com status "confirmed"

**Passos:**
1. Na tab "Confirmados", localizar um agendamento
2. Clicar no botão "Completar" na linha do agendamento
3. Aguardar toast de sucesso
4. Verificar que o agendamento mudou para tab "Concluídos"

**Resultado Esperado:**
- Toast exibe "Agendamento concluído com sucesso!"
- Agendamento some da tab "Confirmados"
- Agendamento aparece na tab "Concluídos"
- Badge de status muda para "Concluído" (verde escuro)
- Métrica "Confirmados" diminui em 1
- Métrica "Total" permanece igual

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Toast mostrado? [ ] Sim [ ] Não
Status atualizado? [ ] Sim [ ] Não
```

---

## T007 - Cancelar Agendamento com Motivo

**Pré-condição:** Existe pelo menos 1 agendamento com status "pending" ou "confirmed"

**Passos:**
1. Localizar um agendamento pendente ou confirmado
2. Clicar no botão "Cancelar"
3. Verificar que um dialog modal é exibido
4. Digitar um motivo no campo "Motivo do cancelamento"
5. Clicar no botão "Cancelar Agendamento" no modal
6. Aguardar toast de sucesso
7. Verificar que o dialog fecha
8. Verificar que o agendamento mudou para tab "Cancelados"

**Resultado Esperado:**
- Modal exibe título "Cancelar Agendamento"
- Campo de texto para motivo está presente
- Botão "Cancelar Agendamento" está habilitado
- Toast exibe "Agendamento cancelado com sucesso!"
- Modal fecha automaticamente
- Agendamento aparece na tab "Cancelados"
- Badge de status muda para "Cancelado" (vermelho)
- Métrica da tab original diminui em 1

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Modal exibido? [ ] Sim [ ] Não
Motivo salvo no campo notes? (verificar no banco)
```

---

## T008 - Cancelar Agendamento sem Motivo

**Pré-condição:** Existe pelo menos 1 agendamento com status "pending" ou "confirmed"

**Passos:**
1. Clicar no botão "Cancelar" de um agendamento
2. NO modal, deixar o campo "Motivo" vazio
3. Clicar no botão "Cancelar Agendamento"

**Resultado Esperado:**
- Cancelamento é processado mesmo sem motivo
- Toast de sucesso é exibido
- Agendamento move para tab "Cancelados"

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T009 - Fechar Dialog de Cancelamento

**Pré-condição:** Nenhuma

**Passos:**
1. Clicar no botão "Cancelar" de um agendamento
2. No modal, clicar no botão "Cancelar" (botão de cancelar a ação, não o agendamento)
3. Verificar que o modal fecha

**Resultado Esperado:**
- Modal fecha
- Agendamento NÃO é cancelado
- Permanece na tab original

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

# FASE 3: GESTÃO DE CLIENTES

## T010 - Visualizar Lista de Clientes

**Pré-condição:** Pelo menos 7 clientes no banco

**Passos:**
1. Acessar `/manager/customers`
2. Aguardar carregamento da página

**Resultado Esperado:**
- Exibe 4 cards de métricas:
  - Total de Clientes (7)
  - Recorrentes (clientes com 2+ visitas)
  - Clientes VIP (clientes com 10+ visitas)
  - Lifetime Value (média de gasto por cliente)
- Exibe tabela com colunas:
  - Cliente (nome + telefone)
  - Email
  - Agendamentos (total + concluídos)
  - Total Gasto (valor + média)
  - Pontos de Fidelidade
  - Última Visita
  - Tipo (badge: Novo/Recorrente/VIP)
- Barra de busca presente

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Total Clientes: ___
Recorrentes: ___
VIP: ___
Lifetime Value: R$ ___
```

---

## T011 - Buscar Cliente por Nome

**Pré-condição:** Lista de clientes carregada

**Passos:**
1. Digitar parte do nome de um cliente na barra de busca
2. Aguardar filtro ser aplicado

**Resultado Esperado:**
- Tabela filtra em tempo real
- Exibe apenas clientes cujo nome corresponde à busca
- Busca é case-insensitive
- Limpar busca exibe todos clientes novamente

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T012 - Buscar Cliente por Telefone

**Pré-condição:** Lista de clientes carregada

**Passos:**
1. Digitar parte do telefone de um cliente na barra de busca
2. Aguardar filtro ser aplicado

**Resultado Esperado:**
- Tabela filtra clientes por telefone
- Exibe apenas clientes cujo telefone corresponde à busca

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T013 - Ordenar Clientes por Total Gasto

**Pré-condição:** Lista de clientes carregada

**Passos:**
1. Clicar no cabeçalho da coluna "Total Gasto"
2. Verificar ordenação descendente (maior primeiro)
3. Clicar novamente
4. Verificar ordenação ascendente (menor primeiro)

**Resultado Esperado:**
- Primeira ordenação: clientes com maior gasto aparecem primeiro
- Segunda ordenação: clientes com menor gasto aparecem primeiro
- Indicador de ordenação (seta) aparece no cabeçalho

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T014 - Verificar Badges de Recorrência

**Pré-condição:** Clientes com diferentes quantidades de visitas

**Passos:**
1. Verificar badges na coluna "Tipo" de cada cliente

**Resultado Esperado:**
- Cliente com 0-1 visitas: Badge "Novo" (azul)
- Cliente com 2-9 visitas: Badge "Recorrente" (verde)
- Cliente com 10+ visitas: Badge "VIP" (roxo)

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Badges corretos? [ ] Sim [ ] Não
Clientes com badge incorreto:
```

---

# FASE 4: GESTÃO DE HORÁRIOS

## T015 - Visualizar Horários de Funcionamento

**Pré-condição:** Migração 006_add_store_hours.sql aplicada

**Passos:**
1. Acessar `/manager/hours`
2. Aguardar carregamento da página

**Resultado Esperado:**
- Exibe 7 dias da semana (Domingo a Sábado)
- Cada dia tem:
  - Toggle "Aberto/Fechado"
  - Campos de horário (Abertura/Fechamento) quando aberto
- Botões "Cancelar" e "Salvar Horários"
- Se não há dados, exibe valores padrão (09:00 - 18:00)

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Página carregou? [ ] Sim [ ] Não
Erro no console?
```

---

## T016 - Configurar Dia como Fechado

**Pré-condição:** Página de horários carregada

**Passos:**
1. Localizar o dia "Domingo"
2. Desativar o toggle (mudar para "Fechado")
3. Verificar que os campos de horário desaparecem

**Resultado Esperado:**
- Toggle muda de "Aberto" para "Fechado"
- Campos de horário (Abertura/Fechamento) são ocultados
- Outros dias não são afetados

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T017 - Configurar Dia como Aberto

**Pré-condição:** Dia configurado como fechado

**Passos:**
1. Ativar o toggle do "Domingo" (mudar para "Aberto")
2. Verificar que os campos de horário aparecem

**Resultado Esperado:**
- Toggle muda para "Aberto"
- Campos de horário aparecem com valores padrão
- Campos são editáveis

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T018 - Alterar Horário de Abertura

**Pré-condição:** Dia configurado como aberto

**Passos:**
1. Clicar no campo "Abertura" de Segunda-feira
2. Alterar para "08:00"
3. Clicar no campo "Fechamento"
4. Alterar para "20:00"

**Resultado Esperado:**
- Campos aceitam input de hora
- Valores são atualizados visualmente
- Formato HH:MM é mantido

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T019 - Salvar Horários Válidos

**Pré-condição:** Horários configurados

**Passos:**
1. Configurar horários válidos para todos os dias
   - Segunda: 09:00 - 18:00
   - Terça: 09:00 - 18:00
   - Quarta: Fechado
   - Quinta: 10:00 - 20:00
   - Sexta: 10:00 - 20:00
   - Sábado: 08:00 - 16:00
   - Domingo: Fechado
2. Clicar em "Salvar Horários"
3. Aguardar resposta

**Resultado Esperado:**
- Toast exibe "Horários atualizados com sucesso!"
- Página recarrega os dados
- Dados salvos no banco (verificar tabela store_hours)
- Horários persistem após reload da página

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Toast mostrado? [ ] Sim [ ] Não
Dados persistiram? [ ] Sim [ ] Não
```

---

## T020 - Cancelar Alterações de Horários

**Pré-condição:** Horários já salvos no banco

**Passos:**
1. Alterar horário de Segunda-feira para "07:00 - 22:00"
2. Clicar em "Cancelar"

**Resultado Esperado:**
- Formulário reseta para os valores salvos no banco
- Alterações são descartadas
- Nenhum toast é exibido

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T021 - Validar Horário Inválido (Abertura > Fechamento)

**Pré-condição:** Dia configurado como aberto

**Passos:**
1. Configurar Segunda-feira:
   - Abertura: 18:00
   - Fechamento: 09:00
2. Clicar em "Salvar Horários"

**Resultado Esperado:**
⚠️ **NOTA:** O código atual NÃO valida isso (issue identificado no code review)

**Comportamento Atual:**
- Salva sem validação

**Comportamento Desejado:**
- Toast de erro: "Horário de fechamento deve ser após horário de abertura"
- Não salva no banco

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Salvou sem validar? [ ] Sim [ ] Não
```

---

# FASE 5: CONFIGURAÇÕES DA LOJA

## T022 - Visualizar Configurações da Loja

**Pré-condição:** Store existe no banco

**Passos:**
1. Acessar `/manager/settings`
2. Aguardar carregamento

**Resultado Esperado:**
- Formulário exibe 4 campos:
  - Nome da Loja (preenchido)
  - Endereço (preenchido se existe)
  - Telefone (preenchido se existe)
  - Email (preenchido se existe)
- Botões "Cancelar" e "Salvar Alterações"

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Dados carregados corretamente? [ ] Sim [ ] Não
```

---

## T023 - Editar Nome da Loja

**Pré-condição:** Formulário carregado

**Passos:**
1. Alterar campo "Nome da Loja" para "Nova Barbearia Teste"
2. Clicar em "Salvar Alterações"
3. Aguardar toast

**Resultado Esperado:**
- Toast exibe "Configurações atualizadas com sucesso!"
- Nome da loja é atualizado no banco
- Dashboard é atualizado (contexto da loja)
- Valor persiste após reload

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Nome atualizado no dashboard? [ ] Sim [ ] Não
```

---

## T024 - Editar Endereço, Telefone e Email

**Pré-condição:** Formulário carregado

**Passos:**
1. Alterar "Endereço" para "Rua Teste, 123 - Bairro - Cidade/UF"
2. Alterar "Telefone" para "(11) 98765-4321"
3. Alterar "Email" para "contato@novateste.com"
4. Clicar em "Salvar Alterações"

**Resultado Esperado:**
- Toast de sucesso
- Todos os campos são atualizados no banco
- Valores persistem após reload

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T025 - Tentar Salvar Nome Vazio

**Pré-condição:** Formulário carregado

**Passos:**
1. Limpar campo "Nome da Loja" (deixar vazio)
2. Tentar clicar em "Salvar Alterações"

**Resultado Esperado:**
- Formulário impede submit (campo required)
- Mensagem de validação HTML5 aparece

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T026 - Cancelar Alterações de Configurações

**Pré-condição:** Configurações já salvas

**Passos:**
1. Alterar campo "Nome da Loja"
2. Clicar em "Cancelar"

**Resultado Esperado:**
- Formulário reseta para valores salvos no banco
- Alterações são descartadas

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

# FASE 6: GESTÃO DE USUÁRIOS

## T027 - Visualizar Lista de Usuários

**Pré-condição:** Pelo menos 3 usuários (barbers) no banco com diferentes roles

**Passos:**
1. Acessar `/manager/users`
2. Aguardar carregamento

**Resultado Esperado:**
- Exibe cards em grid (responsivo)
- Cada card mostra:
  - Avatar do usuário
  - Nome
  - Email
  - Badge de role (Barbeiro/Atendente/Gerente)
  - Dropdown para alterar role
  - Botão Ativar/Desativar
  - Badge "Inativo" se usuário está desativado

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Total de usuários: ___
```

---

## T028 - Alterar Role de Usuário (Barber → Attendant)

**Pré-condição:** Existe usuário com role "barber"

**Passos:**
1. Localizar um card de usuário com role "Barbeiro"
2. Clicar no dropdown de role
3. Selecionar "Atendente"
4. Aguardar toast

**Resultado Esperado:**
- Toast exibe "Função atualizada com sucesso!"
- Badge de role muda para "Atendente" (verde)
- Role é atualizada no banco (tabela barbers)
- Lista recarrega com novo role

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Role atualizada no banco? (verificar tabela barbers)
```

---

## T029 - Alterar Role de Usuário (Attendant → Manager)

**Pré-condição:** Existe usuário com role "attendant"

**Passos:**
1. Localizar usuário com role "Atendente"
2. Alterar role para "Gerente"

**Resultado Esperado:**
- Toast de sucesso
- Badge muda para "Gerente" (roxo)
- Role atualizada no banco

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T030 - Desativar Usuário

**Pré-condição:** Existe usuário ativo

**Passos:**
1. Localizar um usuário ativo
2. Clicar no botão "Desativar"
3. Aguardar toast

**Resultado Esperado:**
- Toast exibe "Usuário desativado com sucesso!"
- Badge "Inativo" aparece no card
- Card fica com opacidade reduzida (opacity-60)
- Campo `is_active` no banco muda para false
- Botão muda para "Ativar"

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
is_active=false no banco? [ ] Sim [ ] Não
```

---

## T031 - Ativar Usuário Desativado

**Pré-condição:** Existe usuário desativado (is_active=false)

**Passos:**
1. Localizar um usuário com badge "Inativo"
2. Clicar no botão "Ativar"
3. Aguardar toast

**Resultado Esperado:**
- Toast exibe "Usuário ativado com sucesso!"
- Badge "Inativo" desaparece
- Opacidade do card volta ao normal
- Campo `is_active` no banco muda para true
- Botão muda para "Desativar"

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T032 - Tentar Alterar Role Durante Update

**Pré-condição:** Nenhuma

**Passos:**
1. Clicar para alterar role de um usuário
2. RAPIDAMENTE (antes do toast aparecer) tentar alterar role novamente

**Resultado Esperado:**
- Dropdown fica disabled durante update (submitting=true)
- Segundo clique não executa nada
- Primeiro update completa normalmente

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

# FASE 7: TESTES DE INTEGRAÇÃO

## T033 - Completar Agendamento e Verificar Pontos de Fidelidade

**Pré-condição:**
- Loyalty program ativo
- Cliente com 0 pontos
- Agendamento confirmado com valor conhecido

**Passos:**
1. Anotar pontos atuais do cliente (tabela customers)
2. Completar um agendamento desse cliente
3. Verificar pontos após completar

**Resultado Esperado:**
- Pontos do cliente aumentam proporcionalmente ao valor gasto
- Cálculo: `pontos_ganhos = final_price * points_per_real`
- Registro criado em loyalty_transactions

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Pontos antes: ___
Valor do agendamento: R$ ___
Points_per_real: ___
Pontos esperados: ___
Pontos obtidos: ___
```

---

## T034 - Aplicar Cupom e Completar Agendamento

**Pré-condição:**
- Cupom ativo com desconto conhecido
- Agendamento confirmado com cupom aplicado

**Passos:**
1. Verificar campo `coupon_id` no agendamento
2. Verificar `discount_amount` e `final_price`
3. Completar o agendamento
4. Verificar que `current_uses` do cupom aumentou

**Resultado Esperado:**
- `current_uses` aumenta em 1
- Se cupom atingir `max_uses`, `is_active` muda para false

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
current_uses antes: ___
current_uses depois: ___
Cupom desativado (se max_uses atingido)? [ ] Sim [ ] Não [ ] N/A
```

---

## T035 - Editar Loja e Verificar Atualização em Tempo Real

**Pré-condição:**
- Dashboard aberto em uma aba
- Configurações da loja aberta em outra aba

**Passos:**
1. Aba 1: Dashboard carregado
2. Aba 2: Alterar nome da loja e salvar
3. Aba 1: Verificar se nome foi atualizado (pode precisar reload)

**Resultado Esperado:**
- StoreContext é atualizado após salvar (função `setStoreBySlug` é chamada)
- Nome no dashboard pode precisar de refresh manual (⚠️ não há auto-refresh)

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T036 - Desativar Usuário e Verificar Acesso

**Pré-condição:**
- Usuário com role "barber" ou "attendant" autenticado em outra sessão

**Passos:**
1. Como Manager: desativar o usuário
2. Como usuário desativado: tentar acessar dashboard
3. Verificar se RLS permite ou bloqueia

**Resultado Esperado:**
⚠️ **NOTA:** RLS atual usa `is_active` nas políticas `barbers_select_active`

**Comportamento Esperado:**
- Usuário desativado NÃO deve conseguir acessar dados
- Queries devem retornar vazio ou erro de permissão

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Usuário bloqueado? [ ] Sim [ ] Não
```

---

# FASE 8: TESTES DE PERFORMANCE

## T037 - Performance de Carregamento de Agendamentos

**Passos:**
1. Abrir DevTools → Network tab
2. Acessar `/manager/appointments`
3. Medir tempo de carregamento

**Resultado Esperado:**
- Página carrega em <2s (com poucos dados)
- API `/api/...` responde em <1s

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Tempo total: ___ms
Tempo API: ___ms
```

---

## T038 - Performance de Busca de Clientes

**Passos:**
1. Acessar `/manager/customers`
2. Digitar 3 caracteres na busca
3. Medir tempo de resposta

**Resultado Esperado:**
- Busca filtra em <500ms (client-side)
- Sem requisição ao servidor (filtro é local)

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T039 - Performance de Update de Status

**Passos:**
1. Confirmar um agendamento
2. Medir tempo entre clique e toast

**Resultado Esperado:**
- Update completa em <1s
- Toast aparece rapidamente

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Tempo de update: ___ms
```

---

# FASE 9: TESTES DE UI/UX

## T040 - Responsividade em Mobile (375px)

**Passos:**
1. Abrir DevTools → Device Toolbar
2. Selecionar iPhone SE (375px)
3. Navegar por todas as páginas

**Resultado Esperado:**
- Todas páginas são responsivas
- Cards empilham verticalmente
- Tabelas são scrolláveis horizontalmente
- Botões são clicáveis e não sobrepostos
- Texto não ultrapassa viewport

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Páginas com problemas:**
```
/manager/appointments: [ ] OK [ ] Problema
/manager/customers: [ ] OK [ ] Problema
/manager/settings: [ ] OK [ ] Problema
/manager/hours: [ ] OK [ ] Problema
/manager/users: [ ] OK [ ] Problema
```

---

## T041 - Responsividade em Tablet (768px)

**Passos:**
1. Selecionar iPad (768px)
2. Navegar por todas as páginas

**Resultado Esperado:**
- Grid de cards adapta para 2 colunas
- Tabelas usam espaço disponível
- Layout otimizado para tablet

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T042 - Acessibilidade de Teclado

**Passos:**
1. Usar TAB para navegar por `/manager/appointments`
2. Verificar se todos elementos interativos são alcançáveis
3. Usar ENTER/SPACE para ativar botões

**Resultado Esperado:**
- Todos botões são navegáveis via TAB
- Focus visible (outline) em elementos focados
- ENTER/SPACE ativa botões
- Modais podem ser fechados com ESC

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T043 - Cores e Contraste

**Passos:**
1. Verificar contraste de badges (Pendente, Confirmado, etc.)
2. Verificar contraste de texto em cards
3. Usar ferramenta de contraste (ex: Chrome DevTools)

**Resultado Esperado:**
- Contraste mínimo WCAG AA: 4.5:1 para texto normal
- Badges são legíveis em todos temas

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

# FASE 10: TESTES DE ERROS E EDGE CASES

## T044 - Erro de Rede ao Salvar Horários

**Passos:**
1. Abrir DevTools → Network
2. Ativar "Offline"
3. Tentar salvar horários

**Resultado Esperado:**
- Toast de erro exibe mensagem clara
- Formulário não reseta
- Usuário pode tentar novamente ao voltar online

**Resultado Obtido:** [ ] OK | [ ] ERRO

**Evidências:**
```
Mensagem de erro mostrada:
```

---

## T045 - Erro ao Confirmar Agendamento Inexistente

**Passos:**
1. Anotar ID de um agendamento
2. Deletar o agendamento diretamente no banco
3. Tentar confirmar o agendamento na UI

**Resultado Esperado:**
- Toast de erro: "Erro ao atualizar status"
- Tabela recarrega e agendamento não aparece mais

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T046 - Formulário com Dados Muito Longos

**Passos:**
1. Acessar `/manager/settings`
2. Colar texto de 1000 caracteres no campo "Endereço"
3. Tentar salvar

**Resultado Esperado:**
- Formulário aceita ou limita caracteres
- Se aceitar, salva corretamente
- Se limitar, mostra contador ou mensagem

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T047 - Múltiplos Usuários Editando Simultaneamente

**Passos:**
1. Manager 1: Abre `/manager/hours`
2. Manager 2: Abre `/manager/hours`
3. Manager 1: Altera Segunda para 08:00-18:00 e salva
4. Manager 2: Altera Segunda para 10:00-20:00 e salva

**Resultado Esperado:**
⚠️ **NOTA:** Não há locking otimista implementado

**Comportamento Atual:**
- Último a salvar sobrescreve o primeiro (last-write-wins)

**Comportamento Desejado:**
- Avisar Manager 2 que dados foram alterados

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

## T048 - Página sem Dados (Empty States)

**Passos:**
1. Criar uma nova store vazia (sem agendamentos, clientes, etc.)
2. Acessar todas as páginas

**Resultado Esperado:**
- `/manager/appointments`: Exibe "Nenhum agendamento encontrado"
- `/manager/customers`: Exibe "Nenhum cliente encontrado"
- `/manager/users`: Exibe "Nenhum usuário encontrado"
- Métricas exibem 0

**Resultado Obtido:** [ ] OK | [ ] ERRO

---

# RESUMO DE TESTES

## Estatísticas

- **Total de Testes:** 48
- **Testes OK:** ___
- **Testes com ERRO:** ___
- **Taxa de Sucesso:** ___%

## Testes Críticos (Bloqueadores)

| ID | Teste | Status | Prioridade |
|----|-------|--------|------------|
| T001 | Acessar Dashboard | [ ] | 🔴 CRÍTICA |
| T003 | Visualizar Agendamentos | [ ] | 🔴 CRÍTICA |
| T005 | Confirmar Agendamento | [ ] | 🔴 CRÍTICA |
| T015 | Visualizar Horários | [ ] | 🔴 CRÍTICA |
| T022 | Visualizar Configurações | [ ] | 🔴 CRÍTICA |
| T027 | Visualizar Usuários | [ ] | 🔴 CRÍTICA |

## Bugs Conhecidos (do Code Review)

| ID | Descrição | Severidade | Testes Afetados |
|----|-----------|------------|-----------------|
| BUG-001 | cancelAppointment sobrescreve notes completamente | 🟡 Média | T007 |
| BUG-002 | updateStoreHours deleta sem transação | 🔴 Alta | T019 |
| BUG-003 | Filtro de customers usa !inner incorretamente | 🔴 Alta | T010, T011 |
| BUG-004 | Falta validação open_time < close_time | 🟡 Média | T021 |

---

## Próximos Passos

1. ✅ Aplicar migração 006_add_store_hours.sql
2. ⬜ Executar todos os testes manualmente
3. ⬜ Preencher resultados no relatório
4. ⬜ Identificar bugs adicionais
5. ⬜ Priorizar correções
6. ⬜ Re-testar após correções
