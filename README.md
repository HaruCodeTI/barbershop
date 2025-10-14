# 💈 GoBarber - Sistema Completo de Agendamento para Barbearias

Sistema moderno e completo de agendamento para barbearias com multi-tenancy, notificações automáticas, sistema de fidelidade e muito mais.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/harucodes-projects/gobarber)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

## ✨ Features

### 🎯 Core Features

- ✅ **Multi-Tenancy Completo** - Múltiplas lojas independentes
- ✅ **Agendamento Online** - Interface intuitiva para clientes
- ✅ **Gestão de Barbeiros** - Perfis, especialidades e disponibilidade
- ✅ **Catálogo de Serviços** - Cortes, barba, combos, etc.
- ✅ **Sistema de Autenticação** - Login/registro com Supabase Auth
- ✅ **Notificações Automáticas**
  - 📧 Email via Resend (confirmação, lembretes, cancelamento)
  - 📱 SMS via Twilio (confirmação e lembretes de 1h)
  - ⏰ Lembretes automáticos (24h email, 1h SMS)

### 💎 Features Avançadas

- ✅ **Sistema de Cupons** - Descontos percentuais ou fixos com validação
- ✅ **Programa de Fidelidade** - Pontos por agendamento e recompensas
- ✅ **Recomendações Personalizadas** - IA sugere barbeiros e serviços
- ✅ **Upload de Avatars** - Supabase Storage com CDN

## 🚀 Quick Start

```bash
# 1. Clone o repositório
git clone <repo-url>
cd apps/app-barber

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Execute migrações do Supabase
# Ver docs/SETUP.md para detalhes

# 5. Inicie o servidor
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

📖 **[Guia de Setup Completo](./docs/SETUP.md)**

## 🛠️ Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui

**Backend:** Supabase (PostgreSQL + Auth + Storage)

**Integrações:** Resend (Email), Twilio (SMS), Vercel Cron

## 📊 MVP Roadmap

- ✅ **Phase 1** - Multi-Tenancy (100%)
- ✅ **Phase 2** - Cupons & Fidelidade (100%)
- ✅ **Phase 3** - Autenticação (100%)
- ✅ **Phase 4** - Notificações (100%)
- ✅ **Phase 5** - Polish Final (100%)
- 🔜 **Phase 6** - Admin Dashboard (Próximo)

## 📚 Documentação

- [Guia de Setup](./docs/SETUP.md)
- [Sistema de Notificações](./docs/REMINDERS.md)
- [Avatar Upload](./docs/AVATAR_UPLOAD.md)

## 🌐 Deploy

**Live:** [https://vercel.com/harucodes-projects/gobarber](https://vercel.com/harucodes-projects/gobarber)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

**Feito com ❤️ e ☕ - Desenvolvido com Claude Code 🚀**