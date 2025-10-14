# GoBarber - Guia de Setup Completo

Guia passo a passo para configurar e rodar o projeto GoBarber localmente.

## 📋 Pré-requisitos

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** ou **pnpm** (vem com Node.js)
- Conta no **Supabase** ([Criar conta](https://supabase.com))
- Conta no **Resend** para emails ([Criar conta](https://resend.com))
- Conta no **Twilio** para SMS (opcional) ([Criar conta](https://twilio.com))

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd apps/app-barber
```

### 2. Instale as Dependências

```bash
npm install
# ou
pnpm install
```

### 3. Configure o Supabase

#### 3.1 Crie um Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote:
   - **Project URL** (ex: `https://xxx.supabase.co`)
   - **API Key** (anon/public key)

#### 3.2 Execute as Migrações

As migrações SQL estão em `/scripts`. Execute-as na ordem:

```sql
-- No SQL Editor do Supabase, execute nesta ordem:
-- 1. scripts/001_create_tables.sql
-- 2. scripts/002_enable_rls.sql
-- 3. scripts/003_connect_auth_with_customers.sql
-- 4. scripts/004_add_appointment_metadata.sql
```

**Ou use o Supabase CLI:**

```bash
# Instale o Supabase CLI
npm install -g supabase

# Inicie o Supabase localmente
supabase init
supabase start

# Execute as migrações
supabase db push
```

#### 3.3 Configure o Storage

Execute no SQL Editor:

```sql
-- Criar bucket de avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Políticas RLS (ver docs/AVATAR_UPLOAD.md para detalhes)
```

### 4. Configure Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Resend (Email)
RESEND_API_KEY=re_xxx

# Twilio (SMS) - Opcional
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+5511xxxxx

# Cron Security (Reminders)
CRON_SECRET=seu_segredo_aleatorio_aqui

# App URL (para links em emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Popule Dados Iniciais

Crie uma loja e alguns dados de exemplo:

```sql
-- Inserir loja exemplo
INSERT INTO stores (name, slug, address, phone, email) VALUES
('GoBarber Centro', 'centro', 'Rua Principal, 123 - Centro', '(11) 3000-2000', 'centro@gobarber.com');

-- Inserir serviços (use o store_id da loja criada)
INSERT INTO services (store_id, name, description, duration, price, category) VALUES
('<store-id>', 'Corte Clássico', 'Corte tradicional com tesoura e máquina', 30, 35.00, 'haircut'),
('<store-id>', 'Barba Completa', 'Tratamento completo com toalha quente', 30, 40.00, 'beard'),
('<store-id>', 'Combo Completo', 'Corte + Barba', 60, 70.00, 'combo');
```

**Ou use o seeder fornecido:**

```bash
npm run seed
```

### 6. Execute o Projeto

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 🔐 Autenticação

### Criar Primeiro Barbeiro (Admin)

1. Acesse o Supabase Dashboard → Authentication
2. Crie um usuário manualmente
3. Copie o User ID
4. Insira no banco:

```sql
INSERT INTO barbers (id, store_id, name, email, role, is_active) VALUES
('<user-id-from-auth>', '<store-id>', 'João Silva', 'joao@gobarber.com', 'manager', true);
```

### Login de Cliente

Clientes podem se registrar diretamente pelo app em:
- `/customer/register`

Ou fazer login em:
- `/customer/login`

## 📧 Configurar Notificações

### Email (Resend)

1. Crie conta em [resend.com](https://resend.com)
2. Gere API Key
3. Adicione ao `.env.local`:
   ```
   RESEND_API_KEY=re_xxx
   ```
4. Configure domínio (opcional):
   - Adicione domínio no Resend
   - Adicione registros DNS
   - Atualize `from` em `/lib/notifications/email.ts`

### SMS (Twilio)

1. Crie conta em [twilio.com](https://twilio.com)
2. Obtenha credenciais
3. Compre número de telefone
4. Adicione ao `.env.local`:
   ```
   TWILIO_ACCOUNT_SID=ACxxx
   TWILIO_AUTH_TOKEN=xxx
   TWILIO_PHONE_NUMBER=+5511xxxxx
   ```

### Lembretes Automáticos

Configure cron jobs para enviar lembretes:

**Vercel Cron (Recomendado):**

O arquivo `vercel.json` já está configurado. Apenas:
1. Faça deploy na Vercel
2. Configure `CRON_SECRET` nas variáveis de ambiente

**Ou use serviço externo:**
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://easycron.com)

Consulte `docs/REMINDERS.md` para mais detalhes.

## 🎨 Multi-Tenancy

O sistema é multi-tenant por design. Cada loja é independente.

### Selecionar Loja Ativa

O app usa um `StoreProvider` que:
1. Detecta loja pelo subdomínio (ex: `centro.gobarber.com`)
2. Ou permite seleção manual em `/select-store`

### Adicionar Nova Loja

```sql
INSERT INTO stores (name, slug, address, phone, email) VALUES
('GoBarber Zona Oeste', 'zona-oeste', 'Av. Oeste, 456', '(11) 3000-3000', 'oeste@gobarber.com');
```

## 🧪 Testar Fluxo Completo

1. **Acesse a home:** [http://localhost:3000](http://localhost:3000)
2. **Selecione serviços:** Clique em "Agendar Seu Horário"
3. **Escolha barbeiro, data e hora**
4. **Cadastre-se ou faça login**
5. **Confirme o agendamento**
6. **Verifique email/SMS de confirmação**

## 📊 Acessar Dashboard de Admin

O dashboard de admin está em desenvolvimento. Por enquanto, use:
- **Supabase Dashboard** para gerenciar dados
- **SQL Editor** para queries customizadas

## 🛠️ Desenvolvimento

### Estrutura de Pastas

```
app-barber/
├── app/                    # Next.js App Router
│   ├── customer/          # Rotas do cliente
│   ├── api/               # API Routes
│   └── page.tsx           # Home page
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn)
│   └── ...               # Componentes específicos
├── lib/                  # Utilitários e lógica
│   ├── supabase/        # Cliente Supabase
│   ├── notifications/   # Sistema de notificações
│   └── ...              # Outras libs
├── docs/                # Documentação
└── scripts/             # Migrações SQL
```

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar produção localmente
npm run start

# Lint
npm run lint

# Seed database
npm run seed
```

### Adicionar Nova Feature

1. **Criar migração SQL** em `/scripts`
2. **Adicionar tipos** em `/lib/types`
3. **Criar funções** em `/lib`
4. **Criar componentes** em `/components`
5. **Criar rotas** em `/app`

## 🐛 Troubleshooting

### Erro: "Supabase client not configured"

**Solução:** Verifique se `.env.local` tem as variáveis corretas:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Erro: "Failed to fetch"

**Possíveis causas:**
1. Supabase project pausado (free tier)
2. RLS policies bloqueando acesso
3. Tabelas não criadas

**Solução:**
- Verifique status do projeto no Supabase
- Execute todas as migrações
- Revise políticas RLS

### Notificações não estão sendo enviadas

**Verifique:**
1. API keys estão corretas no `.env.local`
2. Logs do console para erros
3. Limites de free tier (Resend: 100 emails/dia, Twilio: créditos)

### Avatar upload falha

**Verifique:**
1. Bucket `avatars` existe e é público
2. Políticas RLS configuradas corretamente
3. Arquivo não excede 5MB

Consulte `docs/AVATAR_UPLOAD.md` para mais detalhes.

## 📚 Documentação Adicional

- [Sistema de Notificações](./REMINDERS.md)
- [Avatar Upload](./AVATAR_UPLOAD.md)
- [Arquitetura Multi-Tenant](./ARCHITECTURE.md) (em breve)
- [API Reference](./API.md) (em breve)

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte repositório no Vercel
2. Configure variáveis de ambiente
3. Deploy automático em cada push

### Outras Plataformas

O app é compatível com qualquer plataforma que suporte Next.js:
- Railway
- Render
- AWS Amplify
- Google Cloud Run

## 💡 Próximos Passos

Após setup inicial:

1. ✅ Configure notificações (Email/SMS)
2. ✅ Adicione barbeiros e serviços
3. ✅ Teste fluxo de agendamento
4. 🔜 Personalize branding
5. 🔜 Configure domínio customizado
6. 🔜 Implemente dashboard admin

## 🤝 Contribuindo

PRs são bem-vindos! Para mudanças grandes:
1. Abra uma issue primeiro
2. Faça fork do projeto
3. Crie feature branch
4. Commit suas mudanças
5. Push para branch
6. Abra Pull Request

## 📝 Licença

[Adicionar licença aqui]

## 📞 Suporte

Encontrou um bug ou precisa de ajuda?
- Abra uma [issue](link-para-issues)
- Entre em contato: [email]
