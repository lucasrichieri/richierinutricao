import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth';
import { getDb } from '../lib/db';
import {
  initDatabaseSchema,
  getPerfilNutricionista,
  updatePerfilNutricionista,
  getPacientes,
  createPaciente,
  updatePaciente,
  deletePaciente,
  getConsultas,
  createConsulta,
  deleteConsulta,
  getPlanosAlimentares,
  createPlanoAlimentar,
  deletePlanoAlimentar,
} from '../lib/api';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Toast from '../components/Toast';
import PatientModal from '../components/PatientModal';
import PatientDetailModal from '../components/PatientDetailModal';
import ConsultationModal from '../components/ConsultationModal';
import MealPlanModal from '../components/MealPlanModal';
import MealPlanPrintView from '../components/MealPlanPrintView';
import ProfileTab from '../components/ProfileTab';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: session, isPending: authPending } = authClient.useSession();

  // Estados principais de navegação e dados
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [nutritionist, setNutritionist] = useState(null);

  // Filtros de busca
  const [patientSearch, setPatientSearch] = useState('');
  const [consultationSearch, setConsultationSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');

  // Modais
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState(null);

  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState(null);
  const [preselectedPatientId, setPreselectedPatientId] = useState(null);

  const [mealPlanModalOpen, setMealPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedPlanForPrint, setSelectedPlanForPrint] = useState(null);

  // Instância do banco Neon
  const sql = useMemo(() => {
    const token = session?.session?.token || session?.token;
    return getDb(token);
  }, [session]);

  // Adiciona notificação toast
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Proteção de rota e carregamento de dados
  useEffect(() => {
    if (!authPending && !session) {
      navigate('/login');
    }
  }, [session, authPending, navigate]);

  // Carrega dados iniciais
  const loadData = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      // 1. Carrega Perfil
      const perfil = await getPerfilNutricionista(sql, session.user);
      setNutritionist(perfil);

      // 2. Carrega Pacientes
      const pacs = await getPacientes(sql);
      setPatients(pacs || []);

      // 3. Carrega Consultas
      const cons = await getConsultas(sql);
      setConsultations(cons || []);

      // 4. Carrega Planos Alimentares
      const plans = await getPlanosAlimentares(sql);
      setMealPlans(plans || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      addToast('Carregando dados com cache local', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session, sql]);

  const handleLogout = async () => {
    await authClient.signOut();
    navigate('/login');
  };

  const handleInitSchema = async () => {
    try {
      await initDatabaseSchema(sql);
      addToast('Schema Neon validado com sucesso!', 'success');
      loadData();
    } catch (err) {
      addToast('Erro ao validar schema Neon', 'error');
    }
  };

  /* ==========================================================================
     HANDLERS DE PACIENTES
     ========================================================================== */
  const handleOpenNewPatient = () => {
    setEditingPatient(null);
    setPatientModalOpen(true);
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setPatientModalOpen(true);
  };

  const handleSavePatient = async (formData) => {
    try {
      if (editingPatient) {
        await updatePaciente(sql, editingPatient.id, formData);
        addToast('Paciente atualizado com sucesso!', 'success');
      } else {
        await createPaciente(sql, formData);
        addToast('Paciente cadastrado com sucesso!', 'success');
      }
      setPatientModalOpen(false);
      loadData();
    } catch (err) {
      addToast('Erro ao salvar paciente', 'error');
    }
  };

  const handleDeletePatient = async (id) => {
    try {
      await deletePaciente(sql, id);
      addToast('Paciente removido com sucesso!', 'success');
      loadData();
    } catch (err) {
      addToast('Erro ao excluir paciente', 'error');
    }
  };

  const handleViewPatientDetail = (patient) => {
    setSelectedPatientForDetail(patient);
    setDetailModalOpen(true);
  };

  /* ==========================================================================
     HANDLERS DE CONSULTAS
     ========================================================================== */
  const handleOpenNewConsultation = (patientId = null) => {
    setEditingConsultation(null);
    setPreselectedPatientId(patientId);
    setConsultationModalOpen(true);
  };

  const handleSaveConsultation = async (formData) => {
    try {
      await createConsulta(sql, formData);
      addToast('Consulta registrada com sucesso!', 'success');
      setConsultationModalOpen(false);
      loadData();
    } catch (err) {
      addToast('Erro ao registrar consulta', 'error');
    }
  };

  const handleDeleteConsultation = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta consulta?')) {
      try {
        await deleteConsulta(sql, id);
        addToast('Consulta excluída com sucesso!', 'success');
        loadData();
      } catch (err) {
        addToast('Erro ao excluir consulta', 'error');
      }
    }
  };

  /* ==========================================================================
     HANDLERS DE PLANOS ALIMENTARES
     ========================================================================== */
  const handleOpenNewMealPlan = (patientId = null) => {
    setEditingPlan(null);
    setPreselectedPatientId(patientId);
    setMealPlanModalOpen(true);
  };

  const handleSaveMealPlan = async (formData) => {
    try {
      await createPlanoAlimentar(sql, formData);
      addToast('Plano alimentar salvo com sucesso!', 'success');
      setMealPlanModalOpen(false);
      loadData();
    } catch (err) {
      addToast('Erro ao salvar plano alimentar', 'error');
    }
  };

  const handleDeleteMealPlan = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este plano alimentar?')) {
      try {
        await deletePlanoAlimentar(sql, id);
        addToast('Plano alimentar excluído com sucesso!', 'success');
        loadData();
      } catch (err) {
        addToast('Erro ao excluir plano alimentar', 'error');
      }
    }
  };

  const handleViewMealPlan = (plan) => {
    const patient = patients.find((p) => p.id === plan.paciente_id);
    setSelectedPlanForPrint({ plan, patient });
    setPrintModalOpen(true);
  };

  /* ==========================================================================
     FILTRAGEM
     ========================================================================== */
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        (p.nome && p.nome.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.whatsapp && p.whatsapp.toLowerCase().includes(q)) ||
        (p.objetivos && p.objetivos.some((o) => o.toLowerCase().includes(q)))
    );
  }, [patients, patientSearch]);

  const filteredConsultations = useMemo(() => {
    if (!consultationSearch.trim()) return consultations;
    const q = consultationSearch.toLowerCase();
    return consultations.filter(
      (c) =>
        (c.paciente_nome && c.paciente_nome.toLowerCase().includes(q)) ||
        (c.observacoes && c.observacoes.toLowerCase().includes(q))
    );
  }, [consultations, consultationSearch]);

  const filteredMealPlans = useMemo(() => {
    if (!planSearch.trim()) return mealPlans;
    const q = planSearch.toLowerCase();
    return mealPlans.filter(
      (p) =>
        (p.titulo && p.titulo.toLowerCase().includes(q)) ||
        (p.paciente_nome && p.paciente_nome.toLowerCase().includes(q))
    );
  }, [mealPlans, planSearch]);

  // Próximos retornos agendados
  const upcomingReturns = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return consultations
      .filter((c) => c.proximo_retorno && c.proximo_retorno >= today)
      .sort((a, b) => new Date(a.proximo_retorno) - new Date(b.proximo_retorno));
  }, [consultations]);

  if (authPending) {
    return (
      <div className="container">
        <div className="loading-spinner-wrapper">
          <div className="spinner"></div>
          <p>Autenticando e carregando Richieri Nutrição...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="dashboard-layout">
      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Sidebar de Navegação */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        patientCount={patients.length}
        consultationCount={consultations.length}
        planCount={mealPlans.length}
        user={session.user}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="main-wrapper">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenNewPatient={handleOpenNewPatient}
          onOpenNewConsultation={() => handleOpenNewConsultation()}
          onOpenNewMealPlan={() => handleOpenNewMealPlan()}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <main className="content-container">
          {/* ================================================================
             ABA 1: VISÃO GERAL
             ================================================================ */}
          {activeTab === 'overview' && (
            <div>
              {/* Métricas Principais */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-info">
                    <span className="metric-label">Total de Pacientes</span>
                    <span className="metric-value">{patients.length}</span>
                    <span className="metric-subtext">Cadastrados no sistema</span>
                  </div>
                  <div className="metric-icon-box">👥</div>
                </div>

                <div className="metric-card secondary">
                  <div className="metric-info">
                    <span className="metric-label">Consultas Realizadas</span>
                    <span className="metric-value">{consultations.length}</span>
                    <span className="metric-subtext">Histórico completo</span>
                  </div>
                  <div className="metric-icon-box secondary">📅</div>
                </div>

                <div className="metric-card orange">
                  <div className="metric-info">
                    <span className="metric-label">Planos Alimentares</span>
                    <span className="metric-value">{mealPlans.length}</span>
                    <span className="metric-subtext">Dietas personalizadas</span>
                  </div>
                  <div className="metric-icon-box orange">🥗</div>
                </div>

                <div className="metric-card info">
                  <div className="metric-info">
                    <span className="metric-label">Próximos Retornos</span>
                    <span className="metric-value">{upcomingReturns.length}</span>
                    <span className="metric-subtext">Agendados para breve</span>
                  </div>
                  <div className="metric-icon-box info">⏰</div>
                </div>
              </div>

              {/* Grid de 2 Colunas: Retornos & Pacientes Recentes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Coluna 1: Próximos Retornos */}
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <span>⏰ Próximos Retornos Agendados</span>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveTab('consultations')}
                    >
                      Ver Todas
                    </button>
                  </div>
                  <div className="panel-body" style={{ padding: 0 }}>
                    {upcomingReturns.length === 0 ? (
                      <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                        <p>Nenhum retorno agendado para os próximos dias.</p>
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Paciente</th>
                            <th>Data do Retorno</th>
                            <th>Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcomingReturns.slice(0, 5).map((ret) => (
                            <tr key={ret.id}>
                              <td>
                                <strong>{ret.paciente_nome || 'Paciente'}</strong>
                              </td>
                              <td>
                                <span className="badge badge-info">
                                  {new Date(ret.proximo_retorno).toLocaleDateString('pt-BR')}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleOpenNewConsultation(ret.paciente_id)}
                                >
                                  Atender
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Coluna 2: Pacientes Recentes */}
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <span>👤 Pacientes Recentes</span>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleOpenNewPatient}
                    >
                      ➕ Novo
                    </button>
                  </div>
                  <div className="panel-body" style={{ padding: 0 }}>
                    {patients.length === 0 ? (
                      <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                        <p>Nenhum paciente cadastrado ainda.</p>
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Paciente</th>
                            <th>Objetivo</th>
                            <th>Prontuário</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patients.slice(0, 5).map((p) => (
                            <tr key={p.id}>
                              <td>
                                <div className="table-patient-cell">
                                  <div className="avatar-mini">
                                    {p.nome ? p.nome[0].toUpperCase() : 'P'}
                                  </div>
                                  <div>
                                    <strong>{p.nome}</strong>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      {p.whatsapp || p.email || 'Sem contato'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                {p.objetivos && p.objetivos.length > 0 ? (
                                  <span className="badge badge-primary">{p.objetivos[0]}</span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleViewPatientDetail(p)}
                                >
                                  Ver Ficha
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
             ABA 2: GESTÃO DE PACIENTES
             ================================================================ */}
          {activeTab === 'patients' && (
            <div className="panel">
              <div className="panel-header">
                <div className="filter-bar" style={{ margin: 0, width: '100%' }}>
                  <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar por nome, e-mail, telefone ou objetivo..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleOpenNewPatient}>
                    ➕ Cadastrar Paciente
                  </button>
                </div>
              </div>

              <div className="panel-body" style={{ padding: 0 }}>
                {filteredPatients.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>Nenhum paciente encontrado</h3>
                    <p>
                      {patientSearch
                        ? 'Nenhum paciente corresponde aos critérios de busca.'
                        : 'Comece adicionando seus pacientes para gerenciar consultas e dietas.'}
                    </p>
                    <button className="btn btn-primary" onClick={handleOpenNewPatient}>
                      ➕ Cadastrar Primeiro Paciente
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nome do Paciente</th>
                          <th>Contato</th>
                          <th>Peso / Altura</th>
                          <th>Objetivos</th>
                          <th>Nível de Atividade</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatients.map((patient) => (
                          <tr key={patient.id}>
                            <td>
                              <div className="table-patient-cell">
                                <div className="avatar-mini">
                                  {patient.nome ? patient.nome[0].toUpperCase() : 'P'}
                                </div>
                                <div>
                                  <strong
                                    style={{ cursor: 'pointer', color: 'var(--primary-dark)' }}
                                    onClick={() => handleViewPatientDetail(patient)}
                                  >
                                    {patient.nome}
                                  </strong>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {patient.sexo || 'Sexo não informado'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.85rem' }}>
                                {patient.whatsapp && <div>📱 {patient.whatsapp}</div>}
                                {patient.email && <div style={{ color: 'var(--text-muted)' }}>✉️ {patient.email}</div>}
                                {!patient.whatsapp && !patient.email && '—'}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.85rem' }}>
                                <strong>{patient.peso_inicial ? `${patient.peso_inicial} kg` : '—'}</strong>
                                {patient.altura && (
                                  <span style={{ color: 'var(--text-muted)' }}>
                                    {' '}/ {patient.altura} m
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              {patient.objetivos && patient.objetivos.length > 0 ? (
                                <div className="tag-list">
                                  {patient.objetivos.slice(0, 2).map((obj, i) => (
                                    <span key={i} className="badge badge-primary">{obj}</span>
                                  ))}
                                  {patient.objetivos.length > 2 && (
                                    <span className="badge badge-neutral">+{patient.objetivos.length - 2}</span>
                                  )}
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <span className="badge badge-neutral">
                                {patient.nivel_atividade || 'Moderado'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleViewPatientDetail(patient)}
                                  title="Ver Prontuário"
                                >
                                  📋 Prontuário
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm btn-icon"
                                  onClick={() => handleEditPatient(patient)}
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="btn btn-danger-subtle btn-sm btn-icon"
                                  onClick={() => {
                                    if (window.confirm(`Excluir paciente ${patient.nome}?`)) {
                                      handleDeletePatient(patient.id);
                                    }
                                  }}
                                  title="Excluir"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
             ABA 3: CONSULTAS & RETORNOS
             ================================================================ */}
          {activeTab === 'consultations' && (
            <div className="panel">
              <div className="panel-header">
                <div className="filter-bar" style={{ margin: 0, width: '100%' }}>
                  <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar por paciente ou observações da consulta..."
                      value={consultationSearch}
                      onChange={(e) => setConsultationSearch(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleOpenNewConsultation()}
                  >
                    ➕ Registrar Consulta
                  </button>
                </div>
              </div>

              <div className="panel-body" style={{ padding: 0 }}>
                {filteredConsultations.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>Nenhuma consulta encontrada</h3>
                    <p>
                      {consultationSearch
                        ? 'Nenhuma consulta corresponde à busca.'
                        : 'Registre a evolução clínica e antropométrica das consultas dos seus pacientes.'}
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenNewConsultation()}
                    >
                      ➕ Registrar Primeira Consulta
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Paciente</th>
                          <th>Peso</th>
                          <th>Cintura</th>
                          <th>Quadril</th>
                          <th>% Gordura</th>
                          <th>Próximo Retorno</th>
                          <th>Observações</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredConsultations.map((cons) => (
                          <tr key={cons.id}>
                            <td>
                              <strong>
                                {new Date(cons.data_consulta).toLocaleDateString('pt-BR')}
                              </strong>
                            </td>
                            <td>
                              <strong>{cons.paciente_nome || 'Paciente'}</strong>
                            </td>
                            <td>{cons.peso ? `${cons.peso} kg` : '—'}</td>
                            <td>{cons.cintura ? `${cons.cintura} cm` : '—'}</td>
                            <td>{cons.quadril ? `${cons.quadril} cm` : '—'}</td>
                            <td>{cons.percentual_gordura ? `${cons.percentual_gordura}%` : '—'}</td>
                            <td>
                              {cons.proximo_retorno ? (
                                <span className="badge badge-info">
                                  {new Date(cons.proximo_retorno).toLocaleDateString('pt-BR')}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cons.observacoes || '—'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-danger-subtle btn-sm btn-icon"
                                onClick={() => handleDeleteConsultation(cons.id)}
                                title="Excluir Consulta"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
             ABA 4: PLANOS ALIMENTARES
             ================================================================ */}
          {activeTab === 'meal_plans' && (
            <div>
              <div className="panel">
                <div className="panel-header">
                  <div className="filter-bar" style={{ margin: 0, width: '100%' }}>
                    <div className="search-input-wrapper">
                      <span className="search-icon">🔍</span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por título ou paciente..."
                        value={planSearch}
                        onChange={(e) => setPlanSearch(e.target.value)}
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenNewMealPlan()}
                    >
                      🥗 Criar Novo Plano Alimentar
                    </button>
                  </div>
                </div>

                <div className="panel-body">
                  {filteredMealPlans.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🥗</div>
                      <h3>Nenhum plano alimentar encontrado</h3>
                      <p>
                        {planSearch
                          ? 'Nenhum plano corresponde à busca.'
                          : 'Crie dietas personalizadas com refeições, porções, substituições e orientações.'}
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleOpenNewMealPlan()}
                      >
                        🥗 Criar Primeiro Plano
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                      {filteredMealPlans.map((plano) => {
                        const conteudo =
                          typeof plano.conteudo === 'string'
                            ? JSON.parse(plano.conteudo)
                            : plano.conteudo;
                        const meals = conteudo?.refeicoes || [];

                        return (
                          <div key={plano.id} className="meal-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0 }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <span className="badge badge-primary">
                                  {meals.length} refeições
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {new Date(plano.created_at || Date.now()).toLocaleDateString('pt-BR')}
                                </span>
                              </div>

                              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--primary-dark)' }}>
                                {plano.titulo || 'Plano Alimentar'}
                              </h3>

                              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                                👤 <strong>{plano.paciente_nome || 'Paciente'}</strong>
                              </div>

                              {conteudo?.calorias && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                  🔥 Meta: <strong>{conteudo.calorias} kcal</strong> • 💧 <strong>{conteudo.agua || '2.5'}L água</strong>
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                style={{ flex: 1 }}
                                onClick={() => handleViewMealPlan(plano)}
                              >
                                🖨️ Ver & Imprimir
                              </button>
                              <button
                                className="btn btn-danger-subtle btn-sm btn-icon"
                                onClick={() => handleDeleteMealPlan(plano.id)}
                                title="Excluir Plano"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
             ABA 5: PERFIL DA NUTRICIONISTA & BANCO NEON
             ================================================================ */}
          {activeTab === 'profile' && (
            <ProfileTab
              nutritionist={nutritionist}
              onSaveProfile={async (data) => {
                try {
                  const updated = await updatePerfilNutricionista(sql, session.user, data);
                  setNutritionist(updated);
                  addToast('Perfil atualizado com sucesso!', 'success');
                } catch (err) {
                  addToast('Erro ao atualizar perfil', 'error');
                }
              }}
              onInitSchema={handleInitSchema}
              loading={loading}
            />
          )}
        </main>
      </div>

      {/* ================================================================
         MODAIS
         ================================================================ */}
      {/* Modal Cadastro/Edição de Paciente */}
      <PatientModal
        isOpen={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSave={handleSavePatient}
        patientToEdit={editingPatient}
      />

      {/* Modal Prontuário Completo do Paciente */}
      <PatientDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        patient={selectedPatientForDetail}
        consultations={consultations}
        mealPlans={mealPlans}
        onEditPatient={(patient) => {
          setDetailModalOpen(false);
          handleEditPatient(patient);
        }}
        onDeletePatient={(id) => {
          handleDeletePatient(id);
          setDetailModalOpen(false);
        }}
        onNewConsultation={(patientId) => {
          setDetailModalOpen(false);
          handleOpenNewConsultation(patientId);
        }}
        onNewMealPlan={(patientId) => {
          setDetailModalOpen(false);
          handleOpenNewMealPlan(patientId);
        }}
        onViewMealPlan={(plan) => {
          handleViewMealPlan(plan);
        }}
      />

      {/* Modal Nova Consulta */}
      <ConsultationModal
        isOpen={consultationModalOpen}
        onClose={() => setConsultationModalOpen(false)}
        onSave={handleSaveConsultation}
        patients={patients}
        initialPatientId={preselectedPatientId}
        consultationToEdit={editingConsultation}
      />

      {/* Modal Criador de Plano Alimentar */}
      <MealPlanModal
        isOpen={mealPlanModalOpen}
        onClose={() => setMealPlanModalOpen(false)}
        onSave={handleSaveMealPlan}
        patients={patients}
        initialPatientId={preselectedPatientId}
        planToEdit={editingPlan}
      />

      {/* Modal Impressão / PDF do Plano */}
      {selectedPlanForPrint && (
        <MealPlanPrintView
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          plan={selectedPlanForPrint.plan}
          patient={selectedPlanForPrint.patient}
          nutritionist={nutritionist}
        />
      )}
    </div>
  );
}
