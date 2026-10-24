# Categorias por conta

## Modelagem e regras

`categories` tem UUID, proprietário, nome e `archived`. `transacoes.categoria_id` e
`transaction_series.categoria_id` são referências compostas com `user_id` ao mesmo
proprietário. O template da série também contém o ID e tem CHECK de consistência.
`categoria` continua sendo um texto de apresentação compatível com busca, gráficos,
lista e CSV. Um trigger sempre deriva esse texto do ID validado; não é a identidade.
Não há exclusão definitiva nem renomeação. A unicidade torna inequívocos os rótulos
usados para agregação dos gráficos, que continuam lendo o snapshot validado.

Nomes são aparados com o conjunto de espaços de `String.trim()`, devem conter de
1 a 60 pontos de código Unicode e são únicos por usuário, inclusive arquivados.
A comparação dobra somente A–Z para a–z, igual em JS e SQL e independente de locale;
acentos, caixa fora desse intervalo e espaços internos são significativos. Não há
normalização Unicode implícita. Por exemplo, `Casa` e `casa` conflitam; `Saúde` e
`saúde` conflitam; `Água` e `água` são distintos. Nomes são renderizados por React
como texto e passam pela proteção existente contra fórmulas na exportação CSV.

Arquivar só modifica a categoria. Histórico e orçamentos continuam acessíveis.
Novos lançamentos/séries exigem uma categoria ativa. A edição pode manter o mesmo
ID arquivado ou escolher um ativo. Séries existentes continuam materializando seu
ID arquivado: o trigger aceita somente ocorrências da série da mesma conta, a partir
do cursor, com data, descrição, tipo, pagamento, valor e situação gerados pelo
modelo. Ocorrências seguintes são pendentes, sem data efetiva de pagamento; a primeira
ocorrência conserva o estado/data efetiva originais quando aplicáveis. Alterar
uma série preservando sua categoria arquivada é permitido; substituí-la por outra
arquivada é rejeitado. Cancelamento continua preservando o histórico pago.

As operações SQL de séries permanecem atômicas. FK composta e RLS protegem chamadas
diretas. Categorias não têm privilégios de DELETE nem UPDATE de nome/proprietário/ID.
Os triggers de gravação usam `FOR SHARE` na categoria; isso conflita com o UPDATE do
arquivamento. A primeira operação a obter o bloqueio determina se a gravação pode
prosseguir. Nomes duplicados são resolvidos pelo índice único, sem gravação parcial.
Não há chave privilegiada nova no frontend.

## Mapeamento dos usos

- `types.ts`: `CATEGORIES` agora só define as opções iniciais e a compatibilidade local;
  `Category` é texto de apresentação, `UserCategory` é a entidade e `categoria_id` o vínculo.
- `validation.ts`: aceita nomes personalizados e IDs opcionais na fronteira legada;
  propriedade e seleção ativa são validadas no serviço local e no banco.
- `categories.ts`, `categoriesService.ts`, `CategoryContext.tsx`: validação, carga por
  conta, operações e descarte de respostas antigas por conta/versão. O workspace é
  desmontado ao trocar de identidade. Nenhuma consulta por lançamento foi adicionada.
- `CategoryManager.tsx`: lista ativa/arquivada, cria, arquiva e reativa. Reutiliza o
  diálogo nativo com confinamento e restauração de foco, rótulos e mensagens acessíveis.
- `TransactionModal.tsx`: opções por ID, somente ativas e a arquivada do lançamento
  em edição, identificada com texto. Erros de gravação mantêm o formulário aberto.
- `TransactionList.tsx`, `calculations.ts`: exibição e busca pelo snapshot de nome;
  categorias arquivadas continuam encontráveis. Nomes com propriedades de objetos
  não herdam estilos nem entram indevidamente nos orçamentos.
- `FinancialCharts.tsx`, `financialChartConfig.ts`: opções de toda a conta, inclusive
  arquivadas; agregados preservados, cores determinísticas para novos nomes, legenda
  com nomes/valores e tabelas alternativas para leitores de tela, sem áreas roláveis
  invisíveis que exijam foco.
- `budgets.ts`, `MonthlyBudgets.tsx`: orçamentos continuam locais, por conta/mês.
  Chaves antigas por nome são convertidas em IDs em memória e persistidas no próximo
  salvamento. Categorias arquivadas permanecem listadas e identificadas.
- `csv.ts`: proteção de fórmulas, aspas e quebras de linha preservada. Exporta o nome.
- `demoStorage.ts`, `demoExamples.ts`, `scheduling.ts`, `transactionsService.ts`:
  arrays locais antigos e estados com séries recebem IDs em memória; a próxima
  gravação persiste categorias, séries e lançamentos na mesma chave. IDs iniciais
  locais são determinísticos e a ordem das opções iniciais deve permanecer estável.
  Referências e conteúdo inválidos são rejeitados antes de gravar. Não há fallback
  remoto na demonstração. Séries propagam o ID do template sem consultar categorias.
- SQL: a antiga lista fechada `transacoes_categoria_check` é substituída por FK;
  o CHECK do template conserva as demais validações e passa a conferir o ID.
  Materialização e edição de séries passam a transmitir esse ID.

## Aplicação e publicação

Nada foi aplicado em produção nesta tarefa. Não executar as migrações a partir do
frontend. O arquivo novo foi criado com a CLI e validado somente em PGlite local.

1. Em ambiente de homologação, aplicar as migrações versionadas em ordem crescente:
   `20261002210000_security_hardening.sql`,
   `20261002220000_backfill_existing_profiles.sql`,
   `20261006002719_logs_retention_90_days.sql`,
   `20261014110059_enforce_transaction_integrity.sql`,
   `20261020173827_recurring_transactions.sql`,
   `20261020173940_index_transaction_series.sql`,
   `20261021231121_payment_dates.sql` e
   `20261024203151_custom_categories.sql`. Em banco já migrado, aplicar apenas as pendentes.
2. Conferir contagens, vínculos, RLS e recorrências com duas contas de teste.
3. Aplicar a migração nova no banco de destino antes de publicar o frontend.
   Ela é transacional: uma falha no preenchimento aborta tudo. Inserções e templates antigos que enviem somente nomes têm os vínculos
   preenchidos e validados. Uma atualização que tente alterar somente o nome, sem
   trocar o ID, é rejeitada com pedido de recarga; o nome não reclassifica o vínculo.
4. Publicar o frontend e conferir criação, arquivo, reativação, histórico e séries.
   `ensure_categories` inicializa contas novas de forma idempotente; não reativa
   opções arquivadas. A carga não recria categorias com novos IDs.
5. Se houver rollback do frontend, conservar a migração e os vínculos; não apagar a
   tabela nem os IDs. O frontend antigo não oferece gestão das categorias novas.

## Verificação e limites

- `npm run lint`: aprovado (TypeScript e ESLint).
- `npm run format:check`: aprovado.
- `npm test`: aprovado; 66 testes incluindo subtestes, com regras, serviços, migração
  local, duas contas, referências indevidas em inserção/edição, nomes inválidos e
  duplicados, dados antigos, arquivo, reativação, séries e troca de identidade.
  Os testes SQL de categorias foram repetidos após a revisão final da migração.
- `npm run test:e2e`: 51 cenários aprovados na rodada final, incluindo axe, teclado,
  celular/computador, conflito entre abas e ausência de chamadas ao banco na demo.
- `npm run build`: aprovado. Teste da versão compilada com a configuração
  `playwright.production.config.ts`: 1 cenário offline aprovado, com preservação
  dos dados e nenhuma requisição ao banco.
- `git diff --check`: aprovado.

PGlite executa PostgreSQL com RLS e roles, mas serializa sua conexão. Os testes
comprovam autorização, rollback e regras SQL, sem certificar contenção entre duas
sessões PostgreSQL reais. Nenhuma chamada de administração, advisor remoto ou teste
em produção foi executado. A demonstração continua limitada a este navegador; Web Locks serializa gravações e materialização entre abas compatíveis, com
revalidação dentro do bloqueio. Navegadores antigos sem Web Locks usam a política de
última gravação do localStorage. Não há sincronização entre dispositivos.
