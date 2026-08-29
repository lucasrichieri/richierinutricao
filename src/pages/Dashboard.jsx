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
  syncLocalPacientesToNeon,
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
import PatientForm from '../components/PatientForm';
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

  // Estado para armazenar o token JWT do Neon Auth
  const [jwtToken, setJwtToken] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchJwt() {
      if (session?.user) {
        try {
          // Obter token JWT do Neon Auth chamando a rota /token via $fetch
          const res = await authClient.$fetch('/token', { method: 'GET' });
          const tokenStr = res?.data?.token || res?.token;
          if (isMounted && tokenStr) {
            setJwtToken(tokenStr);
            return;
          }
        } catch (err) {
          console.warn('Conectando via fallback autenticado ao Neon DB:', err);
        }
        if (isMounted) {
          setJwtToken(null);
        }
      } else {
        if (isMounted) setJwtToken(null);
      }
    }
    fetchJwt();
    return () => { isMounted = false; };
  }, [session]);

  // Instância do banco Neon
  const sql = useMemo(() => {
    return getDb(jwtToken);
  }, [jwtToken]);

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
      // 1. Carrega Perfil do Nutricionista
      const perfil = await getPerfilNutricionista(sql, session.user);
      setNutritionist(perfil);

      const nutId = perfil?.id || session.user.id;

      // 2. Carrega Pacientes do Nutricionista logado em tempo real do Neon DB
      const pacs = await getPacientes(sql, nutId);
      setPatients(pacs || []);

      // 3. Carrega Consultas do Neon
      const cons = await getConsultas(sql);
      setConsultations(cons || []);

      // 4. Carrega Planos Alimentares
      const plans = await getPlanosAlimentares(sql);
      setMealPlans(plans || []);
    } catch (err) {
      console.error('Erro ao carregar dados do Neon:', err);
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
    setActiveTab('new_patient');
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setPatientModalOpen(true);
  };

  const handleSavePatient = async (formData) => {
    try {
      let savedPatient;
      const nutId = nutritionist?.id || session?.user?.id;
      if (editingPatient) {
        savedPatient = await updatePaciente(sql, editingPatient.id, formData);
        addToast('Paciente atualizado com sucesso!', 'success');
        setPatientModalOpen(false);
      } else {
        savedPatient = await createPaciente(sql, formData, nutId);
        addToast('Paciente cadastrado com sucesso!', 'success');
        setPatientModalOpen(false);
      }

      await loadData();

      // Prompt 4: Após salvar, redirecionar para o perfil do paciente recém cadastrado
      if (savedPatient) {
        handleViewPatientDetail(savedPatient);
      } else {
        setActiveTab('patients');
      }
    } catch (err) {
      console.error('Erro ao salvar paciente:', err);
      addToast('Erro ao salvar paciente', 'error');
    }
  };

  const handleDeletePatient = async (patientOrId) => {
    const id = typeof patientOrId === 'object' ? patientOrId.id : patientOrId;
    const patient = typeof patientOrId === 'object' ? patientOrId : patients.find((p) => p.id === id);

    try {
      // Remove da interface imediatamente
      setPatients((prev) => prev.filter((p) => p.id !== id && (!patient?.nome || p.nome !== patient.nome)));
      await deletePaciente(sql, id, patient?.email, patient?.nome);
      addToast('Paciente removido com sucesso!', 'success');
      await loadData();
    } catch (err) {
      console.error('Erro ao excluir paciente:', err);
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

  // Lista com detalhamento da última consulta e objetivos (Prompt 4)
  const patientListWithDetails = useMemo(() => {
    if (!filteredPatients) return [];
    return filteredPatients.map((patient) => {
      const pConsultations = consultations.filter((c) => c.paciente_id === patient.id);
      let lastConsultationText = 'Sem consultas registradas';
      let lastConsultationDate = null;

      if (pConsultations.length > 0) {
        const sorted = [...pConsultations].sort(
          (a, b) => new Date(b.data_consulta) - new Date(a.data_consulta)
        );
        const last = sorted[0];
        if (last && last.data_consulta) {
          const dateStr = typeof last.data_consulta === 'string' ? last.data_consulta.split('T')[0] : '';
          if (dateStr) {
            const d = new Date(`${dateStr}T12:00:00`);
            lastConsultationDate = d;
            lastConsultationText = d.toLocaleDateString('pt-BR');
          }
        }
      }

      let mainObjetivo = 'Não informado';
      if (patient.objetivos && patient.objetivos.length > 0) {
        mainObjetivo = patient.objetivos.join(', ');
      } else if (patient.objetivo_texto) {
        mainObjetivo = patient.objetivo_texto;
      }

      return {
        ...patient,
        lastConsultationText,
        lastConsultationDate,
        mainObjetivo,
      };
    });
  }, [filteredPatients, consultations]);

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

  // Card 1 — Total de pacientes ativos (Prompt 3)
  const activePatientsCount = useMemo(() => {
    return patients ? patients.length : 0;
  }, [patients]);

  // Card 2 — Consultas da semana atual (Prompt 3)
  const thisWeekConsultationsCount = useMemo(() => {
    if (!consultations || consultations.length === 0) return 0;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const monday = new Date(now);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return consultations.filter((c) => {
      if (!c.data_consulta) return false;
      const dateStr = typeof c.data_consulta === 'string' ? c.data_consulta.split('T')[0] : '';
      if (!dateStr) return false;
      const cDate = new Date(`${dateStr}T12:00:00`);
      return cDate >= monday && cDate <= sunday;
    }).length;
  }, [consultations]);

  // Card 3 — Pacientes sem retorno (>30 dias sem consulta e sem próximo retorno agendado) (Prompt 3)
  const patientsWithoutReturn = useMemo(() => {
    if (!patients || patients.length === 0) return [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const result = [];

    for (const patient of patients) {
      const pConsultations = consultations.filter((c) => c.paciente_id === patient.id);

      // Se possui algum próximo retorno agendado para hoje ou no futuro, não está sem retorno
      const hasFutureReturn = pConsultations.some((c) => {
        return c.proximo_retorno && c.proximo_retorno >= todayStr;
      });

      if (hasFutureReturn) continue;

      // Ordena consultas da mais recente para mais antiga
      const sortedConsultations = [...pConsultations].sort(
        (a, b) => new Date(b.data_consulta) - new Date(a.data_consulta)
      );

      const lastConsultation = sortedConsultations[0];

      if (lastConsultation && lastConsultation.data_consulta) {
        const lastDateStr = typeof lastConsultation.data_consulta === 'string'
          ? lastConsultation.data_consulta.split('T')[0]
          : '';
        const lastDate = new Date(`${lastDateStr}T12:00:00`);
        const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays > 30) {
          result.push({
            ...patient,
            daysWithoutReturn: diffDays,
            lastConsultationDateFormatted: lastDate.toLocaleDateString('pt-BR'),
          });
        }
      } else {
        // Se nunca realizou consulta, verifica se o cadastro tem mais de 30 dias
        if (patient.created_at) {
          const createdDate = new Date(patient.created_at);
          const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
          if (diffDays > 30) {
            result.push({
              ...patient,
              daysWithoutReturn: diffDays,
              lastConsultationDateFormatted: `Cadastrado em ${createdDate.toLocaleDateString('pt-BR')}`,
            });
          }
        }
      }
    }

    return result;
  }, [patients, consultations]);

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
              {/* Cabeçalho do Dashboard */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
                    Painel Principal
                  </h2>
                  <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>
                    Visão geral dos atendimentos e pacientes do nutricionista
                  </p>
                </div>
                {loading && (
                  <span className="badge badge-info" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                    🔄 Atualizando Neon...
                  </span>
                )}
              </div>

              {/* Cards de Informação (Cards 1 e 2 + Card Auxiliar) */}
              <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {/* Card 1 — Total de pacientes ativos */}
                <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <div className="metric-info">
                    <span className="metric-label" style={{ fontWeight: 700 }}>
                      Total de Pacientes Ativos
                    </span>
                    <span className="metric-value" style={{ color: 'var(--primary-dark)', fontSize: '2.2rem', fontWeight: 800, margin: '0.3rem 0' }}>
                      {activePatientsCount}
                    </span>
                    <span className="metric-subtext">Cadastrados pelo nutricionista logado</span>
                  </div>
                  <div className="metric-icon-box">
                    👥
                  </div>
                </div>

                {/* Card 2 — Consultas da semana */}
                <div className="metric-card secondary" style={{ borderLeft: '4px solid var(--secondary)' }}>
                  <div className="metric-info">
                    <span className="metric-label" style={{ fontWeight: 700 }}>
                      Consultas da Semana
                    </span>
                    <span className="metric-value" style={{ color: 'var(--secondary-dark)', fontSize: '2.2rem', fontWeight: 800, margin: '0.3rem 0' }}>
                      {thisWeekConsultationsCount}
                    </span>
                    <span className="metric-subtext">Registradas na semana atual</span>
                  </div>
                  <div className="metric-icon-box secondary">
                    📅
                  </div>
                </div>

                {/* Card Auxiliar — Planos Alimentares */}
                <div className="metric-card orange" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
                  <div className="metric-info">
                    <span className="metric-label" style={{ fontWeight: 700 }}>
                      Planos Alimentares
                    </span>
                    <span className="metric-value" style={{ color: 'var(--accent-orange)', fontSize: '2.2rem', fontWeight: 800, margin: '0.3rem 0' }}>
                      {mealPlans.length}
                    </span>
                    <span className="metric-subtext">Elaborados para seus pacientes</span>
                  </div>
                  <div className="metric-icon-box orange">
                    🥗
                  </div>
                </div>
              </div>

              {/* Card 3 — Pacientes sem retorno */}
              <div className="panel" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Card 3 — Pacientes sem Retorno
                      </h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Última consulta há mais de 30 dias e que não possuem próximo retorno agendado
                      </span>
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: patientsWithoutReturn.length > 0 ? '#fef3c7' : '#d1fae5',
                      color: patientsWithoutReturn.length > 0 ? '#92400e' : '#065f46',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '20px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {patientsWithoutReturn.length} paciente(s)
                  </span>
                </div>

                <div className="panel-body" style={{ padding: '1.25rem' }}>
                  {patientsWithoutReturn.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.5rem' }}>✨</span>
                      <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 700 }}>
                        Nenhum paciente sem retorno no momento
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        Todos os seus pacientes realizaram consulta recentemente ou já possuem retorno agendado!
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {patientsWithoutReturn.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => handleViewPatientDetail(patient)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem 1.25rem',
                            backgroundColor: 'var(--surface-hover)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          className="patient-no-return-item"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--primary-subtle)',
                                color: 'var(--primary-dark)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                              }}
                            >
                              {patient.nome ? patient.nome.substring(0, 2).toUpperCase() : 'PN'}
                            </div>
                            <div>
                              <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>
                                {patient.nome}
                              </strong>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Última consulta: {patient.lastConsultationDateFormatted}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <span
                              style={{
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                padding: '0.3rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                              }}
                            >
                              Há {patient.daysWithoutReturn} dias sem retorno
                            </span>
                            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                              Ver Perfil ➔
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tabela Secundária: Próximos Retornos Agendados */}
              <div className="panel" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }}>
                  <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📅</span>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Próximos Retornos Agendados</h3>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab('consultations')}
                  >
                    Ver Todas as Consultas
                  </button>
                </div>
                <div className="panel-body" style={{ padding: 0 }}>
                  {upcomingReturns.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>Nenhum retorno agendado para os próximos dias.</p>
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
            </div>
          )}

          {/* ================================================================
             ABA 2: GESTÃO DE PACIENTES (PROMPT 4)
             ================================================================ */}
          {activeTab === 'patients' && (
            <div className="panel" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <div className="filter-bar" style={{ margin: 0, width: '100%' }}>
                  <div className="search-input-wrapper" style={{ flex: 1 }}>
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar paciente por nome..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleOpenNewPatient} style={{ fontWeight: 800 }}>
                    ➕ Novo Paciente
                  </button>
                </div>
              </div>

              <div className="panel-body" style={{ padding: 0 }}>
                {patientListWithDetails.length === 0 ? (
                  <div className="empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                    <div className="empty-icon">👥</div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      Nenhum paciente cadastrado ainda
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                      {patientSearch
                        ? 'Nenhum paciente encontrado para os termos da busca.'
                        : 'Comece adicionando seus pacientes para gerenciar consultas e planos alimentares.'}
                    </p>
                    <button className="btn btn-primary" onClick={handleOpenNewPatient} style={{ fontWeight: 800 }}>
                      ➕ Cadastrar Primeiro Paciente
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nome do Paciente</th>
                          <th>Objetivo</th>
                          <th>Data da Última Consulta</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientListWithDetails.map((patient) => (
                          <tr key={patient.id} style={{ cursor: 'pointer' }}>
                            <td onClick={() => handleViewPatientDetail(patient)}>
                              <div className="table-patient-cell">
                                <div className="avatar-mini">
                                  {patient.nome ? patient.nome[0].toUpperCase() : 'P'}
                                </div>
                                <div>
                                  <strong style={{ color: 'var(--primary-dark)', fontSize: '0.98rem' }}>
                                    {patient.nome}
                                  </strong>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {patient.whatsapp || patient.email || 'Sem contato registrado'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td onClick={() => handleViewPatientDetail(patient)}>
                              <span className="badge badge-primary" style={{ fontWeight: 700 }}>
                                {patient.mainObjetivo}
                              </span>
                            </td>
                            <td onClick={() => handleViewPatientDetail(patient)}>
                              <span
                                className={`badge ${patient.lastConsultationDate ? 'badge-info' : 'badge-neutral'}`}
                                style={{ fontWeight: 600 }}
                              >
                                {patient.lastConsultationText}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleViewPatientDetail(patient)}
                                  title="Ver Perfil / Ficha Completa"
                                >
                                  👁️ Perfil
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm btn-icon"
                                  onClick={() => handleEditPatient(patient)}
                                  title="Editar Paciente"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="btn btn-danger-subtle btn-sm btn-icon"
                                  onClick={() => {
                                    if (window.confirm(`Excluir paciente ${patient.nome}?`)) {
                                      handleDeletePatient(patient);
                                    }
                                  }}
                                  title="Excluir Paciente"
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
             ABA 2.1: FORMULÁRIO DE NOVO PACIENTES (PROMPT 4 - PÁGINA NOVA)
             ================================================================ */}
          {activeTab === 'new_patient' && (
            <PatientForm
              onSave={handleSavePatient}
              onCancel={() => setActiveTab('patients')}
            />
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
