import { useEffect, useRef } from 'react';
import { ArrowLeft, Check, Wallet } from 'lucide-react';

const features = [
  ['Registre o dinheiro que entra e sai', 'Adicione seus ganhos e gastos com valor, data, categoria e forma de pagamento. Se precisar, você pode editar ou excluir cada registro.'],
  ['Acompanhe o que falta pagar ou receber', 'Marque os registros como pagos, recebidos ou pendentes. O saldo considera o dinheiro que já entrou e saiu.'],
  ['Veja um resumo das suas finanças', 'Consulte quanto recebeu, quanto gastou e quanto sobrou. Escolha um mês ou veja o ano inteiro.'],
  ['Entenda seus gastos com gráficos', 'Veja quais categorias concentram suas despesas, como você paga e a comparação entre entradas e saídas. Também é possível consultar esses dados em tabelas.'],
  ['Encontre seus registros com facilidade', 'Busque pela descrição, categoria ou forma de pagamento. Use os filtros para ver apenas entradas, gastos ou pendências.'],
  ['Leve seus registros para uma planilha', 'Baixe a lista que está vendo em um arquivo CSV, que pode ser aberto em aplicativos de planilhas.'],
  ['Experimente antes de entrar', 'Explore a demonstração com dados de exemplo. Para guardar seus próprios registros na sua conta e acessá-los em outro dispositivo, entre com o Google e mantenha uma conexão com a internet.'],
  ['Use no celular ou no computador', 'O aplicativo se adapta ao tamanho da tela e oferece temas claro e escuro. Em navegadores compatíveis, você também pode instalá-lo na tela inicial.'],
];

export function ReleaseNotes() {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Notas da versão | ContandoDinheiro';
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" style={{ colorScheme: 'light' }}>
      <header className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <a href="#inicio" className="inline-flex items-center gap-2 font-bold text-slate-900">
            <Wallet className="h-6 w-6 text-emerald-700" aria-hidden="true" />
            ContandoDinheiro
          </a>
          <a href="#inicio" className="inline-flex items-center gap-2 rounded text-sm text-slate-600 hover:text-emerald-800">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar ao aplicativo
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <h1 ref={heading} tabIndex={-1} className="text-3xl font-extrabold tracking-tight sm:text-4xl">Notas da versão</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-slate-600">Acompanhe o que chega ao ContandoDinheiro e veja como cada novidade pode ajudar você a cuidar do seu dinheiro.</p>

        <article aria-labelledby="version-1-0-1" className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1-0-1" className="text-2xl font-bold">Versão 1.0.1</h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">Melhorias e correções</span>
            </div>
            <p className="mt-3 text-sm text-slate-600"><time dateTime="2026-10-15">15 de outubro de 2026</time></p>
            <p className="mt-4 leading-relaxed text-slate-700">Ajustes para deixar a abertura do aplicativo mais leve e a página inicial mais fácil de ler e navegar.</p>
          </div>
          <ul className="space-y-6 p-6 sm:p-8">
            <li><h3 className="font-semibold">Menos arquivos para abrir a página inicial</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">Os gráficos e as notas da versão passam a carregar quando você acessa essas áreas. Assim, o aplicativo precisa baixar menos conteúdo ao abrir.</p></li>
            <li><h3 className="font-semibold">Leitura mais confortável</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">Ajustamos as cores de alguns textos da página inicial e do rodapé para facilitar a leitura nos temas claro e escuro.</p></li>
            <li><h3 className="font-semibold">Navegação mais fácil com leitor de tela</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">A página inicial agora identifica sua área principal. Isso ajuda quem usa um programa que lê a tela em voz alta a encontrar o conteúdo.</p></li>
          </ul>
        </article>

        <article aria-labelledby="version-1" className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="version-1" className="text-2xl font-bold">Versão 1.0</h2>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">Primeira versão</span>
            </div>
            <p className="mt-3 text-sm text-slate-600"><time dateTime="2026-10-15">15 de outubro de 2026</time></p>
            <p className="mt-4 leading-relaxed text-slate-700">Este é o nosso ponto de partida: um lugar para organizar seus ganhos e gastos e entender melhor como está sua vida financeira.</p>
          </div>
          <div className="p-6 sm:p-8">
            <h3 className="text-lg font-bold">O que você já pode fazer</h3>
            <ul className="mt-6 space-y-6">
              {features.map(([title, description]) => (
                <li key={title} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  <div><h4 className="font-semibold">{title}</h4><p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </article>
        <p className="mt-6 text-sm leading-relaxed text-slate-600">As próximas novidades serão publicadas aqui, com as versões mais recentes no início da página.</p>
      </main>
      <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-600">ContandoDinheiro · Notas da versão</footer>
    </div>
  );
}
