# ContandoDinheiro

**Suas finanças pessoais em um painel simples, visual e acessível.**

O ContandoDinheiro é uma aplicação web em português para registrar receitas e despesas, acompanhar o saldo e entender como o dinheiro é distribuído ao longo do mês. Combina um painel com gráficos, autenticação com Google e armazenamento no Supabase, além de uma demonstração que pode ser explorada sem criar conta.

[Acessar a aplicação](https://contando-dinheiro.vercel.app/) · [Reportar um problema](https://github.com/jonasnunees/ContandoDinheiro/issues)

## Conteúdo

- [Funcionalidades](#funcionalidades)
- [Como usar](#como-usar)
- [Tecnologias](#tecnologias)
- [Executar localmente](#executar-localmente)
- [Configurar o Supabase](#configurar-o-supabase)
- [Instalação e funcionamento offline](#instalação-e-funcionamento-offline)
- [Segurança e dados](#segurança-e-dados)
- [Comandos e verificações](#comandos-e-verificações)
- [Publicação](#publicação)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Solução de problemas](#solução-de-problemas)
- [Contribuições](#contribuições)
- [Licença](#licença)

## Funcionalidades

- **Gestão de lançamentos:** criação, edição e exclusão de receitas e despesas, com descrição, valor, data, categoria e forma de pagamento.
- **Controle de pendências:** alternância entre pago e pendente, com totais a pagar e a receber.
- **Resumo financeiro:** entradas recebidas, saídas pagas, saldo atual, taxa de economia e quantidade de transações.
- **Consulta por período:** seleção de mês e ano ou visualização de todo o ano.
- **Filtros e busca:** filtro por receita/despesa e por status; busca textual na descrição, categoria e forma de pagamento.
- **Gráficos interativos:** despesas por categoria, distribuição por forma de pagamento e comparação de receitas e despesas.
- **Exportação CSV:** download dos lançamentos do recorte atual para análise em planilhas.
- **Autenticação com Google:** acesso sem senha própria, com dados vinculados à conta autenticada.
- **Demonstração sem login:** dados de exemplo e operações locais para conhecer o painel.
- **Interface responsiva:** adaptação para celular e computador, com temas claro e escuro.
- **PWA:** instalação em navegadores compatíveis, ícones próprios e aviso de perda de conexão.

As categorias disponíveis incluem Alimentação, Moradia, Transporte, Saúde, Educação, Lazer, Salário, Investimentos, Serviços e Outros. As formas de pagamento incluem Pix, cartões de crédito e débito, dinheiro, boleto, transferência e outro.

## Como usar

1. Abra a [aplicação](https://contando-dinheiro.vercel.app/).
2. Escolha **Explorar demonstração sem login** para conhecer os recursos ou acesse com sua conta Google para salvar seus próprios lançamentos.
3. Crie uma transação e informe os dados financeiros, incluindo o status pago ou pendente.
4. Selecione o período desejado e acompanhe os cartões de resumo e gráficos.
5. Use os filtros e a busca para encontrar lançamentos. Para levar os dados a uma planilha, utilize o botão **CSV**.

O saldo considera receitas e despesas com status **pago**. Os valores pendentes aparecem separadamente. Os gráficos de categorias e fluxo consideram apenas pagamentos e recebimentos realizados. O gráfico de formas de pagamento inclui também pendências. Todos possuem uma tabela alternativa acessível.

## Tecnologias

| Tecnologia | Papel no projeto |
| --- | --- |
| React 19 e TypeScript | Interface e tipagem dos dados |
| Vite | Desenvolvimento e compilação de produção |
| Tailwind CSS 4 | Estilos e interface responsiva |
| Chart.js | Gráficos financeiros |
| Supabase | Autenticação, PostgreSQL e políticas de acesso |
| Lucide React | Ícones da interface |
| vite-plugin-pwa | Manifesto, service worker e instalação como PWA |
| Node.js Test Runner e PGlite | Testes de regressão e validação local das regras de banco |
| Vercel | Hospedagem da aplicação publicada |

## Executar localmente

### Pré-requisitos

- Git.
- Node.js **22.12 ou superior** e npm.
- Um navegador atualizado.
- Para autenticação e persistência na nuvem: um projeto Supabase e credenciais OAuth do Google.

### Instalação

```bash
git clone https://github.com/jonasnunees/ContandoDinheiro.git
cd ContandoDinheiro
npm ci
npm run dev
```

Abra **http://localhost:3000**. A demonstração pode ser usada sem configurar variáveis de ambiente. Nesse modo, as transações ficam no armazenamento local do navegador.

O arquivo `package-lock.json` fixa as dependências utilizadas nas verificações. Use npm e `npm ci` para instalações reproduzíveis; o `bun.lock` histórico não representa as novas ferramentas de validação.

### Variáveis de ambiente

Para conectar sua instalação ao Supabase, crie `.env.local` na raiz:

```dotenv
VITE_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
VITE_SUPABASE_ANON_KEY="SUA_CHAVE_PUBLICA_PUBLISHABLE_OU_ANON"
```

| Variável | Descrição |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase que armazenará os dados |
| `VITE_SUPABASE_ANON_KEY` | Chave pública publishable (`sb_publishable_…`) ou chave legada com papel `anon` |

Preencha **as duas variáveis** e reinicie o servidor de desenvolvimento. Quando definidas, elas fixam a conexão da aplicação e têm prioridade sobre configurações armazenadas no navegador.

O arquivo [`.env.example`](.env.example) também contém `GEMINI_API_KEY` e `APP_URL`, provenientes do ambiente original de desenvolvimento. Essas variáveis não são necessárias para as funcionalidades financeiras atuais.

Variáveis com prefixo `VITE_` são incorporadas ao código enviado ao navegador. Use apenas a chave pública do Supabase: nunca uma chave `service_role`, uma chave `sb_secret_…` ou o segredo OAuth do Google. O arquivo `.env.local` é ignorado pelo Git.

## Configurar o Supabase

### 1. Criar as tabelas e políticas

Crie seu projeto Supabase e abra o SQL Editor. Execute o conteúdo da migração completa:

- [`20261002210000_security_hardening.sql`](supabase/migrations/20261002210000_security_hardening.sql)

Ela cria as tabelas, os índices, as políticas de acesso e os triggers utilizados pela aplicação:

| Tabela | Finalidade |
| --- | --- |
| `public.usuarios` | Perfil associado à conta em `auth.users` |
| `public.transacoes` | Lançamentos financeiros vinculados ao proprietário |
| `public.logs_atividades` | Auditoria das alterações de transações, gerada pelo banco |

Para instalações anteriores que precisam recuperar perfis de contas já existentes, há a migração incremental [`20261002220000_backfill_existing_profiles.sql`](supabase/migrations/20261002220000_backfill_existing_profiles.sql). Essa recuperação já está incluída na migração completa; o arquivo incremental não substitui a criação do schema.

O código também mantém o script de configuração em [`src/services/supabase-sql.ts`](src/services/supabase-sql.ts).

### 2. Habilitar o Google

Crie um cliente OAuth do tipo aplicação web no Google Cloud, configure a tela de consentimento e informe o Client ID e o Client Secret no provedor Google do Supabase. Cadastre a origem da aplicação no cliente Google e a URL de callback indicada pelo Supabase como URI de redirecionamento autorizada:

```text
https://SEU-PROJETO.supabase.co/auth/v1/callback
```

Consulte o [guia oficial de autenticação Google](https://supabase.com/docs/guides/auth/social-login/auth-google) para os detalhes do cadastro e das permissões.

### 3. Configurar o retorno à aplicação

Em **Authentication → URL Configuration**, defina a **Site URL** da sua instalação e inclua as origens usadas pela aplicação em **Redirect URLs**. A aplicação solicita o retorno à origem atual do navegador, por exemplo `http://localhost:3000` durante o desenvolvimento e o domínio HTTPS na produção. Veja a [documentação de URLs de retorno](https://supabase.com/docs/guides/auth/redirect-urls).

### 4. Validar o fluxo

Com as variáveis locais preenchidas, entre com Google, crie uma transação e recarregue a página para conferir a persistência. Use duas contas distintas para verificar que cada uma visualiza somente seus próprios dados.

## Instalação e funcionamento offline

Em navegadores compatíveis, use o botão de instalação da aplicação ou a opção **Instalar aplicativo / Adicionar à tela inicial** do navegador. A instalação depende do suporte do dispositivo e de uma origem segura, como HTTPS ou localhost.

O service worker armazena os arquivos da aplicação para permitir seu carregamento após um acesso anterior, conforme o cache disponível. As transações de demonstração são persistidas no `localStorage` do navegador.

**As operações com uma conta autenticada dependem de conexão com o Supabase.** Não há fila de alterações offline nem sincronização automática posterior de lançamentos. O cache da PWA não equivale a uma cópia offline do banco de dados.

## Segurança e dados

### Retenção dos logs por 90 dias

A migração `supabase/migrations/20261006002719_logs_retention_90_days.sql` ativa o Supabase Cron e agenda a limpeza de `public.logs_atividades` a cada minuto. Aplique essa migração também em novas instalações, após criar o schema. O SQL inicial exibido pelo aplicativo não inclui esse agendamento.

Cada registro é apagado somente quando seu `created_at` completa 90 dias (2.160 horas). Por exemplo, um log criado às 14h30 fica elegível à exclusão às 14h30, 90 dias depois, e é removido na próxima execução bem-sucedida. Logs recentes e transações financeiras são preservados. Se o banco ficar indisponível, a rotina remove os logs vencidos quando voltar a executar.

A rotina `logs_atividades_retention_90_days` pode ser consultada em **Integrations → Cron → Jobs** no Supabase. A reaplicação atualiza o mesmo agendamento, sem duplicá-lo. Consulte a [documentação do Supabase Cron](https://supabase.com/docs/guides/cron/quickstart).

- As tabelas utilizam **Row Level Security (RLS)** para restringir o acesso aos registros do proprietário autenticado.
- O serviço valida a identidade com o Supabase antes das operações autenticadas e determina o proprietário a partir da sessão.
- Os logs de criação, edição e exclusão são escritos por triggers no banco. Clientes do navegador não têm acesso direto à tabela de auditoria.
- As funções privilegiadas possuem caminho de pesquisa fixado e execução direta revogada para os papéis de cliente.
- A exportação CSV trata textos que poderiam ser interpretados como fórmulas por aplicativos de planilha.
- Dados de demonstração ficam restritos ao navegador e não são transferidos automaticamente para a conta Google. Limpar os dados do site remove os lançamentos locais.

As proteções do banco dependem da aplicação correta do schema e das políticas na instalação utilizada. As migrações em `supabase/migrations/` e os testes de segurança documentam as regras de acesso previstas no projeto. Cada instalação deve verificar suas próprias configurações de autenticação e permissões.

Credenciais, dados reais, exportações, backups e relatórios internos devem permanecer fora do versionamento. O `.env.example` contém apenas exemplos de configuração; use `.env.local` para os valores da sua instalação. As pastas `private/`, `backups/` e `exports/` são ignoradas pelo Git para armazenar arquivos locais. O `.gitignore` não remove conteúdo de commits anteriores.

## Comandos e verificações

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Iniciar o servidor de desenvolvimento na porta 3000 |
| `npm run build` | Gerar a aplicação de produção em `dist/` |
| `npm run preview` | Servir localmente a compilação de produção |
| `npm run lint` | Verificar tipos estritos, regras React e acessibilidade com ESLint |
| `npm run test:security` | Executar testes das proteções do serviço, CSV e regras de banco |
| `npm run test:auth` | Executar testes de regressão do fluxo de autenticação e navegação |
| `npm run test:validation` | Validar valores monetários, datas e armazenamento |
| `npm run test:e2e` | Testar teclado, persistência e acessibilidade com Playwright e axe |

Antes de propor alterações, execute:

```bash
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Os testes automatizados não substituem um login real com Google para validar as credenciais e URLs de retorno do ambiente publicado.

Há também o diagnóstico `node scripts/check-supabase-connection.mjs`, que lê `.env.local`, consulta a configuração pública de autenticação e inspeciona o site publicado. Esse script está direcionado à instalação original, inclusive com identificação do projeto no código; adapte-o antes de utilizá-lo em outra instalação. Ele não efetua login.

## Publicação

A aplicação gera arquivos estáticos em `dist/`, que podem ser hospedados em um serviço compatível.

Na Vercel, importe o repositório e configure:

| Configuração | Valor |
| --- | --- |
| Framework | Vite |
| Comando de instalação | `npm install` |
| Comando de build | `npm run build` |
| Diretório de saída | `dist` |
| Variáveis de ambiente | `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` |

As variáveis são lidas durante a compilação. Após alterá-las, gere um novo deployment. Configure também o domínio de produção nas URLs de retorno do Supabase e na origem autorizada do cliente Google.

## Estrutura do projeto

```text
ContandoDinheiro/
├── public/                 # Ícones e recursos estáticos da PWA
├── scripts/                # Testes, diagnóstico e geração de ícones
├── src/
│   ├── components/         # Landing page, painel, gráficos e modais
│   ├── context/            # Gerenciamento do tema
│   ├── hooks/              # Estado de conexão e instalação da PWA
│   ├── services/           # Acesso ao Supabase, demo local, SQL e CSV
│   ├── types/              # Tipos do domínio financeiro
│   ├── App.tsx             # Sessão, navegação, filtros e resumo
│   ├── index.css           # Estilos globais
│   └── main.tsx            # Entrada da aplicação
├── supabase/migrations/    # Schema e migrações do banco
├── .env.example            # Referência de variáveis de ambiente
├── package.json            # Dependências e comandos
└── vite.config.ts          # Configuração de build e PWA
```

## Solução de problemas

| Situação | O que verificar |
| --- | --- |
| Google indisponível ou Supabase não configurado | Preencha ambas as variáveis com a URL e a chave pública corretas; reinicie o servidor ou publique uma nova compilação |
| Login retorna para o endereço errado | Confira a Site URL e a lista de Redirect URLs no Supabase |
| Google informa erro de redirecionamento | Confira a URI de callback do Supabase no cliente OAuth do Google |
| Login local não retorna ao painel | Inclua a origem local em Redirect URLs; se a porta mudou, ajuste o endereço |
| Erro ao criar usuário ou salvar transação | Confirme a aplicação do schema, do trigger de perfil e das políticas; consulte os logs do Supabase |
| Painel não mostra um lançamento | Confira o mês, o ano, a busca e os filtros de tipo e status |
| Dados da demonstração não aparecem em outro dispositivo | O modo demo utiliza armazenamento local, separado da conta autenticada |
| Alteração de variável não aparece no site | As variáveis `VITE_` exigem uma nova compilação e publicação |
| Botão de instalação não aparece | Confira o suporte do navegador, se o app já foi instalado e se está sendo servido em uma origem segura |

## Contribuições

Sugestões e correções são bem-vindas por meio de [issues](https://github.com/jonasnunees/ContandoDinheiro/issues) e pull requests.

1. Faça um fork e crie uma branch para sua alteração.
2. Implemente a mudança seguindo a organização existente.
3. Execute as verificações descritas acima e atualize a documentação quando necessário.
4. Abra um pull request com a descrição do problema, da solução e das verificações realizadas.

Não inclua credenciais, arquivos `.env.local` ou dados financeiros pessoais em commits, capturas de tela ou relatos de problemas.

## Licença

Este projeto está disponível sob a [licença MIT](LICENSE). Copyright (c) 2026 Jonas Nunes.
