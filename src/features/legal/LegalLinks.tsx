export function LegalLinks({ lightOnly = false }: { lightOnly?: boolean }) {
  const linkClass = `rounded underline underline-offset-4 hover:text-emerald-700${lightOnly ? '' : ' dark:hover:text-emerald-400'}`;
  return <nav aria-label="Documentos legais" className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
    <a className={linkClass} href="/termos-de-uso">Termos de Uso</a>
    <a className={linkClass} href="/politica-de-privacidade">Política de Privacidade</a>
  </nav>;
}
