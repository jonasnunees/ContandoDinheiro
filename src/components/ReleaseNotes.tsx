import { useEffect, useRef } from 'react';
import { ArrowLeft, Check, Wallet } from 'lucide-react';

const features = [
  [
    'Registre o dinheiro que entra e sai',
    'Adicione seus ganhos e gastos com valor, data, categoria e forma de pagamento. Se precisar, você pode editar ou excluir cada registro.',
  ],
  [
    'Acompanhe o que falta pagar ou receber',
    'Marque os registros como pagos, recebidos ou pendentes. O saldo considera o dinheiro que já entrou e saiu.',
  ],
  [
    'Veja um resumo das suas finanças',
    'Consulte quanto recebeu, quanto gastou e quanto sobrou. Escolha um mês ou veja o ano inteiro.',
  ],
  [
    'Entenda seus gastos com gráficos',
    'Veja quais categorias concentram suas despesas, como você paga e a evolução mensal das receitas e despesas em gráficos de linhas.',
  ],
  [
    'Encontre seus registros com facilidade',
    'Busque pela descrição, categoria ou forma de pagamento. Use os filtros para ver apenas entradas, gastos ou pendências.',
  ],
  [
    'Leve seus registros para uma planilha',
    'Baixe a lista que está vendo em um arquivo CSV, que pode ser aberto em aplicativos de planilhas.',
  ],
  [
    'Experimente antes de entrar',
    'Explore a demonstração com dados de exemplo. Para guardar seus próprios registros na sua conta e acessá-los em outro dispositivo, entre com o Google e mantenha uma conexão com a internet.',
  ],
  [
    'Use no celular ou no computador',
    'O aplicativo se adapta ao tamanho da tela e oferece temas claro e escuro. Em navegadores compatíveis, você também pode instalá-lo na tela inicial.',
  ],
];

export function ReleaseNotes() {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Notas da versão | ContandoDinheiro';
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 font-sans"
      style={{ colorScheme: 'light' }}
    >
      <header className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <a href="#inicio" className="inline-flex items-center gap-2 font-bold text-slate-900">
            <Wallet className="h-6 w-6 text-emerald-700" aria-hidden="true" />
            ContandoDinheiro
          </a>
          <a
            href="#inicio"
            className="inline-flex items-center gap-2 rounded text-sm text-slate-600 hover:text-emerald-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar ao aplicativo
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-extrabold tracking-tight sm:text-4xl"
        >
          Notas da versão
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-slate-600">
          Acompanhe o que chega ao ContandoDinheiro e veja como cada novidade pode ajudar você a
          cuidar do seu dinheiro.
        </p>

        <article
          aria-labelledby="version-1-6-1"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-6-1" className="text-2xl font-bold">
                Versão 1.6.1
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Formas de pagamento com clareza
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-25">25 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Consulte pagamentos, recebimentos e pendências separadamente, com totais próprios para
              cada situação.
            </p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li>
              <h3 className="font-semibold">Veja quando o resumo está filtrado</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Um aviso acima dos cartões mostra os filtros de tipo, situação e busca aplicados ao
                resumo, aos gráficos e ao extrato. Use “Limpar filtros” para restaurar essas opções
                sem perder o período selecionado. Os vencimentos continuam com um recorte
                independente do período, da busca e dos filtros do resumo.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Escolha o que deseja acompanhar</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                O gráfico começa em “Despesas pagas por forma de pagamento”. Use a seleção para
                alternar entre despesas pagas, despesas pendentes, receitas recebidas e receitas
                pendentes. Nas pendências, a forma indica como você prevê pagar ou receber.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Mantenha o mesmo recorte dos seus filtros</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                A seleção muda somente esse gráfico e seus dados textuais, respeitando o período, a
                busca e os filtros globais. Quando a combinação não tem lançamentos, um aviso
                explica o resultado vazio. O período continua seguindo o vencimento do lançamento, e
                não a data efetiva do pagamento. Os comparativos mantêm receitas recebidas e
                despesas pagas nos totais; por categoria ou forma de pagamento, mostram despesas
                pagas.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Confira os mesmos valores em tabela</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Título, descrição, total e detalhes acompanham a opção escolhida. Abra “Ver dados
                por forma em tabela” para consultar os valores e o total sem depender das cores ou
                de passar o mouse. A seleção funciona por teclado, no celular e no computador, com
                suporte aos temas claro e escuro.
              </p>
            </li>
          </ul>
        </article>

        <article
          aria-labelledby="version-1-6-0"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-6-0" className="text-2xl font-bold">
                Versão 1.6.0
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Duplicar lançamento
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-24">24 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Cadastre movimentações semelhantes com menos digitação, usando um lançamento como
              ponto de partida no celular ou no computador.
            </p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li>
              <h3 className="font-semibold">Reaproveite os dados e revise antes de salvar</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Na lista, use “Duplicar lançamento” para abrir um novo formulário com descrição,
                valor, tipo, categoria e forma de pagamento preenchidos. O vencimento começa no dia
                de hoje e pode ser alterado. A cópia começa pendente, sem data de pagamento, mesmo
                quando o original já foi pago ou recebido. Só a confirmação salva o novo lançamento;
                cancelar não grava e o original permanece intacto.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Duplique uma ocorrência como lançamento avulso</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Ao duplicar uma recorrência ou parcela, você copia somente a ocorrência escolhida,
                com o valor dela. A repetição começa como avulsa; criar uma nova série exige uma
                escolha no formulário. Se a categoria original estiver arquivada, escolha uma
                categoria ativa antes de salvar.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Encontre a cópia após salvar</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Se o vencimento ficar fora do período exibido, o aviso de sucesso indica a data para
                você selecionar o período correspondente. Se houver falha ao salvar, os campos
                continuam preenchidos para tentar novamente. Na demonstração, as cópias ficam
                somente neste navegador.
              </p>
            </li>
          </ul>
        </article>

        <article
          aria-labelledby="version-1-5-0"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-5-0" className="text-2xl font-bold">
                Versão 1.5.0
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Categorias do seu jeito
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-24">24 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Crie categorias para sua rotina, arquive as que não usa mais e reative quando
              precisar, sem perder seu histórico financeiro.
            </p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li>
              <h3 className="font-semibold">Crie e organize suas categorias</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                No painel, abra “Gerenciar categorias” para consultar as ativas e arquivadas e criar
                novas opções, como Pets, Viagens ou Projetos. As categorias que você já usava
                continuam disponíveis. A janela tem ações claras e se adapta ao celular e ao
                computador, nos temas claro e escuro.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Arquive sem apagar o passado</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Uma categoria arquivada deixa de aparecer nas opções de novos lançamentos. Os
                registros existentes continuam na busca, nos gráficos, nos orçamentos e na
                exportação CSV. Ao editar um lançamento antigo, você pode manter sua categoria,
                identificada como arquivada, ou escolher uma ativa.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Mantenha suas recorrências e parcelas</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Arquivar uma categoria não interrompe séries existentes: suas próximas ocorrências
                continuam com a mesma categoria. Você pode reativá-la a qualquer momento para voltar
                a usá-la em novos lançamentos.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Experimente também na demonstração</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                As categorias da sua conta ficam separadas das de outros usuários. Na demonstração,
                criar, arquivar ou reativar altera somente os dados locais deste navegador,
                preservando os exemplos e as alterações já salvas.
              </p>
            </li>
          </ul>
        </article>

        <article
          aria-labelledby="version-1-4-1"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-4-1" className="text-2xl font-bold">
                Versão 1.4.1
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Limpeza de busca e filtros
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-24">24 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Limpe a busca e os filtros diretamente em Lançamentos &amp; Extrato, preservando o
              período escolhido.
            </p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li>
              <h3 className="font-semibold">Limpe os filtros sem perder o período</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Em Lançamentos &amp; Extrato, use “Limpar busca e filtros” para voltar a todos os
                lançamentos do período, preservando o mês e o ano escolhidos. O controle mantém o
                foco para continuar a navegação por teclado.
              </p>
            </li>
          </ul>
        </article>

        <article
          aria-labelledby="version-1-4-0"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-4-0" className="text-2xl font-bold">
                Versão 1.4.0
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Comparativos financeiros por período
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-24">24 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Acompanhe como suas finanças mudam ao longo dos meses, com gráficos de linhas e
              detalhes fáceis de consultar no celular e no computador.
            </p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li>
              <h3 className="font-semibold">Compare meses, trimestres e semestres</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Veja o mês selecionado ao lado do anterior ou acompanhe os doze meses do ano. No
                comparativo, você também pode escolher um trimestre ou semestre para ver sua
                evolução mensal, sem alterar os cartões e a lista de lançamentos.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Explore categorias e formas de pagamento</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Compare os totais de receitas recebidas e despesas pagas, uma categoria ou uma forma
                de pagamento. Para uma visão conjunta das despesas pagas, mostre todas as categorias
                ou formas de pagamento, cada uma com sua linha e cor.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Consulte os valores com mouse ou toque</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Os marcadores identificam cada mês sem números sobrepostos ao gráfico. Passe o mouse
                ou toque para abrir um balão com os valores. A legenda abaixo permite escolher um
                mês, consultar seus valores e ocultar ou mostrar cada linha.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Identifique períodos ainda incompletos</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Avisos indicam valores parciais e meses futuros, ajudando a interpretar a comparação
                com períodos completos. Os comparativos respeitam a busca e os filtros do painel; os
                valores seguem a data do lançamento.
              </p>
            </li>
          </ul>
        </article>

        <article
          aria-labelledby="version-1-3-0"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-3-0" className="text-2xl font-bold">
                Versão 1.3.0
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Orçamento mensal por categoria
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-24">24 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Defina quanto pretende gastar em cada categoria e acompanhe o que ainda cabe no
              orçamento do mês, direto no painel.
            </p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li>
              <h3 className="font-semibold">Defina limites para cada mês</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Selecione um mês e informe um limite para alimentação, moradia, transporte ou outra
                categoria. Você pode editar ou remover cada limite quando precisar. Na visão do ano
                inteiro, uma orientação indica que é necessário selecionar um mês para acompanhar o
                orçamento.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Veja quanto usou e quanto resta</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Cada categoria com limite definido mostra o valor utilizado, o valor restante e uma
                barra de progresso. Por exemplo: com um limite de R$ 800 e R$ 620 em despesas pagas,
                você vê R$ 180 restantes. Ao ultrapassar o limite, um aviso discreto informa o valor
                excedido.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Acompanhe os gastos sem interferência da busca</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                O orçamento considera somente despesas pagas do mês e ano selecionados, seguindo a
                data do lançamento, assim como os gráficos. Receitas e despesas pendentes ficam fora
                desse cálculo. A busca e os filtros do extrato não alteram o valor utilizado.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Retome seus limites neste navegador</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Os limites ficam salvos apenas neste navegador, separados por conta, mês e ano. Os
                orçamentos da demonstração também ficam separados dos da sua conta. Eles não são
                sincronizados com outros dispositivos e podem ser perdidos ao limpar os dados do
                navegador.
              </p>
            </li>
          </ul>
        </article>

        <article
          aria-labelledby="version-1-2-1"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-2-1" className="text-2xl font-bold">
                Versão 1.2.1
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Página inicial mais clara e fácil de explorar
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-22">22 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Explore os recursos, acompanhe os primeiros passos e tire suas dúvidas em uma
              apresentação adaptada ao celular e ao computador.
            </p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li>
              <h3 className="font-semibold">Explore os recursos em um carrossel contínuo</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Os cartões de recursos agora aparecem em um carrossel que volta ao início ao
                completar a sequência. Use as setas laterais ou os indicadores para escolher o que
                quer conhecer. O avanço automático acontece a cada seis segundos, e a quantidade de
                cartões visíveis se adapta ao tamanho da tela.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Navegue no seu ritmo</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                O carrossel pausa enquanto o ponteiro está sobre ele e interrompe o avanço
                automático quando um controle recebe foco pelo teclado. Se você prefere movimento
                reduzido nas configurações do dispositivo, o avanço automático fica desativado. Os
                controles também têm identificação para leitores de tela.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Acompanhe os primeiros passos em uma linha do tempo</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                A seção “Como começar a organizar seu dinheiro” ganhou etapas numeradas, ícones e
                cartões alternados no computador, com disposição própria no celular. As etapas
                aparecem gradualmente durante a rolagem. A preferência por movimento reduzido é
                respeitada, mantendo o conteúdo visível sem o efeito.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Leia o aviso da ilustração sem sobreposição</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                A legenda “Prévia ilustrativa · Dados fictícios” agora fica centralizada abaixo da
                imagem, com espaço próprio. Isso evita que o texto cubra a ilustração, especialmente
                em telas pequenas.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Tire suas dúvidas antes de começar</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Adicionamos cinco perguntas frequentes antes do rodapé, sobre gratuidade,
                demonstração sem conta, uso no celular e no computador, recorrências e parcelas, e
                exportação em CSV. Você pode abrir cada resposta pelo teclado ou por toque. A seção
                acompanha os temas claro e escuro da página inicial.
              </p>
            </li>
          </ul>
        </article>

        <article
          aria-labelledby="version-1-2-0"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-2-0" className="text-2xl font-bold">
                Versão 1.2.0
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Pendências por vencimento e histórico de pagamentos
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-21">21 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Veja o que está atrasado, prepare os próximos pagamentos e registre quando cada conta
              foi realmente paga.
            </p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li>
              <h3 className="font-semibold">
                Encontre contas atrasadas, mesmo de meses anteriores
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                A nova seção “Pendências e próximos vencimentos” reúne despesas pendentes em três
                grupos: atrasadas, vencem hoje e próximos sete dias. Cada grupo mostra a quantidade
                de contas e o valor total. A seção usa a data de hoje como referência,
                independentemente do mês ou ano selecionado no painel.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Separe vencimento e pagamento efetivo</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Cada lançamento passa a distinguir quando vence e quando foi pago ou recebido. Ao
                escolher “Registrar pagamento”, a edição abre com a data de hoje preenchida, e você
                pode ajustar para o dia em que pagou. O vencimento original continua registrado.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Consulte as duas datas no histórico e na planilha</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                A lista de lançamentos e a exportação em CSV incluem vencimento e data efetiva do
                pagamento. Registros antigos já pagos ficam com “data não informada” até que você
                preencha a data correta. Os resumos e gráficos continuam seguindo o período do
                vencimento.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Mantenha cada parcela com seu próprio pagamento</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Parcelas e contas mensais guardam a data de pagamento de cada ocorrência, e as
                futuras continuam pendentes. Ao devolver uma conta para “Pendente”, sua data de
                pagamento é limpa e ela volta à seção quando estiver atrasada ou próxima do
                vencimento.
              </p>
            </li>
          </ul>
        </article>

        <article
          aria-labelledby="version-1-1-2"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-1-2" className="text-2xl font-bold">
                Versão 1.1.2
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Apresentação atualizada e demonstração mais clara
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-20">20 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Conheça os recursos atuais do aplicativo e encontre com mais facilidade os exemplos
              para experimentar.
            </p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li>
              <h3 className="font-semibold">
                Conheça recorrências, parcelas e planejamento na página inicial
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                A apresentação agora destaca contas mensais com ou sem término, compras parceladas e
                compromissos futuros. Também explica os filtros, a exportação em CSV e a diferença
                entre pendências e saldo realizado.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Explore uma demonstração mais organizada</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Os exemplos estão separados em três cards com ícones e botões alinhados, adaptados
                ao celular. O aviso sobre dados fictícios e armazenamento no navegador ganhou uma
                área própria, e as dicas adicionais ficam no rodapé do guia.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Entenda como começar e quando precisa de internet</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Revisamos as orientações de acesso e instalação. A prévia da página inicial está
                identificada como dados fictícios, e o texto esclarece que sua conta precisa de
                conexão e que a demonstração depende dos arquivos já salvos para reabrir offline.
              </p>
            </li>
          </ul>
        </article>

        <article
          aria-labelledby="version-1-1-1"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-1-1" className="text-2xl font-bold">
                Versão 1.1.1
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Demonstração, navegação e acessibilidade
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-20">20 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Mais facilidade para experimentar o aplicativo, com uma demonstração independente e
              melhorias de leitura e carregamento.
            </p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li>
              <h3 className="font-semibold">Acesse a demonstração por um endereço próprio</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                A demonstração agora fica em{' '}
                <a
                  href="https://contando-dinheiro.vercel.app/demo"
                  className="rounded font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
                >
                  /demo
                </a>
                . Você pode salvar ou compartilhar esse endereço e abrir diretamente o painel de
                exemplos. Ao recarregar a página, continua na demonstração.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Experimente sem sair da sua conta</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Entrar e sair da demonstração preserva a conta que estiver conectada. Os exemplos
                continuam separados dos seus lançamentos e ficam salvos somente naquele navegador.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Abra a página inicial com menos arquivos</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                O painel financeiro passa a carregar quando você o acessa. A página de apresentação
                também deixa de preparar os exemplos da demonstração antes de você escolher
                explorá-la.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Leia o rodapé com mais conforto</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Melhoramos o contraste do texto do rodapé no tema escuro. Os acessos entre a
                apresentação e a demonstração agora usam links, que também permitem abrir a página
                em outra aba.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Recarregue a demonstração mesmo sem internet</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Com os arquivos necessários já salvos no navegador para uso offline, você pode
                recarregar a demonstração sem conexão e manter as alterações feitas nos exemplos.
                Para consultar e salvar lançamentos na sua conta, continua sendo necessária uma
                conexão com a internet.
              </p>
            </li>
          </ul>
        </article>

        <article
          aria-labelledby="version-1-1-0"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-1-0" className="text-2xl font-bold">
                Versão 1.1.0
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Recorrências, parcelas e demonstração
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-20">20 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Menos trabalho para registrar o que se repete e mais clareza para planejar os próximos
              meses.
            </p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li>
              <h3 className="font-semibold">Repita receitas e despesas todos os meses</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Cadastre salário, aluguel, internet e outras contas uma vez e escolha a repetição
                mensal. Você pode definir um término ou deixar a recorrência continuar. Sem término,
                o painel mantém os próximos 12 meses disponíveis e estende esse período conforme o
                tempo passa.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Organize compras parceladas</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Informe o valor total da compra e o número de parcelas. Cada lançamento recebe uma
                identificação como “3 de 10”. Os centavos são distribuídos para que a soma das
                parcelas corresponda ao total informado, e essa identificação também aparece no
                arquivo CSV.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Altere uma ocorrência ou as próximas pendências</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Ao editar, escolha mudar somente aquele lançamento ou ele e os próximos pendentes.
                Na edição, o valor corresponde a uma ocorrência. Você também pode cancelar as
                próximas pendências; alterações em conjunto preservam os lançamentos já pagos ou
                recebidos.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">
                Veja seus compromissos futuros sem confundir o saldo
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                As ocorrências futuras de recorrências e parcelamentos começam pendentes. Elas
                ajudam a prever o que falta pagar e receber, mas só entram no saldo realizado quando
                você confirma o pagamento ou recebimento.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Conte com o ajuste de datas nos meses mais curtos</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Um vencimento no dia 31 passa para o último dia disponível em meses mais curtos e
                volta ao dia original nos meses seguintes.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Explore exemplos completos sem fazer login</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                A demonstração agora inclui internet mensal, receita de aulas particulares, academia
                com término, notebook em 10 parcelas e curso em 6. Use os atalhos para encontrar os
                exemplos e explorar o próximo mês. Você pode editar, marcar pagamentos e cancelar
                séries pelo mesmo fluxo do aplicativo.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Experimente com dados locais e isolados</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Criar, editar ou excluir na demonstração altera somente os exemplos salvos naquele
                navegador, sem modificar os dados da sua conta ou de outros visitantes. Os novos
                exemplos são acrescentados uma única vez, preservando suas edições anteriores.
              </p>
            </li>
          </ul>
        </article>

        <article
          aria-labelledby="version-1-0-1"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-0-1" className="text-2xl font-bold">
                Versão 1.0.1
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Melhorias e correções
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-15">15 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Ajustes para deixar a abertura do aplicativo mais leve e a página inicial mais fácil
              de ler e navegar.
            </p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li>
              <h3 className="font-semibold">Menos arquivos para abrir a página inicial</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Os gráficos e as notas da versão passam a carregar quando você acessa essas áreas.
                Assim, o aplicativo precisa baixar menos conteúdo ao abrir.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Leitura mais confortável</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Ajustamos as cores de alguns textos da página inicial e do rodapé para facilitar a
                leitura nos temas claro e escuro.
              </p>
            </li>
            <li>
              <h3 className="font-semibold">Navegação mais fácil com leitor de tela</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                A página inicial agora identifica sua área principal. Isso ajuda quem usa um
                programa que lê a tela em voz alta a encontrar o conteúdo.
              </p>
            </li>
          </ul>
        </article>

        <article
          aria-labelledby="version-1"
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1" className="text-2xl font-bold">
                Versão 1.0
              </h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                Primeira versão
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <time dateTime="2026-10-15">15 de outubro de 2026</time>
            </p>
            <p className="mt-4 leading-relaxed text-slate-700">
              Este é o nosso ponto de partida: um lugar para organizar seus ganhos e gastos e
              entender melhor como está sua vida financeira.
            </p>
          </div>
          <div className="p-6 sm:p-8">
            <h3 className="text-lg font-bold">O que você já pode fazer</h3>
            <ul className="mt-6 space-y-6">
              {features.map(([title, description]) => (
                <li key={title} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  <div>
                    <h4 className="font-semibold">{title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </article>
        <p className="mt-6 text-sm leading-relaxed text-slate-600">
          As próximas novidades serão publicadas aqui, com as versões mais recentes no início da
          página.
        </p>
      </main>
      <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-600">
        ContandoDinheiro · Notas da versão
      </footer>
    </div>
  );
}
