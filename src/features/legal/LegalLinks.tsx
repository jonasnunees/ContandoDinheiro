export function LegalLinks() {
  return <nav aria-label="Documentos legais" className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
    <a className="rounded underline underline-offset-4 hover:text-emerald-700 dark:hover:text-emerald-400" href="/termos-de-uso">Termos de Uso</a>
    <a className="rounded underline underline-offset-4 hover:text-emerald-700 dark:hover:text-emerald-400" href="/politica-de-privacidade">Política de Privacidade</a>
  </nav>;
}
