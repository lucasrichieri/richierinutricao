import React, { useState, useEffect } from 'react';

const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const REFEICOES_NOMES = [
  { key: 'cafe_da_manha', label: '☕ Café da Manhã', icon: '☕' },
  { key: 'lanche_manha', label: '🍎 Lanche da Manhã', icon: '🍎' },
  { key: 'almoco', label: '🍲 Almoço', icon: '🍲' },
  { key: 'lanche_tarde', label: '🥪 Lanche da Tarde', icon: '🥪' },
  { key: 'jantar', label: '🥗 Jantar', icon: '🥗' },
];

const LOADING_STEPS = [
  '🔍 Coletando dados antropométricos, metas e restrições...',
  '🧠 IA calculando necessidades e distribuição de macronutrientes...',
  '🥗 Elaborando cardápio semanal variado (Segunda a Domingo)...',
  '✨ Formatando 5 opções personalizadas por refeição...',
];

export default function MealPlanModal({
  isOpen,
  onClose,
  onSave,
  patients = [],
  initialPatientId = null,
  planToEdit = null,
}) {
  const [pacienteId, setPacienteId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [caloriasMeta, setCaloriasMeta] = useState('1800');
  const [aguaMeta, setAguaMeta] = useState('2.5');
  const [orientacoesGerais, setOrientacoesGerais] = useState('');
  const [activeDay, setActiveDay] = useState('Segunda-feira');
  const [planoSemanal, setPlanoSemanal] = useState([]);

  // Estados de Geração por IA
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [generationOrigin, setGenerationOrigin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Paciente selecionado
  const selectedPatient = patients.find((p) => p.id === pacienteId) || null;

  useEffect(() => {
    if (!isOpen) return;

    if (planToEdit) {
      setPacienteId(planToEdit.paciente_id || '');
      setTitulo(planToEdit.titulo || 'Plano Alimentar Semanal');
      const conteudo = typeof planToEdit.conteudo === 'string' ? JSON.parse(planToEdit.conteudo) : planToEdit.conteudo;
      setCaloriasMeta(conteudo?.calorias || '1800');
      setAguaMeta(conteudo?.agua || '2.5');
      setOrientacoesGerais(conteudo?.orientacoes_gerais || '');

      if (Array.isArray(conteudo?.plano_semanal) && conteudo.plano_semanal.length > 0) {
        setPlanoSemanal(conteudo.plano_semanal);
      } else if (Array.isArray(conteudo?.refeicoes)) {
        // Converte plano legado para semanal
        const adapted = DIAS_SEMANA.map((dia) => ({
          dia,
          refeicoes: {
            cafe_da_manha: conteudo.refeicoes[0]?.alimentos?.map((a) => `${a.nome} (${a.quantidade})`) || [],
            lanche_manha: ['Fruta fresca da estação (1 porção)', 'Mix de castanhas (2 unidades)'],
            almoco: conteudo.refeicoes[1]?.alimentos?.map((a) => `${a.nome} (${a.quantidade})`) || [],
            lanche_tarde: conteudo.refeicoes[2]?.alimentos?.map((a) => `${a.nome} (${a.quantidade})`) || [],
            jantar: conteudo.refeicoes[3]?.alimentos?.map((a) => `${a.nome} (${a.quantidade})`) || [],
          },
        }));
        setPlanoSemanal(adapted);
      } else {
        setPlanoSemanal([]);
      }
    } else {
      const pid = initialPatientId || (patients[0] ? patients[0].id : '');
      const pat = patients.find((p) => p.id === pid);
      setPacienteId(pid);
      setTitulo(pat ? `Plano Alimentar Semanal - ${pat.nome}` : 'Plano Alimentar Semanal');
      setCaloriasMeta('1800');
      setAguaMeta(pat?.litros_agua ? String(pat.litros_agua) : '2.5');
      setOrientacoesGerais('Mastigar bem e devagar. Ingerir água longe das principais refeições. Priorizar alimentos in natura e evitar ultraprocessados.');
      setPlanoSemanal([]);
      setGenerationOrigin('');
      setErrorMessage('');
    }
  }, [isOpen, planToEdit, initialPatientId, patients]);

  // Atualiza título quando muda o paciente selecionado
  const handlePatientSelect = (e) => {
    const pid = e.target.value;
    setPacienteId(pid);
    const pat = patients.find((p) => p.id === pid);
    if (pat && (!titulo || titulo.startsWith('Plano Alimentar'))) {
      setTitulo(`Plano Alimentar Semanal - ${pat.nome}`);
    }
    if (pat?.litros_agua) {
      setAguaMeta(String(pat.litros_agua));
    }
  };

  // Rotação de mensagens do loading da IA
  useEffect(() => {
    let interval;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1800);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Geração de Plano Alimentar com IA via Serverless Function
  const handleGenerateWithAI = async () => {
    if (!selectedPatient) {
      alert('Por favor, selecione um paciente antes de gerar o plano.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    setGenerationOrigin('');

    try {
      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente: selectedPatient }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.plano?.plano_semanal) {
        throw new Error(data.error || 'Falha na resposta da IA.');
      }

      setPlanoSemanal(data.plano.plano_semanal);
      setGenerationOrigin(data.origem || 'gemini_ia');
      setActiveDay('Segunda-feira');
    } catch (err) {
      console.error('Erro ao gerar com IA:', err);
      setErrorMessage('Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?');
    } finally {
      setIsGenerating(false);
    }
  };

  // Inicializa estrutura manual caso o usuário queira montar sem IA
  const handleInitManualPlan = () => {
    setErrorMessage('');
    const emptyPlan = DIAS_SEMANA.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: ['Ovos mexidos (2 un)', 'Pão integral (2 fatias)', 'Mamão (1 porção)', 'Café sem açúcar (1 xícara)', 'Queijo branco (1 fatia)'],
        lanche_manha: ['Fruta fresca (1 un)', 'Castanhas (2 un)', 'Água de coco (200ml)', 'Sementes de chia (1 colher)', 'Chá de camomila'],
        almoco: ['Salada de folhas verdes à vontade', 'Legumes cozidos no vapor (1 prato)', 'Arroz integral (3 colheres)', 'Feijão (1 concha)', 'Frango grelhado (140g)'],
        lanche_tarde: ['Iogurte natural (1 pote)', 'Aveia em flocos (2 colheres)', 'Frutas vermelhas (1 porção)', 'Canela em pó', 'Sementes de girassol'],
        jantar: ['Mix de folhas com tomate cereja', 'Filé de peixe ou ovos (140g)', 'Purê de abóbora (3 colheres)', 'Sopa de legumes leve', 'Chá de ervas morno'],
      },
    }));
    setPlanoSemanal(emptyPlan);
    setActiveDay('Segunda-feira');
  };

  // Atualização de uma opção de refeição
  const handleOptionChange = (dayName, mealKey, optionIndex, value) => {
    setPlanoSemanal((prev) =>
      prev.map((d) => {
        if (d.dia !== dayName) return d;
        const currentOptions = d.refeicoes?.[mealKey] ? [...d.refeicoes[mealKey]] : [];
        currentOptions[optionIndex] = value;
        return {
          ...d,
          refeicoes: {
            ...d.refeicoes,
            [mealKey]: currentOptions,
          },
        };
      })
    );
  };

  // Adicionar uma nova opção a uma refeição
  const handleAddOption = (dayName, mealKey) => {
    setPlanoSemanal((prev) =>
      prev.map((d) => {
        if (d.dia !== dayName) return d;
        const currentOptions = d.refeicoes?.[mealKey] ? [...d.refeicoes[mealKey]] : [];
        return {
          ...d,
          refeicoes: {
            ...d.refeicoes,
            [mealKey]: [...currentOptions, ''],
          },
        };
      })
    );
  };

  // Remover uma opção de uma refeição
  const handleRemoveOption = (dayName, mealKey, optionIndex) => {
    setPlanoSemanal((prev) =>
      prev.map((d) => {
        if (d.dia !== dayName) return d;
        const currentOptions = d.refeicoes?.[mealKey] ? [...d.refeicoes[mealKey]] : [];
        return {
          ...d,
          refeicoes: {
            ...d.refeicoes,
            [mealKey]: currentOptions.filter((_, idx) => idx !== optionIndex),
          },
        };
      })
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!pacienteId) {
      alert('Selecione um paciente para o plano alimentar.');
      return;
    }
    if (!titulo.trim()) {
      alert('Informe o título do plano alimentar.');
      return;
    }
    if (!planoSemanal || planoSemanal.length === 0) {
      alert('Gere o plano com IA ou inicialize as refeições antes de salvar.');
      return;
    }

    const payload = {
      paciente_id: pacienteId,
      titulo: titulo.trim(),
      conteudo: {
        calorias: caloriasMeta,
        agua: aguaMeta,
        orientacoes_gerais: orientacoesGerais,
        plano_semanal: planoSemanal,
        gerado_com_ia: generationOrigin === 'gemini_ia',
      },
    };

    onSave(payload);
  };

  if (!isOpen) return null;

  const currentDayData = planoSemanal.find((d) => d.dia === activeDay) || planoSemanal[0] || null;

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div
        className="modal-content large"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1020px', width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        <div
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            padding: '1.2rem 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🥗</span>
            <div>
              <h2 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {planToEdit ? 'Editar Plano Alimentar Semanal' : 'Gerador de Plano Alimentar com IA'}
              </h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Elaboração semanal completa e personalizada com Google Gemini
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ fontSize: '1.4rem' }}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
            {/* Header: Seleção do Paciente e Botão de Ação IA */}
            <div
              style={{
                backgroundColor: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div className="form-grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="modal_paciente_id" style={{ fontWeight: 700 }}>
                    Paciente *
                  </label>
                  <select
                    id="modal_paciente_id"
                    className="form-control"
                    value={pacienteId}
                    onChange={handlePatientSelect}
                    required
                  >
                    <option value="">Selecione o paciente...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} {p.email ? `(${p.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="modal_titulo" style={{ fontWeight: 700 }}>
                    Título do Plano *
                  </label>
                  <input
                    type="text"
                    id="modal_titulo"
                    className="form-control"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Plano Alimentar Semanal - Emagrecimento"
                    required
                  />
                </div>
              </div>

              {/* Informações clínicas resumidas do paciente */}
              {selectedPatient && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    alignItems: 'center',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.83rem',
                    color: 'var(--text-main)',
                    marginBottom: '1rem',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>📋 Dados do Paciente:</span>
                  <span><strong>Peso:</strong> {selectedPatient.peso_inicial ? `${selectedPatient.peso_inicial} kg` : '—'}</span>
                  <span>•</span>
                  <span><strong>Altura:</strong> {selectedPatient.altura ? `${selectedPatient.altura} cm` : '—'}</span>
                  <span>•</span>
                  <span><strong>Objetivos:</strong> {Array.isArray(selectedPatient.objetivos) && selectedPatient.objetivos.length > 0 ? selectedPatient.objetivos.join(', ') : 'Geral'}</span>
                  {Array.isArray(selectedPatient.restricoes_alimentares) && selectedPatient.restricoes_alimentares.length > 0 && (
                    <>
                      <span>•</span>
                      <span style={{ color: '#DC2626' }}><strong>Restrições:</strong> {selectedPatient.restricoes_alimentares.join(', ')}</span>
                    </>
                  )}
                  {Array.isArray(selectedPatient.alergias) && selectedPatient.alergias.length > 0 && (
                    <>
                      <span>•</span>
                      <span style={{ color: '#DC2626' }}><strong>Alergias:</strong> {selectedPatient.alergias.join(', ')}</span>
                    </>
                  )}
                </div>
              )}

              {/* Barra de Ações: Gerar com IA / Preenchimento Manual */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating || !pacienteId}
                  style={{
                    background: 'linear-gradient(135deg, #15803D 0%, #047857 50%, #065F46 100%)',
                    boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
                    padding: '0.65rem 1.35rem',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #FFF', borderTopColor: 'transparent' }}></span>
                      Gerando Plano com IA...
                    </>
                  ) : (
                    <>
                      <span>✨</span> Gerar Plano Semanal com IA
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleInitManualPlan}
                  disabled={isGenerating}
                  style={{ fontWeight: 600 }}
                >
                  ✍️ Preencher / Estruturar Manualmente
                </button>

                {generationOrigin === 'gemini_ia' && (
                  <span className="badge badge-success" style={{ fontWeight: 700, padding: '0.45rem 0.75rem' }}>
                    ✨ Gerado com Google Gemini
                  </span>
                )}
              </div>
            </div>

            {/* Mensagem de Erro / Falha da IA com opção manual */}
            {errorMessage && (
              <div
                className="alert alert-error"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div>
                  <strong>Aviso:</strong> {errorMessage}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleGenerateWithAI}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    🔄 Tentar Novamente
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleInitManualPlan}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    ✍️ Criar Plano Manual
                  </button>
                </div>
              </div>
            )}

            {/* Estado de Carregamento da IA Animado */}
            {isGenerating && (
              <div
                style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '2px dashed var(--primary)',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'bounce 1.5s infinite' }}>
                  ✨🧠🥗
                </div>
                <h3 style={{ margin: '0 0 0.5rem', color: 'var(--primary-dark)', fontWeight: 800 }}>
                  Inteligência Artificial em Ação
                </h3>
                <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600 }}>
                  {LOADING_STEPS[loadingStepIndex]}
                </p>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.75rem' }}>
                  Criando opções semanais detalhadas para café, lanches, almoço e jantar...
                </span>
              </div>
            )}

            {/* Interface de Edição por Abas (Dias da Semana) */}
            {planoSemanal.length > 0 && !isGenerating && (
              <div>
                {/* Abas dos Dias da Semana */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.4rem',
                    overflowX: 'auto',
                    paddingBottom: '0.5rem',
                    marginBottom: '1.25rem',
                    borderBottom: '2px solid var(--border-light)',
                  }}
                >
                  {planoSemanal.map((diaObj) => {
                    const isSelected = diaObj.dia === activeDay;
                    return (
                      <button
                        key={diaObj.dia}
                        type="button"
                        onClick={() => setActiveDay(diaObj.dia)}
                        style={{
                          padding: '0.65rem 1.15rem',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span>🗓️</span> {diaObj.dia}
                      </button>
                    );
                  })}
                </div>

                {/* Refeições do Dia Ativo */}
                {currentDayData && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Cardápio de {currentDayData.dia}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Edite as opções diretamente nos campos abaixo
                      </span>
                    </div>

                    {REFEICOES_NOMES.map((refInfo) => {
                      const opcoes = currentDayData.refeicoes?.[refInfo.key] || [];

                      return (
                        <div
                          key={refInfo.key}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--surface)',
                            padding: '1.25rem',
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.85rem',
                              borderBottom: '1px solid var(--border-light)',
                              paddingBottom: '0.5rem',
                            }}
                          >
                            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                              {refInfo.label}
                            </h4>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleAddOption(currentDayData.dia, refInfo.key)}
                              style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                            >
                              ➕ Adicionar Opção
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {opcoes.map((opcaoTexto, optIdx) => (
                              <div
                                key={optIdx}
                                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: 'var(--text-muted)',
                                    minWidth: '68px',
                                  }}
                                >
                                  Opção {optIdx + 1}:
                                </span>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={opcaoTexto}
                                  onChange={(e) =>
                                    handleOptionChange(currentDayData.dia, refInfo.key, optIdx, e.target.value)
                                  }
                                  placeholder={`Ex: Opção saudável para ${refInfo.label}...`}
                                  style={{ fontSize: '0.88rem' }}
                                />
                                {opcoes.length > 1 && (
                                  <button
                                    type="button"
                                    className="btn btn-danger-subtle btn-sm btn-icon"
                                    onClick={() => handleRemoveOption(currentDayData.dia, refInfo.key, optIdx)}
                                    title="Remover esta opção"
                                    style={{ padding: '0.35rem 0.5rem' }}
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Metas Nutricionais & Orientações Gerais */}
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border)',
              }}
            >
              <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Metas & Orientações Gerais do Plano
              </h4>
              <div className="form-grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="calorias_meta" style={{ fontWeight: 600 }}>
                    Meta Calórica Diária (kcal)
                  </label>
                  <input
                    type="text"
                    id="calorias_meta"
                    className="form-control"
                    value={caloriasMeta}
                    onChange={(e) => setCaloriasMeta(e.target.value)}
                    placeholder="Ex: 1800 kcal"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="agua_meta" style={{ fontWeight: 600 }}>
                    Meta Hídrica Diária (Litros)
                  </label>
                  <input
                    type="text"
                    id="agua_meta"
                    className="form-control"
                    value={aguaMeta}
                    onChange={(e) => setAguaMeta(e.target.value)}
                    placeholder="Ex: 2.5 L"
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="orientacoes_gerais" style={{ fontWeight: 600 }}>
                  Recomendações e Orientações Clínicas
                </label>
                <textarea
                  id="orientacoes_gerais"
                  className="form-control"
                  rows={3}
                  value={orientacoesGerais}
                  onChange={(e) => setOrientacoesGerais(e.target.value)}
                  placeholder="Orientações de hidratação, horários, mastigação, condimentos recomendados..."
                />
              </div>
            </div>
          </div>

          <div
            className="modal-footer"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface-hover)',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isGenerating || planoSemanal.length === 0}
              style={{ fontWeight: 800, padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
            >
              💾 Salvar Plano Alimentar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
