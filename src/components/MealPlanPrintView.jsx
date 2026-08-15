import React from 'react';

export default function MealPlanPrintView({
  isOpen,
  onClose,
  plan,
  patient,
  nutritionist,
}) {
  if (!isOpen || !plan) return null;

  const conteudo = typeof plan.conteudo === 'string' ? JSON.parse(plan.conteudo) : plan.conteudo;
  const refeicoes = conteudo?.refeicoes || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay printable" onClick={onClose}>
      <div
        className="modal-content large print-page"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px', background: '#FFFFFF' }}
      >
        <div className="modal-header no-print">
          <h2 className="modal-title">
            <span>🖨️ Visualização para Impressão / PDF</span>
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              🖨️ Imprimir / Salvar PDF
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '2.5rem', background: '#FFFFFF' }}>
          {/* Cabeçalho do Documento */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid #15803D',
              paddingBottom: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src="/logo.png"
                alt="Richieri Nutrição"
                style={{ height: '55px', width: 'auto', objectFit: 'contain' }}
              />
              <div>
                <h1 style={{ fontSize: '1.5rem', color: '#15803D', margin: 0 }}>
                  Richieri Nutrição
                </h1>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                  Nutrição Clínica & Esportiva de Alta Performance
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#334155' }}>
              <strong>{nutritionist?.nome || 'Nutricionista Responsável'}</strong>
              <br />
              <span>{nutritionist?.crn || 'CRN-3 12345/P'}</span>
              <br />
              <span>{nutritionist?.telefone || '(11) 99999-8888'}</span>
            </div>
          </div>

          {/* Dados do Paciente e do Plano */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              marginBottom: '2rem',
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: '1rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: '700' }}>
                Paciente
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A' }}>
                {patient?.nome || 'Paciente'}
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Plano: {plan.titulo || 'Plano Alimentar Individualizado'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: '700' }}>
                Data de Emissão
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0F172A' }}>
                {new Date(plan.created_at || Date.now()).toLocaleDateString('pt-BR')}
              </div>
              {conteudo?.calorias && (
                <span style={{ fontSize: '0.85rem', color: '#15803D', fontWeight: '600' }}>
                  Meta: {conteudo.calorias} kcal
                </span>
              )}
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: '700' }}>
                Meta de Hidratação
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0284C7' }}>
                💧 {conteudo?.agua || '2.5'} Litros/dia
              </div>
            </div>
          </div>

          {/* Refeições */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {refeicoes.map((ref, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  breakInside: 'avoid',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#F1F5F9',
                    padding: '0.75rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #E2E8F0',
                  }}
                >
                  <strong style={{ fontSize: '1rem', color: '#15803D' }}>
                    {ref.nome}
                  </strong>
                  {ref.horario && (
                    <span
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: '#334155',
                      }}
                    >
                      ⏰ {ref.horario}
                    </span>
                  )}
                </div>

                <div style={{ padding: '1rem 1.25rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.4rem 0.5rem' }}>Alimento</th>
                        <th style={{ padding: '0.4rem 0.5rem' }}>Porção</th>
                        <th style={{ padding: '0.4rem 0.5rem' }}>Opções de Substituição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ref.alimentos || []).map((alimento, fIdx) => (
                        <tr key={fIdx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                          <td style={{ padding: '0.55rem 0.5rem', fontWeight: '600', color: '#0F172A' }}>
                            • {alimento.nome}
                          </td>
                          <td style={{ padding: '0.55rem 0.5rem', color: '#334155' }}>
                            {alimento.quantidade}
                          </td>
                          <td style={{ padding: '0.55rem 0.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                            {alimento.substituicao || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {ref.orientacoes && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#FEFCE8',
                        borderLeft: '3px solid #EAB308',
                        fontSize: '0.8rem',
                        color: '#713F12',
                        borderRadius: '0 4px 4px 0',
                      }}
                    >
                      💡 <strong>Dica:</strong> {ref.orientacoes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Orientações Gerais */}
          {conteudo?.orientacoes_gerais && (
            <div
              style={{
                marginTop: '2rem',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '1.25rem',
                backgroundColor: '#F8FAFC',
                breakInside: 'avoid',
              }}
            >
              <h3 style={{ fontSize: '1rem', color: '#15803D', marginBottom: '0.5rem' }}>
                📌 Orientações Gerais da Nutricionista
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.6', margin: 0 }}>
                {conteudo.orientacoes_gerais}
              </p>
            </div>
          )}

          {/* Rodapé de Assinatura */}
          <div
            style={{
              marginTop: '3.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              fontSize: '0.8rem',
              color: '#64748B',
              breakInside: 'avoid',
            }}
          >
            <div>
              <span>Emitido digitalmente pelo Sistema Richieri Nutrição</span>
            </div>
            <div style={{ textAlign: 'center', width: '240px', borderTop: '1px solid #94A3B8', paddingTop: '0.5rem' }}>
              <strong>{nutritionist?.nome || 'Nutricionista Responsável'}</strong>
              <br />
              <span>{nutritionist?.crn || 'CRN-3 12345/P'}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Imprimir / Salvar em PDF
          </button>
        </div>
      </div>
    </div>
  );
}
