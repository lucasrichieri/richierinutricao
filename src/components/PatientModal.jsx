import React, { useState, useEffect } from 'react';

const PRESET_OBJETIVOS = [
  'Emagrecimento',
  'Hipertrofia',
  'Reeducação Alimentar',
  'Definição Muscular',
  'Performance Esportiva',
  'Controle de Glicemia',
  'Saúde e Longevidade',
  'Ganho de Peso',
];

const PRESET_PATOLOGIAS = [
  'Diabetes Tipo 1',
  'Diabetes Tipo 2',
  'Hipertensão',
  'Hipotireoidismo',
  'Dislipidemia',
  'Gastrite / Refluxo',
  'SOP',
  'Intestino Irritável',
];

const PRESET_RESTRICOES = [
  'Sem Lactose',
  'Sem Glúten',
  'Vegetariano',
  'Vegano',
  'Low Carb',
];

const PRESET_ALERGIAS = [
  'Lactose / Proteína do Leite',
  'Glúten',
  'Amendoim / Nozes',
  'Frutos do Mar',
  'Ovo',
  'Soja',
];

export default function PatientModal({ isOpen, onClose, onSave, patientToEdit = null }) {
  const [activeTab, setActiveTab] = useState('pessoal');

  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: 'Feminino',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: 'Moderado',
    patologias: [],
    restricoes_alimentares: [],
    alergias: [],
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: 4,
    horario_acorda: '07:00',
    horario_dorme: '23:00',
    litros_agua: 2.5,
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: '',
  });

  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        ...patientToEdit,
        objetivos: patientToEdit.objetivos || [],
        patologias: patientToEdit.patologias || [],
        restricoes_alimentares: patientToEdit.restricoes_alimentares || [],
        alergias: patientToEdit.alergias || [],
      });
    } else {
      setFormData({
        nome: '',
        data_nascimento: '',
        sexo: 'Feminino',
        whatsapp: '',
        email: '',
        peso_inicial: '',
        altura: '',
        objetivos: [],
        objetivo_texto: '',
        nivel_atividade: 'Moderado',
        patologias: [],
        restricoes_alimentares: [],
        alergias: [],
        medicamentos: '',
        suplementos: '',
        refeicoes_por_dia: 4,
        horario_acorda: '07:00',
        horario_dorme: '23:00',
        litros_agua: 2.5,
        atividade_fisica: false,
        atividade_fisica_descricao: '',
        observacoes: '',
      });
    }
    setActiveTab('pessoal');
  }, [patientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleArrayItem = (fieldName, item) => {
    setFormData((prev) => {
      const currentList = prev[fieldName] || [];
      const exists = currentList.includes(item);
      const updated = exists
        ? currentList.filter((i) => i !== item)
        : [...currentList, item];
      return { ...prev, [fieldName]: updated };
    });
  };

  const calculateIMC = () => {
    const peso = parseFloat(formData.peso_inicial);
    const altura = parseFloat(formData.altura);
    if (!peso || !altura) return null;
    const alturaMetros = altura > 3 ? altura / 100 : altura;
    const imc = peso / (alturaMetros * alturaMetros);
    let classif = '';
    if (imc < 18.5) classif = 'Abaixo do peso';
    else if (imc < 24.9) classif = 'Peso normal';
    else if (imc < 29.9) classif = 'Sobrepeso';
    else if (imc < 34.9) classif = 'Obesidade Grau I';
    else if (imc < 39.9) classif = 'Obesidade Grau II';
    else classif = 'Obesidade Grau III';
    return { value: imc.toFixed(1), classif };
  };

  const calculateWater = () => {
    const p = parseFloat(formData.peso_inicial);
    if (!p || p <= 0 || isNaN(p)) return null;
    const ml = Math.round(p * 35);
    const litros = Number((ml / 1000).toFixed(2));
    return { ml, litros };
  };

  const imc = calculateIMC();
  const waterRec = calculateWater();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      alert('Por favor, informe o nome do paciente.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div
        className="modal-content large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            <span>{patientToEdit ? '✏️ Editar Paciente' : '👤 Novo Paciente'}</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
            onClick={() => setActiveTab('pessoal')}
          >
            1. Dados Pessoais
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'biometria' ? 'active' : ''}`}
            onClick={() => setActiveTab('biometria')}
          >
            2. Medidas & Objetivos
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
            onClick={() => setActiveTab('clinico')}
          >
            3. Histórico Clínico
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'rotina' ? 'active' : ''}`}
            onClick={() => setActiveTab('rotina')}
          >
            4. Rotina & Hábitos
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {/* ABA 1: DADOS PESSOAIS */}
            {activeTab === 'pessoal' && (
              <div>
                <div className="form-group">
                  <label htmlFor="nome">Nome Completo *</label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    className="form-control"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                  />
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="data_nascimento">Data de Nascimento</label>
                    <input
                      type="date"
                      id="data_nascimento"
                      name="data_nascimento"
                      className="form-control"
                      value={formData.data_nascimento}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sexo">Sexo Biológico</label>
                    <select
                      id="sexo"
                      name="sexo"
                      className="form-control"
                      value={formData.sexo}
                      onChange={handleChange}
                    >
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="whatsapp">WhatsApp / Celular</label>
                    <input
                      type="text"
                      id="whatsapp"
                      name="whatsapp"
                      className="form-control"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      placeholder="(11) 98765-4321"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">E-mail</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="paciente@exemplo.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="observacoes">Observações Gerais</label>
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    className="form-control"
                    value={formData.observacoes}
                    onChange={handleChange}
                    placeholder="Informações adicionais, indicações, preferências..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* ABA 2: BIOMETRIA & OBJETIVOS */}
            {activeTab === 'biometria' && (
              <div>
                <div className="form-grid-3" style={{ marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label htmlFor="peso_inicial">Peso Inicial (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      id="peso_inicial"
                      name="peso_inicial"
                      className="form-control"
                      value={formData.peso_inicial}
                      onChange={handleChange}
                      placeholder="Ex: 72.5"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="altura">Altura (m ou cm)</label>
                    <input
                      type="number"
                      step="0.01"
                      id="altura"
                      name="altura"
                      className="form-control"
                      value={formData.altura}
                      onChange={handleChange}
                      placeholder="Ex: 1.70 ou 170"
                    />
                  </div>

                  <div className="form-group">
                    <label>IMC Estimado</label>
                    <div
                      style={{
                        padding: '0.65rem 0.85rem',
                        backgroundColor: '#F1F5F9',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: 'var(--text-main)',
                      }}
                    >
                      {imc ? `${imc.value} kg/m² (${imc.classif})` : '—'}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Objetivos Principais</label>
                  <div className="tag-list" style={{ marginTop: '0.5rem' }}>
                    {PRESET_OBJETIVOS.map((obj) => (
                      <span
                        key={obj}
                        className={`tag-selectable ${
                          (formData.objetivos || []).includes(obj) ? 'selected' : ''
                        }`}
                        onClick={() => toggleArrayItem('objetivos', obj)}
                      >
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="objetivo_texto">Detalhes do Objetivo / Meta do Paciente</label>
                  <textarea
                    id="objetivo_texto"
                    name="objetivo_texto"
                    className="form-control"
                    value={formData.objetivo_texto}
                    onChange={handleChange}
                    placeholder="Ex: Quer perder 8kg até o final do ano e melhorar a disposição para treinar."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* ABA 3: HISTÓRICO CLÍNICO */}
            {activeTab === 'clinico' && (
              <div>
                <div className="form-group">
                  <label>Patologias / Condições Diagnosticadas</label>
                  <div className="tag-list" style={{ marginTop: '0.4rem' }}>
                    {PRESET_PATOLOGIAS.map((pat) => (
                      <span
                        key={pat}
                        className={`tag-selectable ${
                          (formData.patologias || []).includes(pat) ? 'selected' : ''
                        }`}
                        onClick={() => toggleArrayItem('patologias', pat)}
                      >
                        {pat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.25rem' }}>
                  <label>Alergias Alimentares</label>
                  <div className="tag-list" style={{ marginTop: '0.4rem' }}>
                    {PRESET_ALERGIAS.map((ale) => (
                      <span
                        key={ale}
                        className={`tag-selectable ${
                          (formData.alergias || []).includes(ale) ? 'selected' : ''
                        }`}
                        onClick={() => toggleArrayItem('alergias', ale)}
                      >
                        {ale}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.25rem' }}>
                  <label>Restrições / Preferências</label>
                  <div className="tag-list" style={{ marginTop: '0.4rem' }}>
                    {PRESET_RESTRICOES.map((res) => (
                      <span
                        key={res}
                        className={`tag-selectable ${
                          (formData.restricoes_alimentares || []).includes(res) ? 'selected' : ''
                        }`}
                        onClick={() => toggleArrayItem('restricoes_alimentares', res)}
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: '1.25rem' }}>
                  <div className="form-group">
                    <label htmlFor="medicamentos">Medicamentos em Uso</label>
                    <textarea
                      id="medicamentos"
                      name="medicamentos"
                      className="form-control"
                      value={formData.medicamentos}
                      onChange={handleChange}
                      placeholder="Ex: Metformina 500mg, Levotiroxina 50mcg..."
                      rows={2}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="suplementos">Suplementos Atuais</label>
                    <textarea
                      id="suplementos"
                      name="suplementos"
                      className="form-control"
                      value={formData.suplementos}
                      onChange={handleChange}
                      placeholder="Ex: Creatina 5g, Whey Protein, Vitamina D3..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 4: ROTINA & HÁBITOS */}
            {activeTab === 'rotina' && (
              <div>
                <div className="form-grid-4">
                  <div className="form-group">
                    <label htmlFor="nivel_atividade">Nível de Atividade</label>
                    <select
                      id="nivel_atividade"
                      name="nivel_atividade"
                      className="form-control"
                      value={formData.nivel_atividade}
                      onChange={handleChange}
                    >
                      <option value="Sedentário">Sedentário</option>
                      <option value="Leve">Leve</option>
                      <option value="Moderado">Moderado</option>
                      <option value="Intenso">Intenso</option>
                      <option value="Atleta">Muito Intenso / Atleta</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="refeicoes_por_dia">Refeições / Dia</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      id="refeicoes_por_dia"
                      name="refeicoes_por_dia"
                      className="form-control"
                      value={formData.refeicoes_por_dia}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="horario_acorda">Horário Acorda</label>
                    <input
                      type="time"
                      id="horario_acorda"
                      name="horario_acorda"
                      className="form-control"
                      value={formData.horario_acorda}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="horario_dorme">Horário Dorme</label>
                    <input
                      type="time"
                      id="horario_dorme"
                      name="horario_dorme"
                      className="form-control"
                      value={formData.horario_dorme}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label htmlFor="litros_agua" style={{ margin: 0, fontWeight: 700 }}>
                        Consumo de Água (Litros / dia)
                      </label>
                      {waterRec && (
                        <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                          💧 Meta: {waterRec.litros} L ({waterRec.ml.toLocaleString('pt-BR')} ml)
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      id="litros_agua"
                      name="litros_agua"
                      className="form-control"
                      value={formData.litros_agua}
                      onChange={handleChange}
                    />
                    {waterRec && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        style={{ marginTop: '0.4rem', fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '12px' }}
                        onClick={() => setFormData((prev) => ({ ...prev, litros_agua: waterRec.litros }))}
                      >
                        ⚡ Aplicar cálculo 35ml/kg ({waterRec.litros} L)
                      </button>
                    )}
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="atividade_fisica"
                        checked={formData.atividade_fisica}
                        onChange={handleChange}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                      />
                      <span>Pratica Atividade Física Regular</span>
                    </label>
                  </div>
                </div>

                {formData.atividade_fisica && (
                  <div className="form-group">
                    <label htmlFor="atividade_fisica_descricao">Detalhes da Atividade Física (Modalidade, frequência, duração)</label>
                    <input
                      type="text"
                      id="atividade_fisica_descricao"
                      name="atividade_fisica_descricao"
                      className="form-control"
                      value={formData.atividade_fisica_descricao}
                      onChange={handleChange}
                      placeholder="Ex: Musculação 5x na semana (50min) + Corrida aos sábados"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            {activeTab !== 'rotina' ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (activeTab === 'pessoal') setActiveTab('biometria');
                  else if (activeTab === 'biometria') setActiveTab('clinico');
                  else if (activeTab === 'clinico') setActiveTab('rotina');
                }}
              >
                Próxima Etapa ➔
              </button>
            ) : (
              <button type="submit" className="btn btn-primary">
                💾 Salvar Paciente
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
