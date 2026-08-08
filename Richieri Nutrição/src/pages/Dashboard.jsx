import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login');
    }
  }, [session, isPending, navigate]);

  const handleLogout = async () => {
    await authClient.signOut();
    navigate('/login');
  };

  if (isPending) return <div className="container">Carregando...</div>;
  if (!session) return null;

  const getGreeting = (name) => {
    if (!name) return 'Bem-vindo(a)';
    const firstName = name.split(' ')[0].toLowerCase();
    if (firstName.endsWith('a')) return 'Bem-vinda';
    return 'Bem-vindo';
  };

  return (
    <div className="container">
      <div className="auth-card" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem' }}>{getGreeting(session.user?.name)}, {session.user?.name}!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Este é o seu dashboard. A autenticação com Neon Auth está funcionando.
        </p>
        <button className="btn btn-primary" onClick={handleLogout} style={{ width: 'auto' }}>
          Sair
        </button>
      </div>
    </div>
  );
}
