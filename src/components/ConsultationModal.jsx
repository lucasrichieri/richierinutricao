import React, { useState, useEffect } from 'react';

export default function ConsultationModal({
  isOpen,
  onClose,
  onSave,
  patients = [],
  initialPatientId = null,
  consultationToEdit = null,
}) {
  const [formData, setFormData] = useState({
    paciente_id: '',
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: '',
  });

  useEffect(() => {
    if (consultationToEdit) {
      setFormData({
        ...consultationToEdit,
        data_consulta: consultationToEdit.data_consulta
          ? new Date(consultationToEdit.data_consulta).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        proximo_retorno: consultationToEdit.proximo_retorno
          ? new Date(consultationToEdit.proximo_retorno).toISOString().split('T')[0]
          : '',
      });
    } else {
      setFormData({
        paciente_id: initialPatientId || (patients[0] ? patients[0].id : ''),
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: '',
      });
    }
  }, [consultationToEdit, initialPatientId, patients, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.paciente_id) {
      alert('Selecione um paciente.');
      return;
    }
    if (!formData.data_consulta) {
      alert('Informe a data da consulta.');
      return;
    }
    onSave(formData);
  };

  const selectedPatient = patients.find((p) => p.id === formData.paciente_id);

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <span>{consultationToEdit ? '✏️ Editar Consulta' : '📅 Registrar Consulta & Retorno'}</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="paciente_id">Paciente *</label>
                <select
                  id="paciente_id"
                  name="paciente_id"
                  className="form-control"
                  value={formData.paciente_id}
                  onChange={handleChange}
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
                <label htmlFor="data_consulta">Data da Consulta *</label>
                <input
                  type="date"
                  id="data_consulta"
                  name="data_consulta"
                  className="form-control"
                  value={formData.data_consulta}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {selectedPatient && (
              <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <strong>Histórico do Paciente:</strong> Peso Inicial: {selectedPatient.peso_inicial ? `${selectedPatient.peso_inicial} kg` : '—'} • Altura: {selectedPatient.altura ? `${selectedPatient.altura} m` : '—'}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--primary-dark)' }}>
                📏 Medidas Antropométricas Atuais
              </h4>
              <div className="form-grid-4">
                <div className="form-group">
                  <label htmlFor="peso">Peso Atual (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    id="peso"
                    name="peso"
                    className="form-control"
                    value={formData.peso}
                    onChange={handleChange}
                    placeholder="Ex: 71.2"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cintura">Cintura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    id="cintura"
                    name="cintura"
                    className="form-control"
                    value={formData.cintura}
                    onChange={handleChange}
                    placeholder="Ex: 82"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="quadril">Quadril (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    id="quadril"
                    name="quadril"
                    className="form-control"
                    value={formData.quadril}
                    onChange={handleChange}
                    placeholder="Ex: 102"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="percentual_gordura">% Gordura</label>
                  <input
                    type="number"
                    step="0.1"
                    id="percentual_gordura"
                    name="percentual_gordura"
                    className="form-control"
                    value={formData.percentual_gordura}
                    onChange={handleChange}
                    placeholder="Ex: 21.5"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="proximo_retorno">Previsão do Próximo Retorno</label>
              <input
                type="date"
                id="proximo_retorno"
                name="proximo_retorno"
                className="form-control"
                value={formData.proximo_retorno}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="observacoes">Evolução Clínica & Condutas da Consulta</label>
              <textarea
                id="observacoes"
                name="observacoes"
                className="form-control"
                value={formData.observacoes}
                onChange={handleChange}
                placeholder="Adesão à dieta anterior, sintomas relatados, ajustes de calorias, metas para a próxima consulta..."
                rows={4}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              💾 Salvar Consulta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
