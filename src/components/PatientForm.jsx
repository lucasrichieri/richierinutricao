import React, { useState, useEffect } from 'react';

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

export default function PatientForm({ onSave, onCancel, patientToEdit = null }) {
  const [activeTab, setActiveTab] = useState('pessoal');

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

  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        nome: patientToEdit.nome || '',
        data_nascimento: patientToEdit.data_nascimento
          ? typeof patientToEdit.data_nascimento === 'string'
            ? patientToEdit.data_nascimento.substring(0, 10)
            : patientToEdit.data_nascimento
          : '',
        sexo: patientToEdit.sexo || 'Feminino',
        telefone: patientToEdit.telefone || '',
        whatsapp: patientToEdit.whatsapp || '',
        email: patientToEdit.email || '',
        peso_inicial: patientToEdit.peso_inicial != null ? String(patientToEdit.peso_inicial) : '',
        altura: patientToEdit.altura != null ? String(patientToEdit.altura) : '',
        objetivos: Array.isArray(patientToEdit.objetivos) ? patientToEdit.objetivos : [],
        objetivo_texto: patientToEdit.objetivo_texto || '',
        nivel_atividade: patientToEdit.nivel_atividade || 'Moderadamente ativo',
        patologias: Array.isArray(patientToEdit.patologias) ? patientToEdit.patologias : [],
        patologia_custom: '',
        restricoes_alimentares: Array.isArray(patientToEdit.restricoes_alimentares) ? patientToEdit.restricoes_alimentares : [],
        restricao_custom: '',
        alergias: Array.isArray(patientToEdit.alergias) ? patientToEdit.alergias : [],
        alergia_custom: '',
        medicamentos: patientToEdit.medicamentos || '',
        suplementos: patientToEdit.suplementos || '',
        refeicoes_por_dia: patientToEdit.refeicoes_por_dia || 4,
        horario_acorda: patientToEdit.horario_acorda || '06:00',
        horario_dorme: patientToEdit.horario_dorme || '22:30',
        litros_agua: patientToEdit.litros_agua != null ? patientToEdit.litros_agua : 2,
        atividade_fisica: Boolean(patientToEdit.atividade_fisica),
        atividade_fisica_descricao: patientToEdit.atividade_fisica_descricao || '',
        observacoes: patientToEdit.observacoes || '',
      });
      setActiveTab('pessoal');
    } else {
      setFormData({
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
      setActiveTab('pessoal');
    }
  }, [patientToEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    // Formatações automáticas de telefone/whatsapp
    if (name === 'telefone' || name === 'whatsapp') {
      const num = value.replace(/\D/g, '');
      if (num.length <= 10) {
        newValue = num.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
      } else {
        newValue = num.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
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
        // Se selecionar "Nenhum", limpa os outros
        const exists = current.includes('Nenhum');
        return { ...prev, [fieldName]: exists ? [] : ['Nenhum'] };
      }

      // Se selecionar um item normal, remove "Nenhum" caso exista
      const withoutNenhum = current.filter((i) => i !== 'Nenhum');
      const exists = withoutNenhum.includes(item);
      const updated = exists
        ? withoutNenhum.filter((i) => i !== item)
        : [...withoutNenhum, item];

      return { ...prev, [fieldName]: updated };
    });
  };

  // Cálculo automático da Idade
  const calculateAge = (dob) => {
    if (!dob) return '';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} anos` : '';
  };

  // Cálculo automático do IMC
  const calculateIMC = () => {
    const p = parseFloat(formData.peso_inicial);
    const a = parseFloat(formData.altura);
    if (!p || !a || a <= 0) return '';

    const alturaMetros = a > 3 ? a / 100 : a;
    const imc = p / (alturaMetros * alturaMetros);
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nome || !formData.nome.trim()) {
      alert('Por favor, informe o nome completo do paciente.');
      return;
    }

    // Processa os campos adicionais customizados
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

    onSave(payload);
  };

  const ageText = calculateAge(formData.data_nascimento);
  const imcText = calculateIMC();
  const waterRec = calculateWater();

  return (
    <div className="panel" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
      {/* Cabeçalho do Formulário */}
      <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.4rem' }}>👤</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              {patientToEdit ? 'Editar Cadastro de Paciente' : 'Formulário de Cadastro de Paciente'}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Preencha os dados nas 3 abas abaixo. Apenas o nome é obrigatório.
            </span>
          </div>
        </div>
        {onCancel && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
            ← Voltar para Lista
          </button>
        )}
      </div>

      {/* Abas do Formulário (Prompt 4: Pessoal, Clínico, Hábitos) */}
      <div className="modal-tabs" style={{ backgroundColor: 'var(--surface-muted)', borderBottom: '1px solid var(--border-light)', padding: '0 1.5rem' }}>
        <button
          type="button"
          className={`modal-tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
          onClick={() => setActiveTab('pessoal')}
        >
          1. Pessoal
        </button>
        <button
          type="button"
          className={`modal-tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
          onClick={() => setActiveTab('clinico')}
        >
          2. Clínico
        </button>
        <button
          type="button"
          className={`modal-tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
          onClick={() => setActiveTab('habitos')}
        >
          3. Hábitos
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ padding: '1.75rem' }}>
          {/* ====================================================================
             ABA 1 — PESSOAL
             ==================================================================== */}
          {activeTab === 'pessoal' && (
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
                  placeholder="Ex: Maria Eduarda da Silva"
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
                      <span className="badge badge-info" style={{ whiteSpace: 'nowrap', fontWeight: 700, padding: '0.4rem 0.6rem' }}>
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

          {/* ====================================================================
             ABA 2 — CLÍNICO
             ==================================================================== */}
          {activeTab === 'clinico' && (
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
                    <span style={{ position: 'absolute', right: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, pointerEvents: 'none' }}>
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
                    <span style={{ position: 'absolute', right: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, pointerEvents: 'none' }}>
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
                    style={{ backgroundColor: 'var(--surface-muted)', fontWeight: 700, color: imcText ? 'var(--primary-dark)' : 'var(--text-muted)' }}
                  />
                </div>
              </div>

              {/* Card de Cálculo de Água (35 ml/kg) */}
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

              {/* Patologias ou condições de saúde */}
              <div className="form-group">
                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  Patologias ou Condições de Saúde
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => toggleCheckboxItem('patologias', 'Nenhum')}
                    className={`btn btn-sm ${formData.patologias?.includes('Nenhum') ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '20px' }}
                  >
                    {formData.patologias?.includes('Nenhum') ? '✓ ' : ''} Nenhum
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
                  placeholder="Adicionar patologia livremente..."
                />
              </div>

              {/* Restrições alimentares */}
              <div className="form-group">
                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  Restrições Alimentares
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => toggleCheckboxItem('restricoes_alimentares', 'Nenhum')}
                    className={`btn btn-sm ${formData.restricoes_alimentares?.includes('Nenhum') ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '20px' }}
                  >
                    {formData.restricoes_alimentares?.includes('Nenhum') ? '✓ ' : ''} Nenhum
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
                  placeholder="Adicionar restrição livremente..."
                />
              </div>

              {/* Alergias alimentares */}
              <div className="form-group">
                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  Alergias Alimentares
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => toggleCheckboxItem('alergias', 'Nenhum')}
                    className={`btn btn-sm ${formData.alergias?.includes('Nenhum') ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '20px' }}
                  >
                    {formData.alergias?.includes('Nenhum') ? '✓ ' : ''} Nenhum
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
                  placeholder="Adicionar alergia livremente..."
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="medicamentos">Medicamentos Contínuos</label>
                  <textarea
                    id="medicamentos"
                    name="medicamentos"
                    className="form-control"
                    rows={2}
                    value={formData.medicamentos}
                    onChange={handleChange}
                    placeholder="Descreva se faz uso continuado de algum remédio..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="suplementos">Suplementos em Uso</label>
                  <textarea
                    id="suplementos"
                    name="suplementos"
                    className="form-control"
                    rows={2}
                    value={formData.suplementos}
                    onChange={handleChange}
                    placeholder="Ex: Whey protein, Creatina, Ômega 3..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================
             ABA 3 — HÁBITOS
             ==================================================================== */}
          {activeTab === 'habitos' && (
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
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
                    <span style={{ position: 'absolute', right: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, pointerEvents: 'none' }}>
                      litros
                    </span>
                  </div>

                  {waterRec ? (
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
                          <strong>Cálculo Diário (35 ml/kg):</strong> {formData.peso_inicial} kg × 35 ml = <strong>{waterRec.ml.toLocaleString('pt-BR')} ml ({waterRec.litros} L)</strong>
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
                  ) : (
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                      💡 Dica: Preencha o peso na Aba Clínico para calcular a meta recomendada de 35 ml/kg automaticamente.
                    </small>
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
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Digites números simples (ex: 6 para 06:00, 630 para 06:30).
                  </small>
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
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Digites números simples (ex: 23 para 23:00, 2230 para 22:30).
                  </small>
                </div>
              </div>

              {/* Pratica Atividade Física */}
              <div className="form-group" style={{ backgroundColor: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <label style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: formData.atividade_fisica ? '0.75rem' : 0 }}>
                  <input
                    type="checkbox"
                    name="atividade_fisica"
                    checked={formData.atividade_fisica}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  <span>Pratica Atividade Física Atualmente?</span>
                </label>

                {formData.atividade_fisica && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label htmlFor="atividade_fisica_descricao" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      Qual atividade e frequência semanal?
                    </label>
                    <input
                      type="text"
                      id="atividade_fisica_descricao"
                      name="atividade_fisica_descricao"
                      className="form-control"
                      value={formData.atividade_fisica_descricao}
                      onChange={handleChange}
                      placeholder="Ex: Musculação 4x na semana e corrida aos sábados"
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="observacoes">Observações Gerais</label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  className="form-control"
                  rows={3}
                  value={formData.observacoes}
                  onChange={handleChange}
                  placeholder="Anotações adicionais, histórico familiar, preferências alimentares..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Ações de Navegação e Salvar */}
        <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--surface-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {activeTab !== 'pessoal' && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab(activeTab === 'habitos' ? 'clinico' : 'pessoal')}
              >
                ← Aba Anterior
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {activeTab !== 'habitos' ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab(activeTab === 'pessoal' ? 'clinico' : 'habitos')}
              >
                Próxima Aba →
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontWeight: 800 }}>
                {patientToEdit ? '💾 Salvar Alterações' : '💾 Salvar Cadastro do Paciente'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
