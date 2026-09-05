import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const REFEICOES_ORDEM = ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'];

const REFEICOES_CONFIG = {
  cafe_da_manha: {
    label: '☕ Café da Manhã',
    color: '#B45309',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  lanche_manha: {
    label: '🍎 Lanche da Manhã',
    color: '#15803D',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  almoco: {
    label: '🍲 Almoço',
    color: '#047857',
    bgColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  lanche_tarde: {
    label: '🥪 Lanche da Tarde',
    color: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  jantar: {
    label: '🥗 Jantar',
    color: '#4338CA',
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const pdfContainerRef = useRef(null);

  if (!isOpen || !plan) return null;

  const conteudo = typeof plan.conteudo === 'string' ? JSON.parse(plan.conteudo) : (plan.conteudo || {});
  const planoSemanal = Array.isArray(conteudo?.plano_semanal) ? conteudo.plano_semanal : null;
  const refeicoesLegadas = Array.isArray(conteudo?.refeicoes) ? conteudo.refeicoes : [];

  // Impressão nativa
  const handlePrint = () => {
    window.print();
  };

  // Download do PDF com renderização discreta página por página (A4 Exato: 210mm x 297mm)
  const handleDownloadPDF = async () => {
    if (!pdfContainerRef.current) return;

    setIsDownloadingPdf(true);
    try {
      const pageElements = pdfContainerRef.current.querySelectorAll('.pdf-a4-page');
      if (pageElements.length === 0) {
        throw new Error('Nenhuma página encontrada para gerar PDF.');
      }

      const patientName = (patient?.nome || 'Paciente')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const filename = `Plano_Alimentar_${patientName}.pdf`;

      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      });

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          windowWidth: 794,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      pdf.save(filename);
    } catch (err) {
      console.error('Erro ao gerar PDF página por página:', err);
      alert('Ocorreu um erro ao baixar o PDF. Você também pode clicar em "Imprimir" e selecionar "Salvar como PDF".');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Divide os dias nos blocos de páginas A4 estruturadas
  const getDayData = (diaNome) => {
    if (!planoSemanal) return null;
    return planoSemanal.find((d) => d.dia === diaNome) || null;
  };

  const segunda = getDayData('Segunda-feira');
  const terca = getDayData('Terça-feira');
  const quarta = getDayData('Quarta-feira');
  const quinta = getDayData('Quinta-feira');
  const sexta = getDayData('Sexta-feira');
  const sabado = getDayData('Sábado');
  const domingo = getDayData('Domingo');

  // Componente de Renderização de um Dia da Semana
  const renderDayCard = (dayObj) => {
    if (!dayObj) return null;

    return (
      <div
        style={{
          border: '1.5px solid #CBD5E1',
          borderRadius: '7px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          marginBottom: '10px',
        }}
      >
        {/* Banner do Dia */}
        <div
          style={{
            backgroundColor: '#15803D',
            color: '#FFFFFF',
            padding: '4px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <strong style={{ fontSize: '13px', fontWeight: 800 }}>
            🗓️ {dayObj.dia}
          </strong>
          <span style={{ fontSize: '11px', opacity: 0.9 }}>Cardápio Nutricional</span>
        </div>

        {/* Refeições do Dia */}
        <div style={{ padding: '7px 9px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {REFEICOES_ORDEM.map((refKey) => {
            const config = REFEICOES_CONFIG[refKey] || {
              label: refKey,
              color: '#334155',
              bgColor: '#F8FAFC',
              borderColor: '#E2E8F0',
            };
            const opcoes = Array.isArray(dayObj.refeicoes?.[refKey]) ? dayObj.refeicoes[refKey] : [];
            if (opcoes.length === 0) return null;

            return (
              <div
                key={refKey}
                style={{
                  backgroundColor: config.bgColor,
                  border: `1px solid ${config.borderColor}`,
                  borderRadius: '5px',
                  padding: '5px 8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <strong style={{ fontSize: '11.5px', color: config.color, fontWeight: 800 }}>
                    {config.label}
                  </strong>
                  <span style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600 }}>
                    (Escolha 1 das 5 opções)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                  {opcoes.map((op, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '10.5px',
                        color: '#1E293B',
                        lineHeight: '1.25',
                        display: 'flex',
                        gap: '3px',
                        gridColumn: idx === 4 ? '1 / -1' : 'auto',
                      }}
                    >
                      <strong style={{ color: config.color, minWidth: '46px', fontSize: '10px' }}>
                        Opção {idx + 1}:
                      </strong>
                      <span>{op}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay printable" onClick={onClose}>
      <div
        className="modal-content large print-page"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          width: '96vw',
          background: '#F1F5F9',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Barra Superior de Ações */}
        <div
          className="modal-header no-print"
          style={{
            borderBottom: '1px solid #CBD5E1',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📄</span>
            <div>
              <h2 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                Plano Alimentar Semanal em PDF
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Documento de 4 páginas A4 formatado e sem quebras de texto
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              style={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #15803D 0%, #047857 100%)',
                boxShadow: '0 2px 8px rgba(21, 128, 61, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.25rem',
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
            <button type="button" className="modal-close-btn" onClick={onClose} style={{ fontSize: '1.4rem' }}>
              &times;
            </button>
          </div>
        </div>

        {/* Visualizador de Páginas A4 com Scroll */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            backgroundColor: '#64748B',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          <div ref={pdfContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
            {/* ====================================================================
                PÁGINA 1: Cabeçalho + Metas + Segunda-feira + Terça-feira
                ==================================================================== */}
            <div
              className="pdf-a4-page"
              style={{
                width: '794px',
                minHeight: '1120px',
                height: '1120px',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: '#0F172A',
              }}
            >
              <div>
                {/* Cabeçalho Principal da Clínica */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '2.5px solid #15803D',
                    paddingBottom: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src="/logo.png"
                      alt="Richieri Nutrição"
                      style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
                    />
                    <div>
                      <h1 style={{ fontSize: '18px', color: '#15803D', margin: 0, fontWeight: 900 }}>
                        Richieri Nutrição
                      </h1>
                      <p style={{ margin: 0, fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                        Nutrição Clínica & Esportiva de Alta Performance
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '10px', color: '#334155', lineHeight: '1.3' }}>
                    <strong style={{ fontSize: '11px', color: '#0F172A' }}>
                      {nutritionist?.nome || 'Dra. Gabriela Richieri'}
                    </strong>
                    <br />
                    <span>{nutritionist?.crn || 'CRN-3 48.912'}</span>
                    <br />
                    <span>{nutritionist?.telefone || '(11) 98765-4321'}</span>
                  </div>
                </div>

                {/* Card do Paciente e Metas */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    marginBottom: '10px',
                    display: 'grid',
                    gridTemplateColumns: '1.8fr 1fr 1fr',
                    gap: '8px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748B', fontWeight: 800 }}>
                      Paciente
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                      {patient?.nome || 'Paciente'}
                    </div>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>
                      {plan.titulo || 'Plano Alimentar Semanal Personalizado'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748B', fontWeight: 800 }}>
                      Data de Emissão
                    </span>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>
                      📅 {new Date(plan.created_at || Date.now()).toLocaleDateString('pt-BR')}
                    </div>
                    <span style={{ fontSize: '10px', color: '#15803D', fontWeight: 700 }}>
                      ✨ Cardápio Semanal Variado
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748B', fontWeight: 800 }}>
                      Metas Diárias
                    </span>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803D' }}>
                      🔥 {conteudo?.calorias || '1800'} kcal/dia
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284C7' }}>
                      💧 {conteudo?.agua || '2.5'} L de água/dia
                    </div>
                  </div>
                </div>

                {/* Segunda-feira */}
                {renderDayCard(segunda)}

                {/* Terça-feira */}
                {renderDayCard(terca)}
              </div>

              {/* Rodapé da Página 1 */}
              <div
                style={{
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '9.5px',
                  color: '#94A3B8',
                }}
              >
                <span>Richieri Nutrição • Plano Alimentar Individualizado</span>
                <span>Página 1 de 4</span>
              </div>
            </div>

            {/* ====================================================================
                PÁGINA 2: Quarta-feira + Quinta-feira
                ==================================================================== */}
            <div
              className="pdf-a4-page"
              style={{
                width: '794px',
                minHeight: '1120px',
                height: '1120px',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: '#0F172A',
              }}
            >
              <div>
                {/* Mini Cabeçalho da Página 2 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '2px solid #15803D',
                    paddingBottom: '6px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '24px', width: 'auto' }} />
                    <strong style={{ fontSize: '13px', color: '#15803D' }}>Richieri Nutrição</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    Paciente: <strong>{patient?.nome || 'Paciente'}</strong>
                  </div>
                </div>

                {/* Quarta-feira */}
                {renderDayCard(quarta)}

                {/* Quinta-feira */}
                {renderDayCard(quinta)}
              </div>

              {/* Rodapé da Página 2 */}
              <div
                style={{
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '9.5px',
                  color: '#94A3B8',
                }}
              >
                <span>Richieri Nutrição • Plano Alimentar Individualizado</span>
                <span>Página 2 de 4</span>
              </div>
            </div>

            {/* ====================================================================
                PÁGINA 3: Sexta-feira + Sábado
                ==================================================================== */}
            <div
              className="pdf-a4-page"
              style={{
                width: '794px',
                minHeight: '1120px',
                height: '1120px',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: '#0F172A',
              }}
            >
              <div>
                {/* Mini Cabeçalho da Página 3 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '2px solid #15803D',
                    paddingBottom: '6px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '24px', width: 'auto' }} />
                    <strong style={{ fontSize: '13px', color: '#15803D' }}>Richieri Nutrição</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    Paciente: <strong>{patient?.nome || 'Paciente'}</strong>
                  </div>
                </div>

                {/* Sexta-feira */}
                {renderDayCard(sexta)}

                {/* Sábado */}
                {renderDayCard(sabado)}
              </div>

              {/* Rodapé da Página 3 */}
              <div
                style={{
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '9.5px',
                  color: '#94A3B8',
                }}
              >
                <span>Richieri Nutrição • Plano Alimentar Individualizado</span>
                <span>Página 3 de 4</span>
              </div>
            </div>

            {/* ====================================================================
                PÁGINA 4: Domingo + Orientações Nutricionais + Assinatura Digital
                ==================================================================== */}
            <div
              className="pdf-a4-page"
              style={{
                width: '794px',
                minHeight: '1120px',
                height: '1120px',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: '#0F172A',
              }}
            >
              <div>
                {/* Mini Cabeçalho da Página 4 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '2px solid #15803D',
                    paddingBottom: '6px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '24px', width: 'auto' }} />
                    <strong style={{ fontSize: '13px', color: '#15803D' }}>Richieri Nutrição</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    Paciente: <strong>{patient?.nome || 'Paciente'}</strong>
                  </div>
                </div>

                {/* Domingo */}
                {renderDayCard(domingo)}

                {/* Orientações Clínicas Gerais */}
                <div
                  style={{
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '7px',
                    padding: '12px 16px',
                    backgroundColor: '#F8FAFC',
                    marginTop: '12px',
                  }}
                >
                  <h3 style={{ fontSize: '12.5px', color: '#15803D', margin: '0 0 6px', fontWeight: 800 }}>
                    📌 Orientações e Recomendações Nutricionais Importantes
                  </h3>
                  <p style={{ fontSize: '11px', color: '#334155', lineHeight: '1.5', margin: 0 }}>
                    {conteudo?.orientacoes_gerais ||
                      'Mastigar bem e devagar. Ingerir água longe das principais refeições. Priorizar alimentos in natura e evitar ultraprocessados.'}
                  </p>
                </div>
              </div>

              {/* Rodapé com Assinatura Digital e Numeração de Página */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    paddingBottom: '14px',
                    borderBottom: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#64748B' }}>
                    <span>Emitido digitalmente via Sistema Richieri Nutrição</span>
                    <br />
                    <span>Autenticação Digital: {plan.id || 'RN-PRESCRICAO'}</span>
                  </div>

                  <div style={{ textAlign: 'center', width: '220px', borderTop: '1px solid #94A3B8', paddingTop: '6px' }}>
                    <strong style={{ fontSize: '11px', color: '#0F172A', display: 'block' }}>
                      {nutritionist?.nome || 'Dra. Gabriela Richieri'}
                    </strong>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>
                      {nutritionist?.crn || 'CRN-3 48.912'}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '9.5px',
                    color: '#94A3B8',
                  }}
                >
                  <span>Richieri Nutrição • Plano Alimentar Individualizado</span>
                  <span>Página 4 de 4</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer do Modal */}
        <div
          className="modal-footer no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
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
                boxShadow: '0 2px 8px rgba(21, 128, 61, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.25rem',
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
