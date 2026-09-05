import React, { useState } from 'react';

const REFEICOES_LABELS = {
  cafe_da_manha: { label: '☕ Café da Manhã', color: '#B45309' },
  lanche_manha: { label: '🍎 Lanche da Manhã', color: '#15803D' },
  almoco: { label: '🍲 Almoço', color: '#047857' },
  lanche_tarde: { label: '🥪 Lanche da Tarde', color: '#0284C7' },
  jantar: { label: '🥗 Jantar', color: '#4338CA' },
};

export default function MealPlanPrintView({
  isOpen,
  onClose,
  plan,
  patient,
  nutritionist,
}) {
  const [selectedDayTab, setSelectedDayTab] = useState('todos'); // 'todos' | dia

  if (!isOpen || !plan) return null;

  const conteudo = typeof plan.conteudo === 'string' ? JSON.parse(plan.conteudo) : plan.conteudo;
  const planoSemanal = Array.isArray(conteudo?.plano_semanal) ? conteudo.plano_semanal : null;
  const refeicoesLegadas = Array.isArray(conteudo?.refeicoes) ? conteudo.refeicoes : [];

  const handlePrint = () => {
    window.print();
  };

  const daysToRender = planoSemanal
    ? selectedDayTab === 'todos'
      ? planoSemanal
      : planoSemanal.filter((d) => d.dia === selectedDayTab)
    : [];

  return (
    <div className="modal-overlay printable" onClick={onClose}>
      <div
        className="modal-content large print-page"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '960px', width: '95vw', background: '#FFFFFF', maxHeight: '94vh', overflowY: 'auto' }}
      >
        <div className="modal-header no-print" style={{ borderBottom: '1px solid #E2E8F0', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🖨️</span>
            <div>
              <h2 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                Visualização & Impressão do Plano Alimentar
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Formato profissional formatado para PDF / Impressão
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint} style={{ fontWeight: 700 }}>
              🖨️ Imprimir / Salvar PDF
            </button>
            <button className="modal-close-btn" onClick={onClose} style={{ fontSize: '1.4rem' }}>
              &times;
            </button>
          </div>
        </div>

        {/* Filtro de Abas em tela para planos semanais */}
        {planoSemanal && (
          <div
            className="no-print"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginRight: '0.35rem' }}>
              Exibir na tela:
            </span>
            <button
              type="button"
              onClick={() => setSelectedDayTab('todos')}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '6px',
                border: selectedDayTab === 'todos' ? '2px solid #15803D' : '1px solid #CBD5E1',
                backgroundColor: selectedDayTab === 'todos' ? '#15803D' : '#FFFFFF',
                color: selectedDayTab === 'todos' ? '#FFFFFF' : '#334155',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              📅 Todos os Dias (Semana Completa)
            </button>
            {planoSemanal.map((d) => (
              <button
                key={d.dia}
                type="button"
                onClick={() => setSelectedDayTab(d.dia)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: selectedDayTab === d.dia ? '2px solid #15803D' : '1px solid #CBD5E1',
                  backgroundColor: selectedDayTab === d.dia ? '#15803D' : '#FFFFFF',
                  color: selectedDayTab === d.dia ? '#FFFFFF' : '#334155',
                  fontWeight: selectedDayTab === d.dia ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.dia}
              </button>
            ))}
          </div>
        )}

        <div className="modal-body" style={{ padding: '2rem 2.5rem', background: '#FFFFFF' }}>
          {/* Cabeçalho do Documento */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2.5px solid #15803D',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src="/logo.png"
                alt="Richieri Nutrição"
                style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
              />
              <div>
                <h1 style={{ fontSize: '1.45rem', color: '#15803D', margin: 0, fontWeight: 800 }}>
                  Richieri Nutrição
                </h1>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                  Nutrição Clínica & Esportiva de Alta Performance
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#334155' }}>
              <strong style={{ fontSize: '0.95rem' }}>{nutritionist?.nome || 'Dra. Gabriela Richieri'}</strong>
              <br />
              <span style={{ color: '#64748B' }}>{nutritionist?.crn || 'CRN-3 48.912'}</span>
              <br />
              <span style={{ color: '#64748B' }}>{nutritionist?.telefone || '(11) 98765-4321'}</span>
            </div>
          </div>

          {/* Dados do Paciente e Metas */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              marginBottom: '1.75rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', letterSpacing: '0.5px' }}>
                Paciente
              </span>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', marginTop: '0.15rem' }}>
                {patient?.nome || 'Paciente'}
              </div>
              <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                {plan.titulo || 'Plano Alimentar Individualizado'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', letterSpacing: '0.5px' }}>
                Data de Emissão
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A', marginTop: '0.15rem' }}>
                📅 {new Date(plan.created_at || Date.now()).toLocaleDateString('pt-BR')}
              </div>
              {conteudo?.gerado_com_ia && (
                <span style={{ fontSize: '0.78rem', color: '#15803D', fontWeight: '700' }}>
                  ✨ Elaborado com IA Nutricional
                </span>
              )}
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', letterSpacing: '0.5px' }}>
                Metas do Plano
              </span>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#15803D', marginTop: '0.15rem' }}>
                🔥 {conteudo?.calorias || '1800'} kcal/dia
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0284C7' }}>
                💧 {conteudo?.agua || '2.5'} L de água/dia
              </div>
            </div>
          </div>

          {/* RENDERIZAÇÃO DO PLANO SEMANAL (7 DIAS) */}
          {planoSemanal && daysToRender.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {daysToRender.map((diaObj, dIdx) => (
                <div
                  key={diaObj.dia || dIdx}
                  style={{
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                    marginBottom: '1.25rem',
                  }}
                >
                  {/* Cabeçalho do Dia */}
                  <div
                    style={{
                      backgroundColor: '#15803D',
                      color: '#FFFFFF',
                      padding: '0.75rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <strong style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                      🗓️ {diaObj.dia}
                    </strong>
                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                      Cardápio Balanceado
                    </span>
                  </div>

                  {/* Refeições do Dia */}
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Object.entries(diaObj.refeicoes || {}).map(([refKey, opcoes]) => {
                      const refInfo = REFEICOES_LABELS[refKey] || { label: refKey, color: '#334155' };
                      const opcoesList = Array.isArray(opcoes) ? opcoes : [];

                      return (
                        <div
                          key={refKey}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            paddingBottom: '0.75rem',
                          }}
                        >
                          <div style={{ marginBottom: '0.4rem' }}>
                            <strong style={{ fontSize: '0.92rem', color: refInfo.color, fontWeight: 800 }}>
                              {refInfo.label}
                            </strong>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.4rem' }}>
                            {opcoesList.map((op, opIdx) => (
                              <div
                                key={opIdx}
                                style={{
                                  fontSize: '0.86rem',
                                  color: '#1E293B',
                                  backgroundColor: '#F8FAFC',
                                  padding: '0.45rem 0.65rem',
                                  borderRadius: '5px',
                                  borderLeft: `3px solid ${refInfo.color}`,
                                }}
                              >
                                <span style={{ fontWeight: 700, color: '#64748B', fontSize: '0.78rem', marginRight: '0.35rem' }}>
                                  Opção {opIdx + 1}:
                                </span>
                                {op}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RENDERIZAÇÃO DO PLANO LEGADO (caso exista) */}
          {!planoSemanal && refeicoesLegadas.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {refeicoesLegadas.map((ref, idx) => (
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
          )}

          {/* Orientações Gerais */}
          {conteudo?.orientacoes_gerais && (
            <div
              style={{
                marginTop: '1.75rem',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '1.25rem',
                backgroundColor: '#F8FAFC',
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
              }}
            >
              <h3 style={{ fontSize: '0.98rem', color: '#15803D', margin: '0 0 0.5rem', fontWeight: 800 }}>
                📌 Orientações e Recomendações Nutricionais
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.6', margin: 0 }}>
                {conteudo.orientacoes_gerais}
              </p>
            </div>
          )}

          {/* Rodapé de Assinatura */}
          <div
            style={{
              marginTop: '3rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              fontSize: '0.8rem',
              color: '#64748B',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            }}
          >
            <div>
              <span>Emitido digitalmente via Sistema Richieri Nutrição</span>
            </div>
            <div style={{ textAlign: 'center', width: '250px', borderTop: '1px solid #94A3B8', paddingTop: '0.5rem' }}>
              <strong>{nutritionist?.nome || 'Dra. Gabriela Richieri'}</strong>
              <br />
              <span>{nutritionist?.crn || 'CRN-3 48.912'}</span>
            </div>
          </div>
        </div>

        <div
          className="modal-footer no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
          }}
        >
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          <button className="btn btn-primary" onClick={handlePrint} style={{ fontWeight: 800 }}>
            🖨️ Imprimir / Salvar em PDF
          </button>
        </div>
      </div>
    </div>
  );
}
