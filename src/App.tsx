import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSession } from './features/auth/useSession';
import { GUEST_USER } from './features/auth/session';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './features/auth/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';

const AccountWorkspace = lazy(() => import('./AccountWorkspace'));
const LegalPage = lazy(() => import('./features/legal/LegalPage'));
const legalKind =
  window.location.pathname.replace(/\/$/, '') === '/termos-de-uso'
    ? 'terms'
    : window.location.pathname.replace(/\/$/, '') === '/politica-de-privacidade'
      ? 'privacy'
      : null;
const ReleaseNotes = lazy(() =>
  import('./components/ReleaseNotes').then((module) => ({ default: module.ReleaseNotes })),
);
const isDemoPage = window.location.pathname.replace(/\/$/, '') === '/demo';

function subscribeToNavigation(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center">
      <div role="status" aria-live="polite" className="flex items-center">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-500" aria-hidden="true" />
        <span>Carregando...</span>
      </div>
    </main>
  );
}

export default function App() {
  const hash = useSyncExternalStore(subscribeToNavigation, () => window.location.hash);
  useEffect(() => {
    document.title = legalKind
      ? `${legalKind === 'terms' ? 'Termos de Uso' : 'Política de Privacidade'} — ContandoDinheiro`
      : hash === '#notas-da-versao'
        ? 'Notas da versão — ContandoDinheiro'
        : isDemoPage
          ? 'Demonstração — ContandoDinheiro'
          : 'ContandoDinheiro — Gestão Financeira & Controle de Gastos';
  }, [hash]);
  return (
    <Suspense fallback={<LoadingScreen />}>
      {legalKind ? (
        <LegalPage kind={legalKind} />
      ) : hash === '#notas-da-versao' ? (
        <ReleaseNotes />
      ) : isDemoPage ? (
        <AccountWorkspace
          user={GUEST_USER}
          sessionError=""
          onLogout={async () => {
            window.location.assign('/');
          }}
        />
      ) : (
        <SessionPage />
      )}
    </Suspense>
  );
}

function SessionPage() {
  const { user, sessionError, logout } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  if (!user) return <LoadingScreen />;
  if (!user.isDemo)
    return (
      <AccountWorkspace key={user.id} user={user} sessionError={sessionError} onLogout={logout} />
    );
  return (
    <>
      <LandingPage
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenRegister={() => setIsAuthModalOpen(true)}
        isLoggedIn={false}
      />
      {sessionError && (
        <p role="alert" className="p-4 text-rose-700 dark:text-rose-300">
          {sessionError}
        </p>
      )}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => window.location.assign('/demo')}
      />
      <OfflineIndicator />
    </>
  );
}
