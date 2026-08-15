import React, { useState, useEffect } from 'react';

const DEFAULT_MEALS_TEMPLATE = [
  {
    nome: 'Café da Manhã',
    horario: '07:30',
    alimentos: [
      { nome: 'Ovos mexidos ou cozidos', quantidade: '2 unidades', substituicao: 'Tofu grelhado (120g) ou 2 colheres de queijo cottage' },
      { nome: 'Pão 100% integral ou Tapioca', quantidade: '2 fatias (50g) ou 2 colheres de sopa de goma', substituicao: 'Cuscuz (100g)' },
      { nome: 'Fruta fresca (Mamão papaya ou Morangos)', quantidade: '1/2 unidade ou 1 xícara', substituicao: '1 maçã média' },
      { nome: 'Café ou Chá verde sem açúcar', quantidade: '1 xícara (150ml)', substituicao: 'Água com limão' }
    ],
    orientacoes: 'Consumir logo após acordar. Evitar açúcares refinados.'
  },
  {
    nome: 'Almoço',
    horario: '12:30',
    alimentos: [
      { nome: 'Salada de folhas verdes à vontade (Alface, Rúcula, Espinafre)', quantidade: 'À vontade', substituicao: 'Legumes crus ralados' },
      { nome: 'Legumes cozidos no vapor (Brócolis, Cenoura, Abobrinha)', quantidade: '1 prato de sobremesa', substituicao: 'Vagem ou Couve-flor' },
      { nome: 'Arroz integral ou Batata doce assada', quantidade: '3 colheres de sopa cheias (90g)', substituicao: 'Mandioca cozida (100g) ou Quinoa' },
      { nome: 'Feijão preto / carioca ou Lentilha', quantidade: '1 concha média (100g)', substituicao: 'Grão de bico (3 colheres)' },
      { nome: 'Peito de frango grelhado ou Tilápia', quantidade: '1 filé médio (140g)', substituicao: 'Carne bovina magra (Patinho 130g) ou Ovos (3 un)' }
    ],
    orientacoes: 'Temperar a salada com 1 colher de sobremesa de azeite de oliva extravirgem, limão e ervas naturais.'
  },
  {
    nome: 'Lanche da Tarde',
    horario: '16:30',
    alimentos: [
      { nome: 'Iogurte natural desnatado ou de kefir', quantidade: '1 pote (160g)', substituicao: 'Iogurte vegetal sem açúcar' },
      { nome: 'Whey Protein ou Proteína Vegetal isolada', quantidade: '1 scoop (25g)', substituicao: '2 claras de ovo ou sementes de chia' },
      { nome: 'Aveia em flocos finos', quantidade: '2 colheres de sopa (20g)', substituicao: 'Farelo de aveia ou sementes de girassol' },
      { nome: 'Castanhas do Pará ou Nozes', quantidade: '2 unidades', substituicao: '6 amêndoas' }
    ],
    orientacoes: 'Excelente opção pré-treino para garantir saciedade e energia constante.'
  },
  {
    nome: 'Jantar',
    horario: '19:45',
    alimentos: [
      { nome: 'Mix de folhas verdes e Tomate cereja', quantidade: '1 prato fundo', substituicao: 'Salada de pepino com folhas' },
      { nome: 'Proteína magra grelhada (Frango, Peixe ou Ovos)', quantidade: '1 filé grande (150g)', substituicao: 'Omelete com espinafre e tomate' },
      { nome: 'Carboidrato complexo leve (Purê de abóbora cabotiá)', quantidade: '3 colheres de sopa (100g)', substituicao: 'Batata inglesa cozida (100g)' }
    ],
    orientacoes: 'Jantar leve para facilitar a digestão e melhorar a qualidade do sono.'
  }
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
  const [caloriasMeta, setCaloriasMeta] = useState('');
  const [aguaMeta, setAguaMeta] = useState('2.5');
  const [orientacoesGerais, setOrientacoesGerais] = useState('');
  const [refeicoes, setRefeicoes] = useState([]);

  useEffect(() => {
    if (planToEdit) {
      setPacienteId(planToEdit.paciente_id || '');
      setTitulo(planToEdit.titulo || 'Plano Alimentar Personalizado');
      const conteudo = typeof planToEdit.conteudo === 'string' ? JSON.parse(planToEdit.conteudo) : planToEdit.conteudo;
      setCaloriasMeta(conteudo?.calorias || '');
      setAguaMeta(conteudo?.agua || '2.5');
      setOrientacoesGerais(conteudo?.orientacoes_gerais || '');
      setRefeicoes(conteudo?.refeicoes || DEFAULT_MEALS_TEMPLATE);
    } else {
      setPacienteId(initialPatientId || (patients[0] ? patients[0].id : ''));
      setTitulo('Plano Alimentar Personalizado - Richieri Nutrição');
      setCaloriasMeta('1800');
      setAguaMeta('2.5');
      setOrientacoesGerais('Mastigar bem e devagar. Ingerir água longe das principais refeições. Priorizar alimentos in natura e evitar ultraprocessados.');
      setRefeicoes(JSON.parse(JSON.stringify(DEFAULT_MEALS_TEMPLATE)));
    }
  }, [planToEdit, initialPatientId, patients, isOpen]);

  if (!isOpen) return null;

  const handleAddMeal = () => {
    setRefeicoes((prev) => [
      ...prev,
      {
        nome: 'Nova Refeição',
        horario: '15:00',
        alimentos: [{ nome: '', quantidade: '', substituicao: '' }],
        orientacoes: '',
      },
    ]);
  };

  const handleRemoveMeal = (index) => {
    setRefeicoes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMealChange = (index, field, value) => {
    setRefeicoes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddFood = (mealIndex) => {
    setRefeicoes((prev) => {
      const updated = [...prev];
      const foods = updated[mealIndex].alimentos || [];
      updated[mealIndex].alimentos = [...foods, { nome: '', quantidade: '', substituicao: '' }];
      return updated;
    });
  };

  const handleRemoveFood = (mealIndex, foodIndex) => {
    setRefeicoes((prev) => {
      const updated = [...prev];
      updated[mealIndex].alimentos = updated[mealIndex].alimentos.filter((_, i) => i !== foodIndex);
      return updated;
    });
  };

  const handleFoodChange = (mealIndex, foodIndex, field, value) => {
    setRefeicoes((prev) => {
      const updated = [...prev];
      const foods = [...updated[mealIndex].alimentos];
      foods[foodIndex] = { ...foods[foodIndex], [field]: value };
      updated[mealIndex].alimentos = foods;
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pacienteId) {
      alert('Selecione um paciente para o plano alimentar.');
      return;
    }
    if (!titulo.trim()) {
      alert('Informe o título do plano.');
      return;
    }

    const planoPayload = {
      paciente_id: pacienteId,
      titulo,
      conteudo: {
        calorias: caloriasMeta,
        agua: aguaMeta,
        orientacoes_gerais: orientacoesGerais,
        refeicoes,
      },
    };

    onSave(planoPayload);
  };

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <span>🥗 {planToEdit ? 'Editar Plano Alimentar' : 'Criar Plano Alimentar Personalizado'}</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            <div className="form-grid-2" style={{ marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label htmlFor="paciente_id">Paciente *</label>
                <select
                  id="paciente_id"
                  className="form-control"
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  required
                >
                  <option value="">Selecione o paciente...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="titulo">Título / Objetivo do Plano *</label>
                <input
                  type="text"
                  id="titulo"
                  className="form-control"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  placeholder="Ex: Dieta para Emagrecimento e Definição"
                />
              </div>
            </div>

            <div className="form-grid-2" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label htmlFor="caloriasMeta">Meta Calórica Diária (kcal)</label>
                <input
                  type="text"
                  id="caloriasMeta"
                  className="form-control"
                  value={caloriasMeta}
                  onChange={(e) => setCaloriasMeta(e.target.value)}
                  placeholder="Ex: 1800 kcal"
                />
              </div>

              <div className="form-group">
                <label htmlFor="aguaMeta">Meta de Água (Litros / dia)</label>
                <input
                  type="text"
                  id="aguaMeta"
                  className="form-control"
                  value={aguaMeta}
                  onChange={(e) => setAguaMeta(e.target.value)}
                  placeholder="Ex: 2.5 L"
                />
              </div>
            </div>

            {/* Lista de Refeições */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-dark)' }}>🍽️ Refeições Estruturadas</h3>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={handleAddMeal}
              >
                ➕ Adicionar Refeição
              </button>
            </div>

            {refeicoes.map((refeicao, mealIdx) => (
              <div key={mealIdx} className="meal-card">
                <div className="meal-header">
                  <div className="meal-title-group">
                    <input
                      type="text"
                      className="form-control"
                      style={{ fontWeight: '700', width: '220px' }}
                      value={refeicao.nome}
                      onChange={(e) => handleMealChange(mealIdx, 'nome', e.target.value)}
                      placeholder="Nome da refeição"
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Horário:</span>
                    <input
                      type="time"
                      className="form-control meal-time-input"
                      value={refeicao.horario}
                      onChange={(e) => handleMealChange(mealIdx, 'horario', e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-danger-subtle btn-sm"
                    onClick={() => handleRemoveMeal(mealIdx)}
                    title="Remover refeição"
                  >
                    🗑️ Remover Refeição
                  </button>
                </div>

                {/* Lista de Alimentos da Refeição */}
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 36px', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    <span>Alimento</span>
                    <span>Porção / Quantidade</span>
                    <span>Opções de Substituição</span>
                    <span></span>
                  </div>

                  {(refeicao.alimentos || []).map((food, foodIdx) => (
                    <div key={foodIdx} className="food-item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 36px', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Ovos mexidos"
                        value={food.nome}
                        onChange={(e) => handleFoodChange(mealIdx, foodIdx, 'nome', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: 2 unidades"
                        value={food.quantidade}
                        onChange={(e) => handleFoodChange(mealIdx, foodIdx, 'quantidade', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Queijo cottage 2 colheres"
                        value={food.substituicao}
                        onChange={(e) => handleFoodChange(mealIdx, foodIdx, 'substituicao', e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-danger-subtle btn-sm btn-icon"
                        onClick={() => handleRemoveFood(mealIdx, foodIdx)}
                        title="Remover alimento"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
                    onClick={() => handleAddFood(mealIdx)}
                  >
                    ➕ Adicionar Alimento
                  </button>
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem', marginBottom: 0 }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Orientações específicas para esta refeição (opcional)..."
                    value={refeicao.orientacoes || ''}
                    onChange={(e) => handleMealChange(mealIdx, 'orientacoes', e.target.value)}
                    style={{ fontSize: '0.85rem', fontStyle: 'italic' }}
                  />
                </div>
              </div>
            ))}

            {/* Orientações Gerais */}
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label htmlFor="orientacoesGerais">📝 Orientações Nutricionais & Recomendações Gerais</label>
              <textarea
                id="orientacoesGerais"
                className="form-control"
                value={orientacoesGerais}
                onChange={(e) => setOrientacoesGerais(e.target.value)}
                placeholder="Instruções sobre hidratação, sono, temperos recomendados, alimentos a evitar..."
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              💾 Salvar Plano Alimentar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
