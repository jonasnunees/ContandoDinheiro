import { Archive, ArchiveRestore, Check, Info, Plus, Tags, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Modal } from '../../../components/Modal';
import { useCategories } from '../CategoryContext';
import { categoryName } from '../categories';
export function CategoryManager({ errorAlreadyShown = '' }: { errorAlreadyShown?: string }) {
  const { categories, error: loadError, reload, create, archive } = useCategories();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  async function perform(action: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(success);
      setName('');
      input.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível atualizar categorias.');
      input.current?.focus();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400"
        onClick={() => setOpen(true)}
      >
        <Tags className="h-4 w-4" aria-hidden="true" />
        Gerenciar categorias
      </button>
      {loadError && loadError !== errorAlreadyShown && (
        <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">
          {loadError}{' '}
          <button type="button" onClick={() => void reload().catch(() => {})}>
            Tentar novamente
          </button>
        </p>
      )}
      {open && (
        <Modal
          titleId="categories-title"
          onClose={() => setOpen(false)}
          busy={busy}
          className="category-manager-dialog w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl"
        >
          <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <Tags className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="categories-title" className="text-lg font-bold tracking-tight">
                  Categorias
                </h2>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                  Organize seus lançamentos do seu jeito.
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Fechar"
              disabled={busy}
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>
          <div className="flex flex-col gap-5 px-5 py-4 sm:px-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  const valid = categoryName(name);
                  void perform(() => create(valid), 'Categoria criada.');
                } catch (e) {
                  setError((e as Error).message);
                  input.current?.focus();
                }
              }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 p-4"
            >
              <label htmlFor="category-name" className="field-label">
                Nome da categoria
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  ref={input}
                  id="category-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Pets, Viagens, Projetos…"
                  aria-invalid={!!error}
                  aria-describedby="category-help category-error"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 shrink-0"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Criar categoria
                </button>
              </div>
              <p
                id="category-help"
                className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400"
              >
                De 1 a 60 caracteres. Nomes arquivados continuam reservados.
              </p>
              <p
                id="category-error"
                role="alert"
                className={
                  error || loadError ? 'mt-3 text-sm text-rose-700 dark:text-rose-300' : 'sr-only'
                }
              >
                {error || loadError}
              </p>
            </form>
            <p
              role="status"
              className={
                message
                  ? 'flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-800 dark:text-emerald-300'
                  : 'sr-only'
              }
            >
              {message && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
              {message}
            </p>
            {[false, true].map((archived) => {
              const items = categories.filter((c) => c.archived === archived);
              return (
                <section
                  key={String(archived)}
                  aria-labelledby={
                    archived ? 'archived-categories-title' : 'active-categories-title'
                  }
                >
                  <div className="mb-3 flex items-center gap-2">
                    <h3
                      id={archived ? 'archived-categories-title' : 'active-categories-title'}
                      className="text-sm font-semibold"
                    >
                      {archived ? 'Arquivadas' : 'Ativas'}
                    </h3>
                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600 dark:text-slate-400">
                      {items.length}
                    </span>
                  </div>
                  {items.length ? (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {items.map((c) => (
                        <li
                          key={c.id}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <span
                              aria-hidden="true"
                              className={`h-2 w-2 shrink-0 rounded-full ${archived ? 'bg-slate-400' : 'bg-emerald-600 dark:bg-emerald-400'}`}
                            />
                            <span className="min-w-0 break-words text-sm font-medium">
                              {c.name}
                            </span>
                          </span>
                          <button
                            type="button"
                            disabled={busy}
                            aria-label={`${archived ? 'Reativar' : 'Arquivar'} ${c.name}`}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-300"
                            onClick={() =>
                              void perform(
                                () => archive(c.id, !archived),
                                archived ? 'Categoria reativada.' : 'Categoria arquivada.',
                              )
                            }
                          >
                            {archived ? (
                              <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            {archived ? 'Reativar' : 'Arquivar'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {archived
                        ? 'Nenhuma categoria arquivada.'
                        : 'Crie ou reative uma categoria para começar.'}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
          <footer className="flex items-start gap-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-5 py-3 sm:px-6 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Arquivar preserva o histórico e as próximas ocorrências das séries existentes. Você
              pode reativar a categoria quando quiser.
            </p>
          </footer>
        </Modal>
      )}
    </>
  );
}
