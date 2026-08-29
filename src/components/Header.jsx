import React from 'react';

export default function Header({
  activeTab,
  onOpenNewPatient,
  onOpenNewConsultation,
  onOpenNewMealPlan,
  mobileOpen,
  setMobileOpen,
}) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Visão Geral do Consultório';
      case 'patients':
        return 'Gestão de Pacientes';
      case 'patient_profile':
        return 'Prontuário & Perfil do Paciente';
      case 'new_patient':
        return 'Cadastro de Paciente';
      case 'consultations':
        return 'Consultas & Retornos';
      case 'meal_plans':
        return 'Planos Alimentares';
      case 'profile':
        return 'Perfil Profissional';
      default:
        return 'Painel Richieri Nutrição';
    }
  };

  return (
    <header className="top-header no-print">
      <div className="header-title-section">
        <button
          className="btn btn-secondary btn-icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          id="mobile-menu-toggle"
          title="Abrir Menu"
        >
          ☰
        </button>
        <div>
          <h1 className="header-title">{getTabTitle()}</h1>
        </div>
      </div>

      <div className="header-actions">
        <button className="btn btn-secondary btn-sm" onClick={onOpenNewPatient}>
          <span>➕</span> Paciente
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onOpenNewConsultation}>
          <span>➕</span> Consulta
        </button>
        <button className="btn btn-primary btn-sm" onClick={onOpenNewMealPlan}>
          <span>🥗</span> Novo Plano
        </button>
      </div>
    </header>
  );
}
