import React, { useState, useEffect } from 'react';
import WeightEvolutionChart from './WeightEvolutionChart';

const PRESET_OBJETIVOS = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const PRESET_PATOLOGIAS = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
];

const PRESET_RESTRICOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
];

const PRESET_ALERGIAS = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
];

export default function PatientProfileView({
  patient,
  consultations = [],
  mealPlans = [],
  onBack,
  onSavePatient,
  onDeletePatient,
  onOpenNewConsultation,
  onEditConsultation,
  onDeleteConsultation,
  onOpenNewMealPlan,
  onViewMealPlan,
}) {
  // Seção ativa da página de perfil (Prompt 5: Dados do Paciente, Consultas, Planos Alimentares)
  const [activeSection, setActiveSection] = useState('dados'); // 'dados' | 'consultas' | 'planos'

  // Aba ativa dentro da Seção 1 (Dados do Paciente: Pessoal, Clínico, Hábitos)
  const [dataTab, setDataTab] = useState('pessoal'); // 'pessoal' | 'clinico' | 'habitos'

  // Estado do formulário de dados do paciente para edição direta na página
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: 'Feminino',
    telefone: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: 'Moderadamente ativo',
    patologias: [],
    patologia_custom: '',
    restricoes_alimentares: [],
    restricao_custom: '',
    alergias: [],
    alergia_custom: '',
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: 4,
    horario_acorda: '06:00',
    horario_dorme: '22:30',
    litros_agua: 2,
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        nome: patient.nome || '',
        data_nascimento: patient.data_nascimento
          ? typeof patient.data_nascimento === 'string'
            ? patient.data_nascimento.substring(0, 10)
            : patient.data_nascimento
          : '',
        sexo: patient.sexo || 'Feminino',
        telefone: patient.telefone || '',
        whatsapp: patient.whatsapp || '',
        email: patient.email || '',
        peso_inicial: patient.peso_inicial != null ? String(patient.peso_inicial) : '',
        altura: patient.altura != null ? String(patient.altura) : '',
        objetivos: Array.isArray(patient.objetivos) ? patient.objetivos : [],
        objetivo_texto: patient.objetivo_texto || '',
        nivel_atividade: patient.nivel_atividade || 'Moderadamente ativo',
        patologias: Array.isArray(patient.patologias) ? patient.patologias : [],
        patologia_custom: '',
        restricoes_alimentares: Array.isArray(patient.restricoes_alimentares) ? patient.restricoes_alimentares : [],
        restricao_custom: '',
        alergias: Array.isArray(patient.alergias) ? patient.alergias : [],
        alergia_custom: '',
        medicamentos: patient.medicamentos || '',
        suplementos: patient.suplementos || '',
        refeicoes_por_dia: patient.refeicoes_por_dia || 4,
        horario_acorda: patient.horario_acorda || '06:00',
        horario_dorme: patient.horario_dorme || '22:30',
        litros_agua: patient.litros_agua != null ? patient.litros_agua : 2,
        atividade_fisica: Boolean(patient.atividade_fisica),
        atividade_fisica_descricao: patient.atividade_fisica_descricao || '',
        observacoes: patient.observacoes || '',
      });
    }
  }, [patient]);

  if (!patient) {
    return (
      <div className="section-content" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p>Nenhum paciente selecionado.</p>
        <button className="btn btn-primary" onClick={onBack}>
          ← Voltar para Pacientes
        </button>
      </div>
    );
  }

  // Consultas do paciente filtradas e ordenadas em ordem cronológica decrescente
  const patientConsultations = [...consultations]
    .filter((c) => c.paciente_id === patient.id)
    .sort((a, b) => new Date(b.data_consulta || b.created_at) - new Date(a.data_consulta || a.created_at));

  // Planos alimentares do paciente filtrados e ordenados em ordem cronológica decrescente
  const patientMealPlans = [...mealPlans]
    .filter((p) => p.paciente_id === patient.id)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  // Handlers para edição dos campos
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    if (name === 'telefone' || name === 'whatsapp') {
      const num = value.replace(/\D/g, '');
      if (num.length <= 10) {
        newValue = num.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
      } else {
        newValue = num.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
      }
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleTimeBlur = (name) => {
    const rawVal = formData[name];
    if (!rawVal) return;
    const clean = String(rawVal).trim().replace(/\D/g, '');
    if (!clean) return;

    let formatted = rawVal;
    if (clean.length === 1) formatted = `0${clean}:00`;
    else if (clean.length === 2) {
      const h = parseInt(clean, 10);
      formatted = h <= 24 ? `${clean.padStart(2, '0')}:00` : rawVal;
    } else if (clean.length === 3) {
      const h = clean.substring(0, 1).padStart(2, '0');
      const m = clean.substring(1, 3);
      formatted = `${h}:${m}`;
    } else if (clean.length === 4) {
      const h = clean.substring(0, 2);
      const m = clean.substring(2, 4);
      formatted = `${h}:${m}`;
    }

    setFormData((prev) => ({ ...prev, [name]: formatted }));
  };

  const toggleCheckboxItem = (fieldName, item) => {
    setFormData((prev) => {
      const current = prev[fieldName] || [];
      if (item === 'Nenhum') {
        const exists = current.includes('Nenhum');
        return { ...prev, [fieldName]: exists ? [] : ['Nenhum'] };
      }
      const withoutNenhum = current.filter((i) => i !== 'Nenhum');
      const exists = withoutNenhum.includes(item);
      const updated = exists ? withoutNenhum.filter((i) => i !== item) : [...withoutNenhum, item];
      return { ...prev, [fieldName]: updated };
    });
  };

  // Cálculo de idade
  const calculateAge = (dob) => {
    if (!dob) return '';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} anos` : '';
  };

  // Cálculo de IMC
  const calculateIMC = () => {
    const p = parseFloat(formData.peso_inicial);
    const a = parseFloat(formData.altura);
    if (!p || !a || a <= 0) return '';
    const altMetros = a > 3 ? a / 100 : a;
    const imc = p / (altMetros * altMetros);
    let classif = '';
    if (imc < 18.5) classif = 'Abaixo do peso';
    else if (imc < 24.9) classif = 'Peso normal';
    else if (imc < 29.9) classif = 'Sobrepeso';
    else if (imc < 34.9) classif = 'Obesidade Grau I';
    else if (imc < 39.9) classif = 'Obesidade Grau II';
    else classif = 'Obesidade Grau III';
    return `${imc.toFixed(1)} kg/m² (${classif})`;
  };

  // Cálculo de Consumo Diário de Água: Peso (kg) × 35 ml
  const calculateWater = () => {
    const p = parseFloat(formData.peso_inicial);
    if (!p || p <= 0 || isNaN(p)) return null;
    const ml = Math.round(p * 35);
    const litros = Number((ml / 1000).toFixed(2));
    return {
      ml,
      litros,
      formula: `${p} kg × 35 ml = ${ml.toLocaleString('pt-BR')} ml (${litros} L)`,
    };
  };

  const ageText = calculateAge(formData.data_nascimento);
  const imcText = calculateIMC();
  const waterRec = calculateWater();

  // Salvar alterações de cadastro diretamente na página
  const handleSaveData = async (e) => {
    if (e) e.preventDefault();
    if (!formData.nome || !formData.nome.trim()) {
      alert('Por favor, informe o nome completo do paciente.');
      return;
    }

    setSaving(true);
    try {
      const finalPatologias = [...(formData.patologias || [])];
      if (formData.patologia_custom?.trim() && !finalPatologias.includes(formData.patologia_custom.trim())) {
        finalPatologias.push(formData.patologia_custom.trim());
      }

      const finalRestricoes = [...(formData.restricoes_alimentares || [])];
      if (formData.restricao_custom?.trim() && !finalRestricoes.includes(formData.restricao_custom.trim())) {
        finalRestricoes.push(formData.restricao_custom.trim());
      }

      const finalAlergias = [...(formData.alergias || [])];
      if (formData.alergia_custom?.trim() && !finalAlergias.includes(formData.alergia_custom.trim())) {
        finalAlergias.push(formData.alergia_custom.trim());
      }

      const payload = {
        ...formData,
        nome: formData.nome.trim(),
        patologias: finalPatologias,
        restricoes_alimentares: finalRestricoes,
        alergias: finalAlergias,
      };

      await onSavePatient(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ====================================================================
          BARRA SUPERIOR DE NAVEGAÇÃO & IDENTIFICAÇÃO DO PACIENTE
          ==================================================================== */}
      <div
        className="panel"
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Dados resumidos do paciente */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onBack}
              title="Voltar para a lista de pacientes"
            >
              ← Voltar
            </button>

            <div
              className="avatar-mini"
              style={{
                width: '48px',
                height: '48px',
                fontSize: '1.3rem',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary-dark)',
              }}
            >
              {patient.nome ? patient.nome[0].toUpperCase() : 'P'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {patient.nome}
                </h1>
                {formData.sexo && <span className="badge badge-secondary">{formData.sexo}</span>}
              </div>

              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  marginTop: '0.25rem',
                  flexWrap: 'wrap',
                }}
              >
                {ageText && <span>🎂 {ageText}</span>}
                {formData.whatsapp && <span>📱 {formData.whatsapp}</span>}
                {formData.email && <span>✉️ {formData.email}</span>}
              </div>
            </div>
          </div>

          {/* Ações rápidas */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onOpenNewConsultation(patient.id)}
            >
              ➕ Nova Consulta
            </button>
            <button
              type="button"
              className="btn btn-danger-subtle btn-sm"
              onClick={() => {
                if (window.confirm(`Tem certeza que deseja excluir o paciente ${patient.nome}?`)) {
                  onDeletePatient(patient);
                }
              }}
              title="Excluir paciente"
            >
              🗑️ Excluir
            </button>
          </div>
        </div>

        {/* 3 SEÇÕES PRINCIPAIS DO PERFIL (Prompt 5: Dados do Paciente, Consultas, Planos Alimentares) */}
        <div
          className="modal-tabs"
          style={{
            marginTop: '1.25rem',
            marginBottom: 0,
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            gap: '0.5rem',
          }}
        >
          <button
            type="button"
            className={`modal-tab-btn ${activeSection === 'dados' ? 'active' : ''}`}
            onClick={() => setActiveSection('dados')}
            style={{ fontSize: '0.95rem', fontWeight: 700, padding: '0.65rem 1.25rem' }}
          >
            📋 1. Dados do Paciente
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeSection === 'consultas' ? 'active' : ''}`}
            onClick={() => setActiveSection('consultas')}
            style={{ fontSize: '0.95rem', fontWeight: 700, padding: '0.65rem 1.25rem' }}
          >
            📅 2. Consultas & Evolução ({patientConsultations.length})
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeSection === 'planos' ? 'active' : ''}`}
            onClick={() => setActiveSection('planos')}
            style={{ fontSize: '0.95rem', fontWeight: 700, padding: '0.65rem 1.25rem' }}
          >
            🥗 3. Planos Alimentares ({patientMealPlans.length})
          </button>
        </div>
      </div>

      {/* ====================================================================
          SEÇÃO 1 — DADOS DO PACIENTE (EDITÁVEIS DIRETAMENTE NA PÁGINA)
          ==================================================================== */}
      {activeSection === 'dados' && (
        <div
          className="panel"
          style={{
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Sub-abas da Seção 1 (Prompt 5: Pessoal, Clínico e Hábitos) */}
          <div
            className="modal-tabs"
            style={{
              backgroundColor: 'var(--surface-muted)',
              borderBottom: '1px solid var(--border-light)',
              padding: '0 1.5rem',
            }}
          >
            <button
              type="button"
              className={`modal-tab-btn ${dataTab === 'pessoal' ? 'active' : ''}`}
              onClick={() => setDataTab('pessoal')}
            >
              1. Pessoal
            </button>
            <button
              type="button"
              className={`modal-tab-btn ${dataTab === 'clinico' ? 'active' : ''}`}
              onClick={() => setDataTab('clinico')}
            >
              2. Clínico
            </button>
            <button
              type="button"
              className={`modal-tab-btn ${dataTab === 'habitos' ? 'active' : ''}`}
              onClick={() => setDataTab('habitos')}
            >
              3. Hábitos
            </button>
          </div>

          <form onSubmit={handleSaveData}>
            <div style={{ padding: '1.75rem' }}>
              {/* ABA 1 — PESSOAL */}
              {dataTab === 'pessoal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label htmlFor="nome" style={{ fontWeight: 700 }}>
                      Nome Completo <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      className="form-control"
                      value={formData.nome}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label htmlFor="data_nascimento">Data de Nascimento</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="date"
                          id="data_nascimento"
                          name="data_nascimento"
                          className="form-control"
                          value={formData.data_nascimento}
                          onChange={handleChange}
                        />
                        {ageText && (
                          <span
                            className="badge badge-info"
                            style={{ whiteSpace: 'nowrap', fontWeight: 700, padding: '0.4rem 0.6rem' }}
                          >
                            {ageText}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="sexo">Sexo</label>
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
                      <label htmlFor="telefone">Telefone</label>
                      <input
                        type="text"
                        id="telefone"
                        name="telefone"
                        className="form-control"
                        value={formData.telefone}
                        onChange={handleChange}
                        placeholder="(11) 99999-8888"
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="whatsapp">WhatsApp</label>
                      <input
                        type="text"
                        id="whatsapp"
                        name="whatsapp"
                        className="form-control"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        placeholder="(11) 99999-8888"
                      />
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
                  </div>
                </div>
              )}

              {/* ABA 2 — CLÍNICO */}
              {dataTab === 'clinico' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Peso, Altura e IMC */}
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label htmlFor="peso_inicial">Peso Atual</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="number"
                          step="0.1"
                          id="peso_inicial"
                          name="peso_inicial"
                          className="form-control"
                          value={formData.peso_inicial}
                          onChange={handleChange}
                          placeholder="70.5"
                          style={{ paddingRight: '2.5rem' }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '0.85rem',
                            color: 'var(--text-muted)',
                            fontWeight: 700,
                            pointerEvents: 'none',
                          }}
                        >
                          kg
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="altura">Altura</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="number"
                          step="1"
                          id="altura"
                          name="altura"
                          className="form-control"
                          value={formData.altura}
                          onChange={handleChange}
                          placeholder="168"
                          style={{ paddingRight: '2.5rem' }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '0.85rem',
                            color: 'var(--text-muted)',
                            fontWeight: 700,
                            pointerEvents: 'none',
                          }}
                        >
                          cm
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>IMC (Calculado Automático)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={imcText || 'Preencha peso e altura'}
                        readOnly
                        style={{
                          backgroundColor: 'var(--surface-muted)',
                          fontWeight: 700,
                          color: imcText ? 'var(--primary-dark)' : 'var(--text-muted)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Card de Cálculo de Consumo Diário de Água (35 ml/kg) */}
                  {waterRec && (
                    <div
                      style={{
                        backgroundColor: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>💧</span>
                        <div>
                          <strong style={{ color: '#166534', fontSize: '0.95rem', display: 'block' }}>
                            Consumo Diário de Água Recomendado: {waterRec.litros} L/dia ({waterRec.ml.toLocaleString('pt-BR')} ml)
                          </strong>
                          <span style={{ color: '#15803D', fontSize: '0.82rem' }}>
                            Fórmula científica: 35 ml para cada kg de peso corporal ({waterRec.formula})
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        style={{ borderRadius: '20px', padding: '0.35rem 0.9rem', fontSize: '0.82rem', fontWeight: 700 }}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, litros_agua: waterRec.litros }));
                          alert(`Quantidade de água definida para ${waterRec.litros} L/dia!`);
                        }}
                      >
                        ⚡ Definir {waterRec.litros} L na Rotina
                      </button>
                    </div>
                  )}

                  {/* Objetivos */}
                  <div className="form-group">
                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                      Objetivo Principal
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
                      {PRESET_OBJETIVOS.map((item) => {
                        const isChecked = formData.objetivos?.includes(item);
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleCheckboxItem('objetivos', item)}
                            className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ borderRadius: '20px' }}
                          >
                            {isChecked ? '✓ ' : '+ '} {item}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      name="objetivo_texto"
                      className="form-control"
                      value={formData.objetivo_texto}
                      onChange={handleChange}
                      placeholder="Outro objetivo ou detalhe livre..."
                    />
                  </div>

                  {/* Nível de Atividade Física */}
                  <div className="form-group">
                    <label htmlFor="nivel_atividade" style={{ fontWeight: 700 }}>
                      Nível de Atividade Física
                    </label>
                    <select
                      id="nivel_atividade"
                      name="nivel_atividade"
                      className="form-control"
                      value={formData.nivel_atividade}
                      onChange={handleChange}
                    >
                      <option value="Sedentário">Sedentário</option>
                      <option value="Levemente ativo">Levemente ativo</option>
                      <option value="Moderadamente ativo">Moderadamente ativo</option>
                      <option value="Muito ativo">Muito ativo</option>
                      <option value="Extremamente ativo">Extremamente ativo</option>
                    </select>
                  </div>

                  {/* Patologias */}
                  <div className="form-group">
                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                      Patologias ou Condições de Saúde
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => toggleCheckboxItem('patologias', 'Nenhum')}
                        className={`btn btn-sm ${
                          formData.patologias?.includes('Nenhum') ? 'btn-primary' : 'btn-secondary'
                        }`}
                        style={{ borderRadius: '20px' }}
                      >
                        {formData.patologias?.includes('Nenhum') ? '✓ ' : '+ '} Nenhum
                      </button>
                      {PRESET_PATOLOGIAS.map((item) => {
                        const isChecked = formData.patologias?.includes(item);
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleCheckboxItem('patologias', item)}
                            className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ borderRadius: '20px' }}
                          >
                            {isChecked ? '✓ ' : '+ '} {item}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      name="patologia_custom"
                      className="form-control"
                      value={formData.patologia_custom}
                      onChange={handleChange}
                      placeholder="Adicionar outra patologia ou condição livremente..."
                    />
                  </div>

                  {/* Restrições Alimentares */}
                  <div className="form-group">
                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                      Restrições Alimentares
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => toggleCheckboxItem('restricoes_alimentares', 'Nenhum')}
                        className={`btn btn-sm ${
                          formData.restricoes_alimentares?.includes('Nenhum') ? 'btn-primary' : 'btn-secondary'
                        }`}
                        style={{ borderRadius: '20px' }}
                      >
                        {formData.restricoes_alimentares?.includes('Nenhum') ? '✓ ' : '+ '} Nenhum
                      </button>
                      {PRESET_RESTRICOES.map((item) => {
                        const isChecked = formData.restricoes_alimentares?.includes(item);
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleCheckboxItem('restricoes_alimentares', item)}
                            className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ borderRadius: '20px' }}
                          >
                            {isChecked ? '✓ ' : '+ '} {item}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      name="restricao_custom"
                      className="form-control"
                      value={formData.restricao_custom}
                      onChange={handleChange}
                      placeholder="Adicionar outra restrição alimentar livremente..."
                    />
                  </div>

                  {/* Alergias Alimentares */}
                  <div className="form-group">
                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                      Alergias Alimentares
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => toggleCheckboxItem('alergias', 'Nenhum')}
                        className={`btn btn-sm ${
                          formData.alergias?.includes('Nenhum') ? 'btn-primary' : 'btn-secondary'
                        }`}
                        style={{ borderRadius: '20px' }}
                      >
                        {formData.alergias?.includes('Nenhum') ? '✓ ' : '+ '} Nenhum
                      </button>
                      {PRESET_ALERGIAS.map((item) => {
                        const isChecked = formData.alergias?.includes(item);
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleCheckboxItem('alergias', item)}
                            className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ borderRadius: '20px' }}
                          >
                            {isChecked ? '✓ ' : '+ '} {item}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      name="alergia_custom"
                      className="form-control"
                      value={formData.alergia_custom}
                      onChange={handleChange}
                      placeholder="Adicionar outra alergia livremente..."
                    />
                  </div>

                  {/* Medicamentos e Suplementos */}
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="medicamentos">Medicamentos Contínuos</label>
                      <textarea
                        id="medicamentos"
                        name="medicamentos"
                        className="form-control"
                        value={formData.medicamentos}
                        onChange={handleChange}
                        placeholder="Ex: Metformina 500mg, Levotiroxina 50mcg..."
                        rows={3}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="suplementos">Suplementos em Uso</label>
                      <textarea
                        id="suplementos"
                        name="suplementos"
                        className="form-control"
                        value={formData.suplementos}
                        onChange={handleChange}
                        placeholder="Ex: Creatina 5g, Whey Protein, Vitamina D3..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3 — HÁBITOS */}
              {dataTab === 'habitos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="refeicoes_por_dia">Quantas refeições faz por dia</label>
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
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <label htmlFor="litros_agua" style={{ margin: 0, fontWeight: 700 }}>
                          Quantidade de Água por Dia
                        </label>
                        {waterRec && (
                          <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                            💧 Calculado: {waterRec.litros} L ({waterRec.ml.toLocaleString('pt-BR')} ml)
                          </span>
                        )}
                      </div>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="number"
                          step="0.05"
                          id="litros_agua"
                          name="litros_agua"
                          className="form-control"
                          value={formData.litros_agua}
                          onChange={handleChange}
                          placeholder="Ex: 2.45"
                          style={{ paddingRight: '3.5rem' }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '0.85rem',
                            color: 'var(--text-muted)',
                            fontWeight: 700,
                            pointerEvents: 'none',
                          }}
                        >
                          litros
                        </span>
                      </div>

                      {waterRec && (
                        <div
                          style={{
                            marginTop: '0.6rem',
                            backgroundColor: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.65rem 0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>💧</span>
                            <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                              <strong>Cálculo Diário (35 ml/kg):</strong> {formData.peso_inicial} kg × 35 ml ={' '}
                              <strong>
                                {waterRec.ml.toLocaleString('pt-BR')} ml ({waterRec.litros} L)
                              </strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            style={{ borderRadius: '15px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}
                            onClick={() => setFormData((prev) => ({ ...prev, litros_agua: waterRec.litros }))}
                          >
                            ⚡ Aplicar {waterRec.litros} L
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="horario_acorda">Horário que Acorda</label>
                      <input
                        type="text"
                        id="horario_acorda"
                        name="horario_acorda"
                        className="form-control"
                        value={formData.horario_acorda}
                        onChange={handleChange}
                        onBlur={() => handleTimeBlur('horario_acorda')}
                        placeholder="Ex: 6 → 06:00 ou 630 → 06:30"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="horario_dorme">Horário que Dorme</label>
                      <input
                        type="text"
                        id="horario_dorme"
                        name="horario_dorme"
                        className="form-control"
                        value={formData.horario_dorme}
                        onChange={handleChange}
                        onBlur={() => handleTimeBlur('horario_dorme')}
                        placeholder="Ex: 23 → 23:00 ou 2230 → 22:30"
                      />
                    </div>
                  </div>

                  {/* Pratica Atividade Física */}
                  <div
                    className="form-group"
                    style={{
                      backgroundColor: 'var(--surface-hover)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <label
                      style={{
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        marginBottom: formData.atividade_fisica ? '0.75rem' : 0,
                      }}
                    >
                      <input
                        type="checkbox"
                        name="atividade_fisica"
                        checked={formData.atividade_fisica}
                        onChange={handleChange}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                      />
                      <span>Pratica Atividade Física Regular</span>
                    </label>

                    {formData.atividade_fisica && (
                      <div>
                        <input
                          type="text"
                          name="atividade_fisica_descricao"
                          className="form-control"
                          value={formData.atividade_fisica_descricao}
                          onChange={handleChange}
                          placeholder="Qual atividade e frequência semanal? Ex: Musculação 5x na semana + Corrida"
                        />
                      </div>
                    )}
                  </div>

                  {/* Observações Gerais */}
                  <div className="form-group">
                    <label htmlFor="observacoes" style={{ fontWeight: 700 }}>
                      Observações Gerais
                    </label>
                    <textarea
                      id="observacoes"
                      name="observacoes"
                      className="form-control"
                      value={formData.observacoes}
                      onChange={handleChange}
                      placeholder="Informações adicionais, rotina familiar, histórico de dietas, preferências..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé da Seção de Edição */}
            <div
              className="panel-footer"
              style={{
                padding: '1.25rem 1.75rem',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--surface-hover)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {dataTab !== 'pessoal' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDataTab(dataTab === 'habitos' ? 'clinico' : 'pessoal')}
                  >
                    ← Aba Anterior
                  </button>
                )}
                {dataTab !== 'habitos' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDataTab(dataTab === 'pessoal' ? 'clinico' : 'habitos')}
                  >
                    Próxima Aba →
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ padding: '0.65rem 1.75rem', fontWeight: 800 }}
              >
                {saving ? 'Salvando...' : '💾 Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          SEÇÃO 2 — CONSULTAS & EVOLUÇÃO (Prompt 5)
          ==================================================================== */}
      {activeSection === 'consultas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Gráfico de Evolução de Peso sempre visível em destaque */}
          <WeightEvolutionChart consultations={patientConsultations} patient={patient} />

          {/* Lista de Consultas */}
          <div
            className="panel"
            style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="panel-header"
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.3rem' }}>📅</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Histórico de Consultas
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {patientConsultations.length} {patientConsultations.length === 1 ? 'consulta registrada' : 'consultas registradas'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onOpenNewConsultation(patient.id)}
              >
                ➕ Nova Consulta
              </button>
            </div>

            <div className="panel-body" style={{ padding: 0 }}>
              {patientConsultations.length === 0 ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem', opacity: 0.7 }}>
                    📅
                  </span>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>
                    Nenhuma consulta registrada ainda
                  </p>
                  <p style={{ margin: '0.35rem 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Clique no botão abaixo para agendar ou registrar a primeira consulta deste paciente.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onOpenNewConsultation(patient.id)}
                  >
                    ➕ Registrar Primeira Consulta
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Peso</th>
                        <th>Cintura</th>
                        <th>Quadril</th>
                        <th>% Gordura</th>
                        <th>Observações / Evolução</th>
                        <th>Próximo Retorno</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientConsultations.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                            📅 {c.data_consulta ? new Date(c.data_consulta).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--primary-dark)', whiteSpace: 'nowrap' }}>
                            {c.peso ? `${c.peso} kg` : '—'}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{c.cintura ? `${c.cintura} cm` : '—'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{c.quadril ? `${c.quadril} cm` : '—'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {c.percentual_gordura ? `${c.percentual_gordura}%` : '—'}
                          </td>
                          <td style={{ maxWidth: '280px', fontSize: '0.85rem' }}>
                            {c.observacoes ? (
                              <span title={c.observacoes}>
                                {c.observacoes.length > 80 ? `${c.observacoes.substring(0, 80)}...` : c.observacoes}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {c.proximo_retorno ? (
                              <span className="badge badge-info">
                                🔔 {new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm btn-icon"
                                onClick={() => onEditConsultation(c)}
                                title="Editar consulta"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger-subtle btn-sm btn-icon"
                                onClick={() => onDeleteConsultation(c.id)}
                                title="Excluir consulta"
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
        </div>
      )}

      {/* ====================================================================
          SEÇÃO 3 — PLANOS ALIMENTARES (Prompt 5)
          ==================================================================== */}
      {activeSection === 'planos' && (
        <div
          className="panel"
          style={{
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="panel-header"
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🥗</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Planos Alimentares
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Histórico de dietas e planos nutricionais do paciente
                </span>
              </div>
            </div>

            {/* Botão Gerar Plano Alimentar com IA em destaque (Prompt 6) */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onOpenNewMealPlan(patient.id)}
              style={{
                background: 'linear-gradient(135deg, #15803D 0%, #047857 50%, #065F46 100%)',
                boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
                fontWeight: 800,
                padding: '0.65rem 1.35rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <span>✨</span> Gerar Plano com IA
            </button>
          </div>

          <div className="panel-body" style={{ padding: '1.5rem' }}>
            {patientMealPlans.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem', opacity: 0.7 }}>
                  ✨🥗
                </span>
                <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 700 }}>
                  Nenhum plano alimentar gerado ainda
                </h4>
                <p style={{ margin: '0.35rem 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Clique no botão abaixo para prescrever e gerar o plano alimentar semanal personalizado com IA.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onOpenNewMealPlan(patient.id)}
                  style={{
                    background: 'linear-gradient(135deg, #15803D 0%, #047857 100%)',
                    fontWeight: 700,
                    padding: '0.55rem 1.2rem',
                  }}
                >
                  ✨ Gerar Primeiro Plano com IA
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {patientMealPlans.map((plano) => {
                  const conteudo = typeof plano.conteudo === 'string' ? JSON.parse(plano.conteudo) : plano.conteudo;
                  const isWeekly = Array.isArray(conteudo?.plano_semanal);
                  const isAI = conteudo?.gerado_com_ia || isWeekly;

                  return (
                    <div
                      key={plano.id}
                      className="card"
                      style={{
                        padding: '1.25rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--surface-hover)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                            {plano.titulo || 'Plano Alimentar'}
                          </h4>
                          <span className={`badge ${isAI ? 'badge-primary' : 'badge-neutral'}`} style={{ fontWeight: 700 }}>
                            {isAI ? '✨ Plano IA (7 dias)' : '🥗 Plano Padrão'}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                          📅 Gerado em: {new Date(plano.created_at || Date.now()).toLocaleDateString('pt-BR')}
                        </span>

                        {conteudo?.orientacoes_gerais && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
                            {conteudo.orientacoes_gerais.length > 100
                              ? `${conteudo.orientacoes_gerais.substring(0, 100)}...`
                              : conteudo.orientacoes_gerais}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => onViewMealPlan(plano)}
                          style={{ width: '100%', fontWeight: 700 }}
                        >
                          👁️ Ver & Baixar PDF
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
