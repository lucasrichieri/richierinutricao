import React, { useState, useEffect } from 'react';

export default function ProfileTab({
  nutritionist,
  onSaveProfile,
  onInitSchema,
  loading,
}) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    crn: '',
    telefone: '',
    especialidade: '',
  });

  useEffect(() => {
    if (nutritionist) {
      setFormData({
        nome: nutritionist.nome || '',
        email: nutritionist.email || '',
        crn: nutritionist.crn || 'CRN-3 12345/P',
        telefone: nutritionist.telefone || '(11) 99999-8888',
        especialidade: nutritionist.especialidade || 'Nutrição Clínica e Esportiva',
      });
    }
  }, [nutritionist]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile(formData);
  };

  return (
    <div>
      <div className="panel" style={{ maxWidth: '800px', margin: '0 auto 1.5rem' }}>
        <div className="panel-header">
          <div className="panel-title">
            <span>👩‍⚕️ Dados da Nutricionista</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="panel-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="nome">Nome Completo</label>
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

              <div className="form-group">
                <label htmlFor="email">E-mail (Login Neon Auth)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  disabled
                  style={{ opacity: 0.7, backgroundColor: '#F1F5F9' }}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="crn">Registro Profissional (CRN)</label>
                <input
                  type="text"
                  id="crn"
                  name="crn"
                  className="form-control"
                  value={formData.crn}
                  onChange={handleChange}
                  placeholder="Ex: CRN-3 12345/P"
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefone">Telefone / WhatsApp de Contato</label>
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  className="form-control"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="Ex: (11) 98765-4321"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="especialidade">Área de Especialidade</label>
              <input
                type="text"
                id="especialidade"
                name="especialidade"
                className="form-control"
                value={formData.especialidade}
                onChange={handleChange}
                placeholder="Ex: Nutrição Esportiva, Emagrecimento e Saúde da Mulher"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                💾 Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Painel do Banco Neon */}
      <div className="panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="panel-header">
          <div className="panel-title">
            <span>🐘 Status do Banco de Dados Neon</span>
          </div>
          <span className="badge badge-success">Neon PostgreSQL Ativo</span>
        </div>
        <div className="panel-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            O sistema Richieri Nutrição está configurado para salvar e sincronizar automaticamente pacientes, consultas e planos alimentares diretamente no PostgreSQL do Neon com suporte a Row Level Security (RLS).
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div>
              <strong style={{ fontSize: '0.9rem' }}>Verificação e Inicialização de Tabelas</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tabelas: <code>nutricionistas</code>, <code>pacientes</code>, <code>consultas</code>, <code>planos_alimentares</code>
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onInitSchema}
              disabled={loading}
            >
              🔄 Verificar Schema Neon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
