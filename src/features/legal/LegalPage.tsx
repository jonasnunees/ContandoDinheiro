import { ThemeToggle } from '../../components/ThemeToggle';
import { LegalLinks } from './LegalLinks';
import { LEGAL_CONTACT, LEGAL_VERSION, privacy, terms } from './legalContent';

export default function LegalPage({ kind }: { kind: 'terms' | 'privacy' }) {
  const document = kind === 'terms' ? terms : privacy;
  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <a href="#conteudo-legal" className="sr-only focus:not-sr-only focus:block focus:p-4">Pular para o conteúdo</a>
    <header className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <a href="/" className="font-bold rounded">ContandoDinheiro <span className="block text-xs font-normal">Voltar ao início</span></a>
        <ThemeToggle />
      </div>
    </header>
    <main id="conteudo-legal" className="max-w-4xl mx-auto px-5 py-10 sm:py-14">
      <article>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Transparência e condições de uso</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">{document.title}</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Atualizado em <time dateTime={LEGAL_VERSION}>22 de outubro de 2026</time> · Versão {LEGAL_VERSION}</p>
        <p className="mt-6 leading-relaxed">{document.introduction}</p>
        <nav aria-label="Nesta página" className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold mb-3">Nesta página</h2>
          <ol className="space-y-2 text-sm">{document.sections.map(section => <li key={section.id}><a className="underline underline-offset-4 text-emerald-800 dark:text-emerald-300" href={`#${section.id}`}>{section.title}</a></li>)}</ol>
        </nav>
        <div className="space-y-9">{document.sections.map(section => <section key={section.id} id={section.id} className="scroll-mt-6">
          <h2 className="text-xl font-bold mb-4">{section.title}</h2>
          <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
        </section>)}</div>
        <aside className="my-9 border-t border-slate-200 dark:border-slate-800 pt-6 text-sm">
          <p>Dúvidas ou solicitações: <a className="underline underline-offset-4 break-all" href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a></p>
        </aside>
        <nav aria-label="Referências legais" className="text-sm space-y-2">
          <p className="font-semibold">Legislação de referência</p>
          <a className="block underline" href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm">Lei Geral de Proteção de Dados (LGPD)</a>
          <a className="block underline" href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm">Marco Civil da Internet</a>
          <a className="block underline" href="https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm">Código de Defesa do Consumidor</a>
          <a className="block underline" href="https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados">ANPD: transferências internacionais</a>
        </nav>
      </article>
    </main>
    <footer className="border-t border-slate-200 dark:border-slate-800 p-6 text-slate-600 dark:text-slate-400"><LegalLinks /></footer>
  </div>;
}
