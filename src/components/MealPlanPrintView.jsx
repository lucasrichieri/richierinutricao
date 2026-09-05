import React, { useState, useRef, useEffect } from 'react';
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
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailDestinatario, setEmailDestinatario] = useState('');
  const [mensagemEmail, setMensagemEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState({ text: '', type: '' });
  const pdfContainerRef = useRef(null);

  useEffect(() => {
    if (patient) {
      setEmailDestinatario(patient.email || '');
      setMensagemEmail(
        `Olá, ${patient.nome || 'Paciente'}!\n\nSegue em anexo o seu Plano Alimentar Semanal personalizado, elaborado especialmente para apoiar seus objetivos de saúde e bem-estar.\n\nQualquer dúvida sobre as substituições ou horários das refeições, conte comigo!`
      );
      setEmailStatusMessage({ text: '', type: '' });
    }
  }, [patient, isOpen]);

  if (!isOpen || !plan) return null;

  const conteudo = typeof plan.conteudo === 'string' ? JSON.parse(plan.conteudo) : (plan.conteudo || {});
  const planoSemanal = Array.isArray(conteudo?.plano_semanal) ? conteudo.plano_semanal : null;
  const refeicoesLegadas = Array.isArray(conteudo?.refeicoes) ? conteudo.refeicoes : [];

  // Gera o documento jsPDF com as 4 páginas A4 discretas
  const generatePdfInstance = async () => {
    if (!pdfContainerRef.current) return null;

    const pageElements = pdfContainerRef.current.querySelectorAll('.pdf-a4-page');
    if (pageElements.length === 0) {
      throw new Error('Nenhuma página A4 encontrada para compilar o PDF.');
    }

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

    return pdf;
  };

  // Download do PDF no PC
  const handleDownloadPDF = async () => {
    setIsDownloadingPdf(true);
    try {
      const pdf = await generatePdfInstance();
      if (!pdf) return;

      const patientName = (patient?.nome || 'Paciente')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const filename = `Plano_Alimentar_${patientName}.pdf`;

      pdf.save(filename);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Ocorreu um erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Envio do PDF por e-mail via Serverless Endpoint (/api/enviar-plano-email)
  const handleSendEmailSubmit = async (e) => {
    e.preventDefault();

    if (!emailDestinatario || !emailDestinatario.includes('@')) {
      setEmailStatusMessage({ text: 'Por favor, informe um endereço de e-mail válido.', type: 'error' });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatusMessage({ text: 'Gerando PDF e enviando e-mail...', type: 'info' });

    try {
      const pdf = await generatePdfInstance();
      if (!pdf) throw new Error('Não foi possível gerar o PDF para envio.');

      const pdfBase64 = pdf.output('datauristring');

      const response = await fetch('/api/enviar-plano-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarioEmail: emailDestinatario.trim(),
          pacienteNome: patient?.nome || 'Paciente',
          planoTitulo: plan.titulo || 'Plano Alimentar Semanal',
          mensagemPersonalizada: mensagemEmail,
          pdfBase64: pdfBase64,
          nutricionistaNome: nutritionist?.nome || 'Richieri Nutrição',
          smtpUser: import.meta.env.VITE_SMTP_USER || '',
          smtpPass: import.meta.env.VITE_SMTP_PASS || '',
          smtpHost: import.meta.env.VITE_SMTP_HOST || '',
          smtpPort: import.meta.env.VITE_SMTP_PORT || '',
          smtpFrom: import.meta.env.VITE_SMTP_FROM || '',
        }),
      });

      const data = await response.json();

      if (data.requiresConfig) {
        setEmailStatusMessage({
          text: 'Configuração SMTP necessária: para envio automático direto pelo servidor, preencha SMTP_USER e SMTP_PASS no .env.',
          type: 'warning',
        });
      } else if (response.ok && data.success) {
        setEmailStatusMessage({
          text: `✨ Plano alimentar em PDF enviado com sucesso para ${emailDestinatario}!`,
          type: 'success',
        });
        setTimeout(() => {
          setIsEmailModalOpen(false);
          setEmailStatusMessage({ text: '', type: '' });
        }, 3000);
      } else {
        throw new Error(data.error || data.detalhes || 'Falha no servidor ao disparar o e-mail.');
      }
    } catch (err) {
      console.error('Erro ao encaminhar e-mail:', err);
      setEmailStatusMessage({
        text: `Erro ao enviar: ${err.message}. Você também pode baixar o PDF e anexar no seu aplicativo de e-mail.`,
        type: 'error',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Localiza o cardápio do dia específico
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
          marginBottom: '12px',
        }}
      >
        {/* Banner do Dia */}
        <div
          style={{
            backgroundColor: '#15803D',
            color: '#FFFFFF',
            padding: '5px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <strong style={{ fontSize: '13px', fontWeight: 800 }}>
            🗓️ {dayObj.dia}
          </strong>
          <span style={{ fontSize: '10.5px', opacity: 0.95 }}>Cardápio Balanceado</span>
        </div>

        {/* Refeições do Dia */}
        <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
                  padding: '4px 7px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <strong style={{ fontSize: '11px', color: config.color, fontWeight: 800 }}>
                    {config.label}
                  </strong>
                  <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>
                    (Escolha 1 das 5 opções)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                  {opcoes.map((op, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '10px',
                        color: '#1E293B',
                        lineHeight: '1.25',
                        display: 'flex',
                        gap: '3px',
                        gridColumn: idx === 4 ? '1 / -1' : 'auto',
                      }}
                    >
                      <strong style={{ color: config.color, minWidth: '45px', fontSize: '9.5px' }}>
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
        {/* Barra Superior */}
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
                Documento de 4 páginas A4 pronto para download ou encaminhamento por e-mail
              </span>
            </div>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose} style={{ fontSize: '1.4rem' }}>
            &times;
          </button>
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
                PÁGINA 1: Cabeçalho Completo + Metas + Segunda-feira + Orientações
                ==================================================================== */}
            <div
              className="pdf-a4-page"
              style={{
                width: '794px',
                minHeight: '1120px',
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
                    marginBottom: '12px',
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

                {/* Orientações Clínicas Gerais na Página 1 */}
                {conteudo?.orientacoes_gerais && (
                  <div
                    style={{
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '7px',
                      padding: '10px 14px',
                      backgroundColor: '#F8FAFC',
                      marginTop: '6px',
                    }}
                  >
                    <h3 style={{ fontSize: '11.5px', color: '#15803D', margin: '0 0 4px', fontWeight: 800 }}>
                      📌 Orientações e Recomendações Nutricionais Iniciais
                    </h3>
                    <p style={{ fontSize: '10px', color: '#334155', lineHeight: '1.45', margin: 0 }}>
                      {conteudo.orientacoes_gerais}
                    </p>
                  </div>
                )}
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
                PÁGINA 2: Terça-feira + Quarta-feira
                ==================================================================== */}
            <div
              className="pdf-a4-page"
              style={{
                width: '794px',
                minHeight: '1120px',
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
                    <img src="/logo.png" alt="Logo" style={{ height: '22px', width: 'auto' }} />
                    <strong style={{ fontSize: '12.5px', color: '#15803D' }}>Richieri Nutrição</strong>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#475569' }}>
                    Paciente: <strong>{patient?.nome || 'Paciente'}</strong>
                  </div>
                </div>

                {/* Terça-feira */}
                {renderDayCard(terca)}

                {/* Quarta-feira */}
                {renderDayCard(quarta)}
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
                PÁGINA 3: Quinta-feira + Sexta-feira
                ==================================================================== */}
            <div
              className="pdf-a4-page"
              style={{
                width: '794px',
                minHeight: '1120px',
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
                    <img src="/logo.png" alt="Logo" style={{ height: '22px', width: 'auto' }} />
                    <strong style={{ fontSize: '12.5px', color: '#15803D' }}>Richieri Nutrição</strong>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#475569' }}>
                    Paciente: <strong>{patient?.nome || 'Paciente'}</strong>
                  </div>
                </div>

                {/* Quinta-feira */}
                {renderDayCard(quinta)}

                {/* Sexta-feira */}
                {renderDayCard(sexta)}
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
                PÁGINA 4: Sábado + Domingo + Assinatura Digital
                ==================================================================== */}
            <div
              className="pdf-a4-page"
              style={{
                width: '794px',
                minHeight: '1120px',
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
                    <img src="/logo.png" alt="Logo" style={{ height: '22px', width: 'auto' }} />
                    <strong style={{ fontSize: '12.5px', color: '#15803D' }}>Richieri Nutrição</strong>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#475569' }}>
                    Paciente: <strong>{patient?.nome || 'Paciente'}</strong>
                  </div>
                </div>

                {/* Sábado */}
                {renderDayCard(sabado)}

                {/* Domingo */}
                {renderDayCard(domingo)}
              </div>

              {/* Rodapé com Assinatura Digital e Numeração de Página */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ fontSize: '9.5px', color: '#64748B', lineHeight: '1.4' }}>
                    <span>Emitido digitalmente via Sistema Richieri Nutrição</span>
                    <br />
                    <span>Autenticação: {plan.id ? String(plan.id).substring(0, 18) : 'RN-PRESCRICAO'}</span>
                  </div>

                  <div style={{ textAlign: 'center', width: '220px', borderTop: '1px solid #94A3B8', paddingTop: '6px' }}>
                    <strong style={{ fontSize: '11px', color: '#0F172A', display: 'block' }}>
                      {nutritionist?.nome || 'Dra. Gabriela Richieri'}
                    </strong>
                    <span style={{ fontSize: '9.5px', color: '#64748B' }}>
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

        {/* Footer do Modal com Botão Único de Baixar PDF e Botão de Enviar por E-mail */}
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
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEmailStatusMessage({ text: '', type: '' });
                setIsEmailModalOpen(true);
              }}
              style={{
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.15rem',
              }}
            >
              ✉️ Encaminhar por E-mail
            </button>
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
          </div>
        </div>
      </div>

      {/* MODAL POPUP PARA ENCAMINHAR O PDF POR E-MAIL */}
      {isEmailModalOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1100, backgroundColor: 'rgba(15, 23, 42, 0.75)' }}
          onClick={() => setIsEmailModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '520px', width: '90vw', backgroundColor: '#FFFFFF', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.4rem' }}>✉️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                    Encaminhar Plano por E-mail
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    O arquivo PDF gerado será enviado como anexo
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEmailModalOpen(false)}
                style={{ fontSize: '1.4rem' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSendEmailSubmit}>
              <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {emailStatusMessage.text && (
                  <div
                    className={`alert alert-${emailStatusMessage.type === 'error' ? 'error' : emailStatusMessage.type === 'warning' ? 'warning' : 'success'}`}
                    style={{ fontSize: '0.85rem', padding: '0.75rem 1rem' }}
                  >
                    {emailStatusMessage.text}
                  </div>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="email_destinatario" style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    E-mail do Destinatário *
                  </label>
                  <input
                    type="email"
                    id="email_destinatario"
                    className="form-control"
                    value={emailDestinatario}
                    onChange={(e) => setEmailDestinatario(e.target.value)}
                    placeholder="paciente@exemplo.com"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="email_mensagem" style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    Mensagem do E-mail
                  </label>
                  <textarea
                    id="email_mensagem"
                    className="form-control"
                    rows={4}
                    value={mensagemEmail}
                    onChange={(e) => setMensagemEmail(e.target.value)}
                    placeholder="Escreva uma mensagem para o paciente..."
                  />
                </div>

                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.82rem',
                    color: '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>📎</span>
                  <span>Anexo automático: <strong>Plano_Alimentar_{patient?.nome?.replace(/\s+/g, '_')}.pdf</strong></span>
                </div>
              </div>

              <div
                className="modal-footer"
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEmailModalOpen(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSendingEmail}
                  style={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #15803D 0%, #047857 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  {isSendingEmail ? (
                    <>
                      <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #FFF', borderTopColor: 'transparent' }}></span>
                      Enviando...
                    </>
                  ) : (
                    <>🚀 Enviar E-mail com PDF</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
