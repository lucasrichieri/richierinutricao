import React, { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Impede o banner padrão do navegador para mostrar o nosso customizado
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('[PWA] Usuário aceitou a instalação!');
    } else {
      console.log('[PWA] Usuário recusou a instalação.');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="pwa-install-banner no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          📲
        </div>
        <div>
          <strong style={{ fontSize: '0.92rem', display: 'block', color: 'white' }}>
            Instalar Richieri Nutrição
          </strong>
          <span style={{ fontSize: '0.78rem', color: '#E0E7FF' }}>
            Adicione o app à sua tela inicial para acesso rápido!
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          className="btn"
          style={{
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            fontSize: '0.82rem',
            padding: '0.4rem 0.85rem',
            fontWeight: '700',
          }}
          onClick={handleInstallClick}
        >
          Instalar
        </button>
        <button
          onClick={() => setShowBanner(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.1rem',
            cursor: 'pointer',
            padding: '0.2rem 0.4rem',
            opacity: 0.8,
          }}
          title="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
