# 🚀 WISEVEO - Aceleração Financeira Open-Source

WISEVEO é um sistema de controle financeiro pessoal e análise de DRE, moderno, rápido, e totalmente auto-hospedável (self-hosted). Projetado para desenvolvedores e usuários avançados que valorizam a privacidade de seus dados financeiros.

A versão open-source é **independente**, **gratuita** e foi desenhada sob o conceito de "Zero-Config" ou configuração mínima para rodar localmente ou em nuvem própria (Vercel, Railway, Neon, etc.).

---

## ✨ Principais Recursos

- 📊 **Dashboard Financeiro Completo**: Visão geral de receitas, despesas, economias e fluxo de caixa mensal.
- 💸 **Plano de Contas Customizável**: Categorias e grupos prontos para uso, mas 100% alteráveis via painel de configurações.
- 🔁 **Transações Recorrentes**: Gerencie contas mensais, salários e assinaturas com geração de lançamentos automática.
- 🎯 **Orçamentos Mensais**: Defina limites de gastos por grupo ou categoria e acompanhe o progresso visualmente.
- 📈 **Análise de DRE e Forecasting**: Modelos preditivos de saldo e balanços de competência para planejamento futuro.
- 🌍 **Tradução Multilíngue Integrada**: Suporte nativo a **Português (pt-BR)**, **Inglês (en)** e **Espanhol (es)** com alteração rápida no painel ou login.
- 🔒 **Self-Hosted e Seguro**: Autenticação robusta baseada em JWT HTTP-only e controle absoluto sobre o seu banco de dados.

---

## ⚡ Quick Start (Setup "Plug-and-Play")

O WISEVEO conta com um **Wizard de Configuração Visual**. Você não precisa editar arquivos `.env` manualmente na primeira vez.

### Pré-requisitos
- Node.js 20+
- Docker (opcional, para rodar o banco localmente num clique) ou uma string de conexão PostgreSQL.

### Passo 1: Instalação
```bash
git clone https://github.com/afild/wiseveo.git
cd wiseveo
npm install
```

### Passo 2: Iniciar e Configurar
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador. Você será redirecionado automaticamente para o **Assistente de Configuração (Setup Wizard)**, que guiará você por:
1. Escolha do idioma
2. Conexão do banco de dados (ou iniciar um container Docker local)
3. Criação da conta de administrador principal
4. Integrações opcionais (Google, Telegram, IA)
5. Customização do seu Plano de Contas inicial

Ao finalizar o wizard, o sistema aplica as migrações, salva tudo com segurança e você estará pronto para usar!

---

## 🧪 Modo Demonstração (Cloud Demo)

Quer ver o sistema funcionando em produção com dados fictícios sem precisar instalar nada?

👉 **[demo.wiseveo.com](https://demo.wiseveo.com)** — A demo é provisionada automaticamente ao acessar: um usuário temporário isolado é criado com 300 transações realistas cobrindo os últimos 9 meses, e você é autenticado instantaneamente no dashboard.

- ✅ Nenhuma conta necessária
- ✅ Dados 100% fictícios e isolados por sessão
- ✅ Usuário temporário apagado automaticamente após 24h

Para rodar localmente com dados de seed, consulte o arquivo `docs/SETUP.md`.

---

## ⚙️ Integrações Opcionais (Opt-in)

O WISEVEO foi desenhado de forma que recursos avançados que dependem de terceiros sejam opcionais e ativados apenas se as variáveis correspondentes estiverem definidas no `.env`:

### 📅 Google Calendar & Google OAuth
Para sincronizar transações agendadas no calendário ou fazer login via Google:
- Crie um projeto no Google Cloud Console.
- Configure as credenciais do OAuth Client ID.
- Insira as chaves no seu `.env`:
  ```env
  GOOGLE_CLIENT_ID="seu-client-id"
  GOOGLE_CLIENT_SECRET="seu-client-secret"
  ```

### 🤖 Assistente do Telegram & IA (OpenAI)
Para se conectar ao seu bot do Telegram e registrar transações enviando mensagens por áudio ou texto de forma natural:
- Crie um bot de conversa com o `@BotFather` no Telegram.
- Adicione as variáveis abaixo no `.env`:
  ```env
  TELEGRAM_BOT_TOKEN="token-do-seu-bot"
  TELEGRAM_BOT_USERNAME="username-do-seu-bot"
  TELEGRAM_WEBHOOK_SECRET="uma-chave-aleatoria-para-webhook"
  OPENAI_API_KEY="sua-api-key-openai" # Requerido para interpretar texto natural
  ```
- Para registrar o webhook oficial, rode a URL no navegador:
  `http://localhost:3000/api/telegram/register-webhook?secret=SUA_TELEGRAM_WEBHOOK_SECRET`

---

## 📦 Deploy na Vercel (ou Similar)

1. Crie um banco PostgreSQL gerenciado na nuvem (ex: Neon, Supabase, Railway).
2. Configure seu repositório no painel da Vercel.
3. Adicione as variáveis de ambiente necessárias (`DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`).
4. A Vercel executará o script `build` (que já gera o Prisma Client automaticamente) e o app estará no ar!

---

## 📜 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
