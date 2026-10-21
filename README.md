<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/branding/readme-header-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="public/branding/readme-header.svg">
  <img src="public/branding/readme-header.svg" alt="Contando Dinheiro — logo com gráfico e seta circular" width="480">
</picture>

# Controle financeiro pessoal

[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-16a34a)](LICENSE)
![Idioma português](https://img.shields.io/badge/idioma-portugu%C3%AAs-2563eb)
![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0f172a?logo=tailwindcss&logoColor=38bdf8)
![Chart.js](https://img.shields.io/badge/Chart.js-ff6384?logo=chartdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?logo=supabase&logoColor=3ecf8e)
![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)
<a href="https://contando-dinheiro.vercel.app/" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/aplicativo-acessar-16a34a" alt="Acessar aplicativo"></a>

**Seu dinheiro, sob controle. Suas decisões, com mais clareza.**

O ContandoDinheiro transforma os registros do dia a dia em uma visão clara da sua vida financeira. Organize receitas e despesas, descubra para onde o dinheiro está indo e acompanhe o que ainda falta pagar ou receber — tudo em um painel visual, em português e acessível pelo celular ou computador.

**Menos dúvidas sobre os gastos. Mais informação para planejar o próximo passo.**

<a href="https://contando-dinheiro.vercel.app/" target="_blank" rel="noopener noreferrer"><strong>Conheça o ContandoDinheiro →</strong></a>

## Clareza para cuidar do que é seu

Quanto entrou neste mês? Quanto já saiu? O que ainda está pendente? O ContandoDinheiro reúne essas respostas em um só lugar, para quem quer começar a organizar as finanças ou manter uma rotina de controle mais simples.

Com lançamentos organizados, indicadores e gráficos, você pode identificar os gastos que pesam no orçamento e tomar decisões com base no que realmente foi recebido e pago.

## Tudo o que você precisa para acompanhar suas finanças

### Uma visão completa do seu mês

Acompanhe entradas recebidas, despesas pagas, saldo do período e taxa de economia em cartões de resumo. Consulte um mês específico ou o ano inteiro para entender suas finanças em diferentes períodos.

![Painel no computador com resumo do mês e gráficos de despesas, formas de pagamento e fluxo de caixa](public/screenshots/painel-desktop.png)

*As capturas desta página utilizam dados fictícios da demonstração.*

### Receitas e despesas bem organizadas

Registre, edite e exclua lançamentos com descrição, valor, data, categoria e forma de pagamento. Classifique gastos como alimentação, moradia, transporte, saúde e lazer, e identifique pagamentos por Pix, cartão, dinheiro, boleto ou transferência.

![Lista de lançamentos com busca, filtros, valores e status de pagamento](public/screenshots/lancamentos.png)

<details>
  <summary>Veja o formulário de uma nova transação</summary>

![Formulário para cadastrar receitas e despesas com categoria, data e status](public/screenshots/nova-transacao.png)

</details>

### Pendências sempre à vista

Veja separadamente quanto falta pagar e quanto falta receber. Atualize o status de cada lançamento quando o pagamento ou recebimento acontecer, mantendo o saldo baseado nas movimentações já realizadas.

### Gráficos que ajudam a enxergar os hábitos

Entenda quais categorias concentram suas despesas, visualize a distribuição por forma de pagamento e compare receitas e despesas. Os gráficos também oferecem tabelas alternativas para consulta acessível.

### Encontre o que procura e leve seus dados com você

Use a busca por descrição, categoria ou forma de pagamento e os filtros por tipo e status para localizar lançamentos. Exporte a lista exibida em CSV para continuar a análise em uma planilha.

## Feito para acompanhar sua rotina

| Recurso | O que muda no seu dia a dia |
| --- | --- |
| **Interface responsiva** | Consulte e organize seus lançamentos no celular ou computador. |
| **Temas claro e escuro** | Escolha a aparência mais confortável para você. |
| **Acesso com Google** | Entre com sua conta, sem criar uma senha adicional. |
| **Dados vinculados à sua conta** | Acesse seus registros salvos ao entrar na mesma conta em outro dispositivo. |
| **Instalação como aplicativo** | Em navegadores compatíveis, adicione o ContandoDinheiro à tela inicial. |
| **Demonstração sem login** | Explore o painel com dados de exemplo antes de cadastrar seus próprios lançamentos. |

Os lançamentos da demonstração ficam no navegador e são separados dos dados da sua conta. Para consultar e salvar dados com uma conta Google, é necessária conexão com a internet.

<p align="center">
  <img src="public/screenshots/painel-mobile-escuro.png" alt="Painel no celular em tema escuro, com cartões de receitas, despesas e saldo" width="320">
  <br>
  <em>Seu resumo financeiro também no celular, com opção de tema escuro.</em>
</p>

## Seus dados merecem cuidado

O projeto utiliza autenticação com Google e políticas de acesso no banco de dados para restringir os registros à conta proprietária. As alterações de transações possuem registro de auditoria, e a exportação CSV inclui tratamento de textos que poderiam ser interpretados como fórmulas em planilhas.

## Experimente antes de começar

Abra o <a href="https://contando-dinheiro.vercel.app/" target="_blank" rel="noopener noreferrer">ContandoDinheiro</a> e escolha **Explorar demonstração sem login** para conhecer o painel, os lançamentos e os gráficos. Quando quiser organizar suas próprias finanças, entre com sua conta Google.

**Dê mais clareza ao seu orçamento, um lançamento de cada vez.**

<a href="https://contando-dinheiro.vercel.app/" target="_blank" rel="noopener noreferrer"><strong>Acessar o aplicativo →</strong></a>

## Tecnologia por trás da experiência

Construído com **React e TypeScript**, o ContandoDinheiro combina **Tailwind CSS** para a interface, **Chart.js** para os gráficos e **Supabase** para autenticação e armazenamento. **Vite** e recursos de **PWA** completam a base da aplicação, publicada na **Vercel**.

## Uma construção aberta

Criado por [Jonas Nunes](https://github.com/jonasnunees), o projeto recebe sugestões, correções e contribuições da comunidade. Compartilhe sua ideia em uma [issue](https://github.com/jonasnunees/ContandoDinheiro/issues) ou envie um pull request.

Disponível sob a [licença MIT](LICENSE).


## Lançamentos recorrentes e parcelados

No formulário de nova transação, escolha **Mensal** ou **Parcelado mensalmente** em Repetição.
No parcelamento, informe o valor total e de 2 a 360 parcelas. Os centavos são distribuídos sem alterar o total.
Na edição, o valor corresponde a uma ocorrência; escolha alterar somente ela ou ela e as próximas pendentes.
A mesma tela permite cancelar as próximas pendências, preservando as ocorrências pagas.

Datas no fim do mês são ajustadas ao último dia disponível, mantendo o dia original nos meses seguintes.
Ocorrências futuras começam pendentes e não alteram o saldo realizado. Recorrências sem término mantêm
12 meses disponíveis a partir do mês atual, atualizados ao carregar o painel. Recorrências com término
(até 30 anos) e compras parceladas geram todas as ocorrências no cadastro.

Para instalar esta versão em outro ambiente, aplique as migrações
`supabase/migrations/20261020173827_recurring_transactions.sql` e
`supabase/migrations/20261020173940_index_transaction_series.sql`, após as migrações anteriores.
Ela cria a estrutura de séries, as regras de acesso por proprietário e as operações atômicas de geração,
edição e cancelamento. A aplicação depende dessa migração para carregar lançamentos de contas reais.
As duas migrações foram aplicadas ao Supabase do ContandoDinheiro em 20/10/2026.
O modo de demonstração migra automaticamente os dados locais existentes, preservando-os.

Verificações: `npm test` (inclui regras de recorrência e PostgreSQL local), `npm run test:e2e`
(fluxos no navegador), `npm run lint` e `npm run build`.


## Exemplos da demonstração sem login

Além dos lançamentos avulsos, a demonstração inclui internet mensal, receita de aulas particulares,
academia com término definido, notebook em 10 parcelas (a terceira no mês atual) e curso em 6 parcelas.
As datas acompanham o mês de criação dos exemplos, com histórico pago e compromissos futuros pendentes.
Os atalhos do painel permitem abrir uma conta mensal, consultar as parcelas e explorar o próximo mês.
Todos esses exemplos podem ser editados, marcados como pagos, cancelados e exportados pelo fluxo normal.

A atualização acrescenta os novos exemplos uma única vez aos dados já salvos no navegador, preservando
alterações anteriores. Exemplos excluídos depois da atualização não reaparecem ao recarregar; uma lista
que já havia sido esvaziada permanece vazia. Nenhum desses dados é gravado no Supabase.


### Isolamento dos dados de demonstração

Criar, editar, excluir, marcar pagamentos e cancelar séries na demonstração afeta somente o
armazenamento local do navegador. A identidade `demo-user-id` e os IDs locais são bloqueados antes
de obter um cliente autenticado se forem encaminhados por engano ao caminho do banco. Modos de
acesso inválidos também são rejeitados. A proteção complementa as políticas de acesso por proprietário
já existentes no Supabase.

Os testes de segurança exercitam esse isolamento mesmo com sessão real disponível. O teste
`e2e/demo-isolation.spec.ts` monitora a API do banco durante operações na interface e exige zero
requisições, inclusive ao excluir um registro local cujo ID tenha o mesmo formato dos IDs reais.

A apresentação fica em `/` e a demonstração tem endereço próprio em `/demo`. Recarregar ou compartilhar `/demo` abre diretamente o painel de exemplos, com dados locais, inclusive quando há uma conta conectada.
