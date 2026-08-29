import React, { useState } from 'react';

export default function PatientDetailModal({
  isOpen,
  onClose,
  patient,
  consultations = [],
  mealPlans = [],
  onEditPatient,
  onDeletePatient,
  onNewConsultation,
  onNewMealPlan,
  onViewMealPlan,
}) {
  const [activeTab, setActiveTab] = useState('ficha');

  if (!isOpen || !patient) return null;

  const patientConsultations = consultations.filter((c) => c.paciente_id === patient.id);
  const patientPlans = mealPlans.filter((p) => p.paciente_id === patient.id);

  const calculateAge = (dateString) => {
    if (!dateString) return null;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(patient.data_nascimento);

  const calculatePatientWater = (peso) => {
    const p = parseFloat(peso);
    if (!p || p <= 0 || isNaN(p)) return null;
    const ml = Math.round(p * 35);
    const litros = Number((ml / 1000).toFixed(2));
    return { ml, litros };
  };

  const waterRec = calculatePatientWater(patient.peso_inicial);

  const formatIMC = (peso, altura) => {
    const p = parseFloat(peso);
    const a = parseFloat(altura);
    if (!p || !a) return '—';
    const altMetros = a > 3 ? a / 100 : a;
    const imc = p / (altMetros * altMetros);
    return `${imc.toFixed(1)} kg/m²`;
  };

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ backgroundColor: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="avatar-mini" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
              {patient.nome ? patient.nome[0].toUpperCase() : 'P'}
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.35rem' }}>
                {patient.nome}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                {age && <span>🎂 {age} anos</span>}
                {patient.sexo && <span>• {patient.sexo}</span>}
                {patient.whatsapp && <span>• 📱 {patient.whatsapp}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onEditPatient(patient)}>
              ✏️ Editar
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>

        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'ficha' ? 'active' : ''}`}
            onClick={() => setActiveTab('ficha')}
          >
            📋 Ficha Clínica
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'consultas' ? 'active' : ''}`}
            onClick={() => setActiveTab('consultas')}
          >
            📅 Consultas & Evolução ({patientConsultations.length})
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'planos' ? 'active' : ''}`}
            onClick={() => setActiveTab('planos')}
          >
            🥗 Planos Alimentares ({patientPlans.length})
          </button>
        </div>

        <div className="modal-body">
          {/* ABA FICHA CLÍNICA */}
          {activeTab === 'ficha' && (
            <div>
              {/* Resumo Biométrico */}
              <div className="metrics-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="metric-card" style={{ padding: '1rem' }}>
                  <div className="metric-info">
                    <span className="metric-label">Peso Inicial</span>
                    <span className="metric-value" style={{ fontSize: '1.4rem' }}>
                      {patient.peso_inicial ? `${patient.peso_inicial} kg` : '—'}
                    </span>
                  </div>
                </div>

                <div className="metric-card secondary" style={{ padding: '1rem' }}>
                  <div className="metric-info">
                    <span className="metric-label">Altura</span>
                    <span className="metric-value" style={{ fontSize: '1.4rem' }}>
                      {patient.altura ? `${patient.altura} m` : '—'}
                    </span>
                  </div>
                </div>

                <div className="metric-card info" style={{ padding: '1rem' }}>
                  <div className="metric-info">
                    <span className="metric-label">IMC Inicial</span>
                    <span className="metric-value" style={{ fontSize: '1.4rem' }}>
                      {formatIMC(patient.peso_inicial, patient.altura)}
                    </span>
                  </div>
                </div>

                <div className="metric-card orange" style={{ padding: '1rem' }}>
                  <div className="metric-info">
                    <span className="metric-label">Água / Dia</span>
                    <span className="metric-value" style={{ fontSize: '1.4rem' }}>
                      {patient.litros_agua ? `${patient.litros_agua} L` : (waterRec ? `${waterRec.litros} L` : '—')}
                    </span>
                    {waterRec && (
                      <span style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600, marginTop: '0.2rem', display: 'block' }}>
                        Meta 35ml/kg: {waterRec.litros} L ({waterRec.ml.toLocaleString('pt-BR')} ml)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Objetivos */}
              <div className="panel" style={{ marginBottom: '1rem' }}>
                <div className="panel-header" style={{ padding: '0.85rem 1.25rem' }}>
                  <div className="panel-title" style={{ fontSize: '0.95rem' }}>🎯 Objetivos & Metas</div>
                </div>
                <div className="panel-body" style={{ padding: '1rem 1.25rem' }}>
                  {patient.objetivos && patient.objetivos.length > 0 ? (
                    <div className="tag-list" style={{ marginBottom: '0.75rem' }}>
                      {patient.objetivos.map((obj, i) => (
                        <span key={i} className="badge badge-primary">{obj}</span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum objetivo listado.</p>
                  )}
                  {patient.objetivo_texto && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.5rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px' }}>
                      {patient.objetivo_texto}
                    </p>
                  )}
                </div>
              </div>

              {/* Histórico Clínico & Alergias */}
              <div className="panel" style={{ marginBottom: '1rem' }}>
                <div className="panel-header" style={{ padding: '0.85rem 1.25rem' }}>
                  <div className="panel-title" style={{ fontSize: '0.95rem' }}>🩺 Patologias, Alergias e Medicamentos</div>
                </div>
                <div className="panel-body" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Patologias:</strong>
                    {patient.patologias && patient.patologias.length > 0 ? (
                      <div className="tag-list">
                        {patient.patologias.map((p, i) => (
                          <span key={i} className="badge badge-warning">{p}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhuma condição informada</span>
                    )}
                  </div>

                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Alergias Alimentares:</strong>
                    {patient.alergias && patient.alergias.length > 0 ? (
                      <div className="tag-list">
                        {patient.alergias.map((a, i) => (
                          <span key={i} className="badge badge-danger">{a}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhuma alergia conhecida</span>
                    )}
                  </div>

                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Restrições / Preferências:</strong>
                    {patient.restricoes_alimentares && patient.restricoes_alimentares.length > 0 ? (
                      <div className="tag-list">
                        {patient.restricoes_alimentares.map((r, i) => (
                          <span key={i} className="badge badge-info">{r}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhuma restrição alimentar</span>
                    )}
                  </div>

                  <div className="form-grid-2" style={{ marginTop: '0.5rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Medicamentos:</strong>
                      <p style={{ fontSize: '0.9rem' }}>{patient.medicamentos || 'Nenhum'}</p>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Suplementos:</strong>
                      <p style={{ fontSize: '0.9rem' }}>{patient.suplementos || 'Nenhum'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rotina & Atividade Física */}
              <div className="panel">
                <div className="panel-header" style={{ padding: '0.85rem 1.25rem' }}>
                  <div className="panel-title" style={{ fontSize: '0.95rem' }}>🏃 Rotina e Hábitos</div>
                </div>
                <div className="panel-body" style={{ padding: '1rem 1.25rem' }}>
                  <div className="form-grid-4" style={{ marginBottom: '0.75rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nível de Atividade:</strong>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{patient.nivel_atividade || '—'}</p>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Refeições / Dia:</strong>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{patient.refeicoes_por_dia || '—'}</p>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Acorda:</strong>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{patient.horario_acorda || '—'}</p>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dorme:</strong>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{patient.horario_dorme || '—'}</p>
                    </div>
                  </div>

                  {waterRec && (
                    <div style={{ marginTop: '0.6rem', background: '#EFF6FF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>💧</span>
                      <div>
                        <strong style={{ color: '#1E40AF', fontSize: '0.85rem', display: 'block' }}>
                          Meta de Hidratação Diária (35 ml/kg): {waterRec.litros} Litros ({waterRec.ml.toLocaleString('pt-BR')} ml)
                        </strong>
                        <span style={{ color: '#2563EB', fontSize: '0.8rem' }}>
                          Baseado no peso corporal: {patient.peso_inicial} kg × 35 ml
                        </span>
                      </div>
                    </div>
                  )}

                  {patient.atividade_fisica && (
                    <div style={{ marginTop: '0.5rem', background: '#F0FDF4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                      <strong style={{ color: '#166534', fontSize: '0.85rem' }}>Atividade Física Regular:</strong>
                      <p style={{ fontSize: '0.9rem', color: '#14532D', marginTop: '0.2rem' }}>
                        {patient.atividade_fisica_descricao || 'Pratica atividade regularmente'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABA CONSULTAS */}
          {activeTab === 'consultas' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Histórico de Consultas</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onNewConsultation(patient.id)}
                >
                  ➕ Registrar Nova Consulta
                </button>
              </div>

              {patientConsultations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>Nenhuma consulta registrada</h3>
                  <p>Registre a primeira consulta para acompanhar a evolução antropométrica do paciente.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Peso</th>
                        <th>Cintura</th>
                        <th>Quadril</th>
                        <th>% Gordura</th>
                        <th>Próximo Retorno</th>
                        <th>Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientConsultations.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{new Date(c.data_consulta).toLocaleDateString('pt-BR')}</strong></td>
                          <td>{c.peso ? `${c.peso} kg` : '—'}</td>
                          <td>{c.cintura ? `${c.cintura} cm` : '—'}</td>
                          <td>{c.quadril ? `${c.quadril} cm` : '—'}</td>
                          <td>{c.percentual_gordura ? `${c.percentual_gordura}%` : '—'}</td>
                          <td>
                            {c.proximo_retorno ? (
                              <span className="badge badge-info">
                                {new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.observacoes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA PLANOS ALIMENTARES */}
          {activeTab === 'planos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Planos Alimentares</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onNewMealPlan(patient.id)}
                >
                  🥗 Criar Plano Alimentar
                </button>
              </div>

              {patientPlans.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🥗</div>
                  <h3>Nenhum plano alimentar cadastrado</h3>
                  <p>Crie um plano alimentar estruturado e personalizado para este paciente.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {patientPlans.map((plano) => {
                    const conteudo = typeof plano.conteudo === 'string' ? JSON.parse(plano.conteudo) : plano.conteudo;
                    const meals = conteudo?.refeicoes || [];

                    return (
                      <div key={plano.id} className="panel" style={{ marginBottom: 0 }}>
                        <div className="panel-header">
                          <div>
                            <div className="panel-title">{plano.titulo || 'Plano Alimentar'}</div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Criado em {new Date(plano.created_at || Date.now()).toLocaleDateString('pt-BR')} • {meals.length} refeições planejadas
                            </span>
                          </div>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => onViewMealPlan(plano)}
                          >
                            👁️ Ver & Imprimir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn btn-danger-subtle btn-sm"
            onClick={() => {
              if (window.confirm(`Tem certeza que deseja excluir o cadastro de ${patient.nome}?`)) {
                onDeletePatient(patient);
                onClose();
              }
            }}
          >
            🗑️ Excluir Paciente
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar Prontuário
          </button>
        </div>
      </div>
    </div>
  );
}
