import React from 'react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  patientCount = 0,
  consultationCount = 0,
  planCount = 0,
  user,
  onLogout,
  mobileOpen,
  setMobileOpen,
}) {
  const getInitials = (name) => {
    if (!name) return 'RN';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navItems = [
    { id: 'overview', label: 'Visão Geral', icon: '📊' },
    { id: 'patients', label: 'Pacientes', icon: '👥', badge: patientCount },
    { id: 'consultations', label: 'Consultas', icon: '📅', badge: consultationCount },
    { id: 'meal_plans', label: 'Planos Alimentares', icon: '🥗', badge: planCount },
    { id: 'profile', label: 'Meu Perfil', icon: '👩‍⚕️' },
  ];

  const handleSelect = (id) => {
    setActiveTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Backdrop para fechar o menu mobile ao clicar fora */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop no-print"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''} no-print`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="/logo.png"
              alt="Richieri Nutrição"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            />
            <div className="sidebar-logo-text">
              Richieri <span>Nutrição</span>
            </div>
          </div>
          {setMobileOpen && (
            <button
              className="sidebar-close-btn"
              onClick={() => setMobileOpen(false)}
              title="Fechar menu"
            >
              ✕
            </button>
          )}
        </div>

        <div className="sidebar-nav">
          <div className="nav-category">Menu Principal</div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelect(item.id)}
              >
                <div className="nav-item-left">
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile-card">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Nutricionista'}</div>
              <div className="user-role">{user?.email || 'nutri@richieri.com'}</div>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', gap: '0.4rem' }}
            onClick={onLogout}
          >
            <span>🚪</span> Sair da Conta
          </button>
        </div>
      </aside>
    </>
  );
}
