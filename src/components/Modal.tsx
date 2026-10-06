import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  titleId: string;
  onClose: () => void;
  busy?: boolean;
  className: string;
  children: ReactNode;
}

// Janela reutilizável: recebe o conteúdo (children) e o comando para fechá-la.
export function Modal({ titleId, onClose, busy = false, className, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // Abre a janela e bloqueia a rolagem do fundo; ao fechar, restaura a rolagem e o foco anterior.
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);
  // O portal coloca a janela diretamente no corpo da página, fora do layout da tela.
  return createPortal(
    <dialog ref={dialog} aria-labelledby={titleId} aria-modal="true" aria-busy={busy}
      className={`modal-dialog ${className}`}
      onKeyDown={event => {
        // Mantém a navegação com Tab dentro da janela, incluindo Shift+Tab para voltar.
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex="0"]',
        )).filter(element => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }}
      onCancel={event => { event.preventDefault(); if (!busy) closeRef.current(); }}>
      {children}
    </dialog>, document.body,
  );
}
