import React, { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';

const REFEICOES_ORDEM = ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'];

const REFEICOES_CONFIG = {
  cafe_da_manha: {
    label: '☕ Café da Manhã',
    badgeColor: '#B45309',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  lanche_manha: {
    label: '🍎 Lanche da Manhã',
    badgeColor: '#15803D',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  almoco: {
    label: '🍲 Almoço',
    badgeColor: '#047857',
    bgColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  lanche_tarde: {
    label: '🥪 Lanche da Tarde',
    badgeColor: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  jantar: {
    label: '🥗 Jantar',
    badgeColor: '#4338CA',
    bgColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
};

export default function MealPlanPrintView({
  isOpen,
  onClose,
  plan,
  patient,
  nutritionist,
}) {
  const [selectedDayTab, setSelectedDayTab] = useState('todos'); // 'todos' | dia
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const printDocumentRef = useRef(null);

  if (!isOpen || !plan) return null;

  const conteudo = typeof plan.conteudo === 'string' ? JSON.parse(plan.conteudo) : (plan.conteudo || {});
  const planoSemanal = Array.isArray(conteudo?.plano_semanal) ? conteudo.plano_semanal : null;
  const refeicoesLegadas = Array.isArray(conteudo?.refeicoes) ? conteudo.refeicoes : [];

  // Impressão nativa do navegador
  const handlePrint = () => {
    window.print();
  };

  // Download do arquivo PDF limpo e formatado no computador
  const handleDownloadPDF = async () => {
    const element = printDocumentRef.current;
    if (!element) return;

    setIsDownloadingPdf(true);
    try {
      const patientName = (patient?.nome || 'Paciente')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const filename = `Plano_Alimentar_${patientName}.pdf`;

      // Clona o documento para garantir renderização limpa sem interferência de scroll ou modal
      const opt = {
        margin: [8, 8, 8, 8],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: ['.pdf-avoid-break'],
        },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Erro ao gerar arquivo PDF:', err);
      alert('Ocorreu um erro ao baixar o PDF. Você também pode clicar em "Imprimir" e selecionar "Salvar como PDF".');
    } finally {
      setIsDownloadingPdf(false);
    }
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
        style={{
          maxWidth: '960px',
          width: '95vw',
          background: '#FFFFFF',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header do Modal (Não impresso) */}
        <div
          className="modal-header no-print"
          style={{
            borderBottom: '1px solid #E2E8F0',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🥗</span>
            <div>
              <h2 className="modal-title" style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0F172A' }}>
                Plano Alimentar Semanal — Visualização & PDF
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Documento clínico formatado e harmonioso pronto para impressão ou download
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              style={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #15803D 0%, #047857 100%)',
                boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.15rem',
              }}
            >
              {isDownloadingPdf ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #FFF', borderTopColor: 'transparent' }}></span>
                  Gerando PDF...
                </>
              ) : (
                <>📥 Baixar Arquivo PDF</>
              )}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrint} style={{ fontWeight: 600 }}>
              🖨️ Imprimir
            </button>
            <button type="button" className="modal-close-btn" onClick={onClose} style={{ fontSize: '1.4rem' }}>
              &times;
            </button>
          </div>
        </div>

        {/* Barra de Filtro de Abas na Tela (Não impresso) */}
        {planoSemanal && (
          <div
            className="no-print"
            style={{
              padding: '0.65rem 1.5rem',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginRight: '0.35rem' }}>
              Visualizar na tela:
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
              📅 Todos os Dias (Completo)
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

        {/* Área de Visualização do Modal e de Renderização do PDF */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem 2.25rem',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div
            ref={printDocumentRef}
            id="meal-plan-printable-document"
            style={{
              width: '100%',
              maxWidth: '850px',
              margin: '0 auto',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {/* 1. CABEÇALHO DA CLÍNICA & NUTRICIONISTA */}
            <div
              className="pdf-avoid-break"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '2.5px solid #15803D',
                paddingBottom: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <img
                  src="/logo.png"
                  alt="Richieri Nutrição"
                  style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
                />
                <div>
                  <h1 style={{ fontSize: '1.35rem', color: '#15803D', margin: 0, fontWeight: 900, letterSpacing: '-0.3px' }}>
                    Richieri Nutrição
                  </h1>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>
                    Nutrição Clínica & Esportiva de Alta Performance
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#334155', lineHeight: '1.4' }}>
                <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>
                  {nutritionist?.nome || 'Dra. Gabriela Richieri'}
                </strong>
                <br />
                <span style={{ color: '#64748B' }}>{nutritionist?.crn || 'CRN-3 48.912'}</span>
                <br />
                <span style={{ color: '#64748B' }}>{nutritionist?.telefone || '(11) 98765-4321'}</span>
              </div>
            </div>

            {/* 2. DADOS DO PACIENTE & METAS CLÍNICAS */}
            <div
              className="pdf-avoid-break"
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.85rem 1.15rem',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: '1.8fr 1fr 1fr',
                gap: '0.85rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 800, letterSpacing: '0.5px' }}>
                  Paciente
                </span>
                <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0F172A', marginTop: '0.1rem' }}>
                  {patient?.nome || 'Paciente'}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginTop: '0.1rem' }}>
                  {plan.titulo || 'Plano Alimentar Semanal Personalizado'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 800, letterSpacing: '0.5px' }}>
                  Emissão & Metodologia
                </span>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginTop: '0.1rem' }}>
                  📅 {new Date(plan.created_at || Date.now()).toLocaleDateString('pt-BR')}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 700, display: 'block', marginTop: '0.1rem' }}>
                  ✨ Plano Semanal 100% Individualizado
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 800, letterSpacing: '0.5px' }}>
                  Metas Diárias
                </span>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803D', marginTop: '0.1rem' }}>
                  🔥 {conteudo?.calorias || '1800'} kcal/dia
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284C7' }}>
                  💧 {conteudo?.agua || '2.5'} L de água/dia
                </div>
              </div>
            </div>

            {/* 3. CARDÁPIOS DIÁRIOS ESTRUTURADOS E HARMONIOSOS (7 DIAS) */}
            {planoSemanal && daysToRender.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                {daysToRender.map((diaObj, dIdx) => (
                  <div
                    key={diaObj.dia || dIdx}
                    className="pdf-avoid-break"
                    style={{
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#FFFFFF',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                      marginBottom: '1rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* Faixa de Título do Dia */}
                    <div
                      style={{
                        backgroundColor: '#15803D',
                        color: '#FFFFFF',
                        padding: '0.6rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <strong style={{ fontSize: '0.98rem', fontWeight: 800, letterSpacing: '-0.2px' }}>
                        🗓️ {diaObj.dia}
                      </strong>
                      <span style={{ fontSize: '0.76rem', fontWeight: 600, opacity: 0.95 }}>
                        Cardápio Equilibrado
                      </span>
                    </div>

                    {/* Grade das 5 Refeições do Dia */}
                    <div
                      style={{
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      {REFEICOES_ORDEM.map((refKey) => {
                        const refConfig = REFEICOES_CONFIG[refKey] || {
                          label: refKey,
                          badgeColor: '#334155',
                          bgColor: '#F8FAFC',
                          borderColor: '#E2E8F0',
                        };
                        const opcoesList = Array.isArray(diaObj.refeicoes?.[refKey]) ? diaObj.refeicoes[refKey] : [];

                        if (opcoesList.length === 0) return null;

                        return (
                          <div
                            key={refKey}
                            style={{
                              backgroundColor: refConfig.bgColor,
                              border: `1px solid ${refConfig.borderColor}`,
                              borderRadius: '6px',
                              padding: '0.65rem 0.85rem',
                            }}
                          >
                            {/* Título da Refeição */}
                            <div style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <strong style={{ fontSize: '0.88rem', color: refConfig.badgeColor, fontWeight: 800 }}>
                                {refConfig.label}
                              </strong>
                              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                Escolha 1 das opções abaixo:
                              </span>
                            </div>

                            {/* Lista de Opções da Refeição */}
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                gap: '0.35rem 0.65rem',
                              }}
                            >
                              {opcoesList.map((opTexto, opIdx) => (
                                <div
                                  key={opIdx}
                                  style={{
                                    fontSize: '0.82rem',
                                    color: '#1E293B',
                                    lineHeight: '1.35',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.35rem',
                                  }}
                                >
                                  <span style={{ fontWeight: 800, color: refConfig.badgeColor, minWidth: '55px', fontSize: '0.76rem' }}>
                                    Opção {opIdx + 1}:
                                  </span>
                                  <span>{opTexto}</span>
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

            {/* 4. RENDERIZAÇÃO DO PLANO LEGADO (caso exista) */}
            {!planoSemanal && refeicoesLegadas.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {refeicoesLegadas.map((ref, idx) => (
                  <div
                    key={idx}
                    className="pdf-avoid-break"
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#F1F5F9',
                        padding: '0.65rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #E2E8F0',
                      }}
                    >
                      <strong style={{ fontSize: '0.95rem', color: '#15803D', fontWeight: 800 }}>
                        {ref.nome}
                      </strong>
                      {ref.horario && (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                          ⏰ {ref.horario}
                        </span>
                      )}
                    </div>

                    <div style={{ padding: '0.75rem 1rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '0.35rem 0.5rem' }}>Alimento</th>
                            <th style={{ padding: '0.35rem 0.5rem' }}>Porção</th>
                            <th style={{ padding: '0.35rem 0.5rem' }}>Substituição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(ref.alimentos || []).map((alimento, fIdx) => (
                            <tr key={fIdx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                              <td style={{ padding: '0.45rem 0.5rem', fontWeight: 600, color: '#0F172A' }}>
                                • {alimento.nome}
                              </td>
                              <td style={{ padding: '0.45rem 0.5rem', color: '#334155' }}>
                                {alimento.quantidade}
                              </td>
                              <td style={{ padding: '0.45rem 0.5rem', color: '#64748B', fontSize: '0.78rem' }}>
                                {alimento.substituicao || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. RECOMENDAÇÕES & ORIENTAÇÕES CLÍNICAS GERAIS */}
            {conteudo?.orientacoes_gerais && (
              <div
                className="pdf-avoid-break"
                style={{
                  marginTop: '1.25rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                  backgroundColor: '#F8FAFC',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                }}
              >
                <h3 style={{ fontSize: '0.92rem', color: '#15803D', margin: '0 0 0.4rem', fontWeight: 800 }}>
                  📌 Orientações e Recomendações Nutricionais
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: '1.5', margin: 0 }}>
                  {conteudo.orientacoes_gerais}
                </p>
              </div>
            )}

            {/* 6. RODAPÉ DE ASSINATURA DIGITAL */}
            <div
              className="pdf-avoid-break"
              style={{
                marginTop: '2rem',
                paddingTop: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontSize: '0.76rem',
                color: '#64748B',
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
              }}
            >
              <div>
                <span>Emitido digitalmente via Sistema Richieri Nutrição</span>
              </div>
              <div style={{ textAlign: 'center', width: '240px', borderTop: '1px solid #94A3B8', paddingTop: '0.4rem' }}>
                <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>
                  {nutritionist?.nome || 'Dra. Gabriela Richieri'}
                </strong>
                <br />
                <span style={{ fontSize: '0.76rem' }}>{nutritionist?.crn || 'CRN-3 48.912'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer do Modal (Não impresso) */}
        <div
          className="modal-footer no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            flexShrink: 0,
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              style={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #15803D 0%, #047857 100%)',
                boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {isDownloadingPdf ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #FFF', borderTopColor: 'transparent' }}></span>
                  Gerando PDF...
                </>
              ) : (
                <>📥 Baixar Arquivo PDF no PC</>
              )}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handlePrint} style={{ fontWeight: 600 }}>
              🖨️ Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
