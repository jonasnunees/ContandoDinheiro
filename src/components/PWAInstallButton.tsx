import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as standalone PWA
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>PWA Instalado</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 active:scale-95 transition cursor-pointer"
        title="Instalar aplicativo no computador ou celular"
      >
        <Download className="w-4 h-4" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  Como instalar no iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    1
                  </span>
                  <p>Abra esta página no navegador <strong>Safari</strong> do iOS.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    2
                  </span>
                  <p>Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima).</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    3
                  </span>
                  <p>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers that don't trigger beforeinstallprompt directly
  return (
    <button
      onClick={() => {
        alert('Para instalar o app:\n• No Chrome/Edge: Clique no ícone de instalar no canto superior direito da barra de endereço.\n• No celular Android: Toque nos três pontos do navegador e selecione "Adicionar à tela inicial" ou "Instalar aplicativo".');
      }}
      className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
      title="Dica de instalação"
    >
      <Download className="w-3.5 h-3.5 text-emerald-400" />
      <span>Instalar App</span>
    </button>
  );
};
