import React, { useState } from 'react';

/**
 * Gráfico de evolução de peso limpo e moderno em SVG puro
 * @param {Array} consultations Lista de consultas do paciente
 * @param {Object} patient Paciente atual
 */
export default function WeightEvolutionChart({ consultations = [], patient = null }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Coleta todas as consultas que possuem peso preenchido
  const dataPoints = [];
  if (consultations && consultations.length > 0) {
    const sorted = [...consultations]
      .filter((c) => c.peso && !isNaN(parseFloat(c.peso)))
      .sort((a, b) => new Date(a.data_consulta || a.created_at) - new Date(b.data_consulta || b.created_at));

    sorted.forEach((c) => {
      dataPoints.push({
        id: c.id,
        date: c.data_consulta ? new Date(c.data_consulta).toLocaleDateString('pt-BR') : '—',
        rawDate: new Date(c.data_consulta || c.created_at),
        weight: parseFloat(c.peso),
        cintura: c.cintura,
        gordura: c.percentual_gordura,
      });
    });
  }

  // Se não houver consultas registradas com peso
  if (dataPoints.length === 0) {
    return (
      <div
        style={{
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          backgroundColor: 'var(--surface-hover)',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
        }}
      >
        <span style={{ fontSize: '2.5rem', opacity: 0.7 }}>📉</span>
        <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 700 }}>
          Nenhuma consulta registrada ainda
        </h4>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '400px' }}>
          Registre as consultas do paciente para acompanhar automaticamente a evolução do peso e medidas ao longo do tempo.
        </p>
      </div>
    );
  }

  // Cálculos para o gráfico SVG
  const weights = dataPoints.map((d) => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const startWeight = weights[0];
  const currentWeight = weights[weights.length - 1];
  const weightDiff = Number((currentWeight - startWeight).toFixed(1));

  // Dimensões do SVG
  const width = 700;
  const height = 240;
  const paddingX = 50;
  const paddingY = 40;

  const yRange = maxWeight === minWeight ? 10 : maxWeight - minWeight;
  const yMinPadded = Math.max(0, Math.floor(minWeight - yRange * 0.15));
  const yMaxPadded = Math.ceil(maxWeight + yRange * 0.15);

  const getX = (index) => {
    if (dataPoints.length === 1) return width / 2;
    return paddingX + (index / (dataPoints.length - 1)) * (width - paddingX * 2);
  };

  const getY = (weight) => {
    if (yMaxPadded === yMinPadded) return height / 2;
    return height - paddingY - ((weight - yMinPadded) / (yMaxPadded - yMinPadded)) * (height - paddingY * 2);
  };

  // Gerar coordenadas dos pontos
  const points = dataPoints.map((d, i) => ({
    ...d,
    x: getX(i),
    y: getY(d.weight),
  }));

  // Gerar a linha do gráfico (path SVG)
  const linePath = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  // Gerar a área sombreada sob a curva com gradiente
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`
    : '';

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        padding: '1.25rem 1.5rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem',
      }}
    >
      {/* Cabeçalho do Gráfico */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📈</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              Evolução de Peso
            </h3>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Histórico registrado em cada consulta ({dataPoints.length} {dataPoints.length === 1 ? 'pesagem' : 'pesagens'})
          </span>
        </div>

        {/* Resumo de Variação */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Peso Atual</span>
            <strong style={{ fontSize: '1.15rem', color: 'var(--primary-dark)' }}>{currentWeight} kg</strong>
          </div>
          {dataPoints.length > 1 && (
            <div
              style={{
                backgroundColor: weightDiff <= 0 ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${weightDiff <= 0 ? '#BBF7D0' : '#FECACA'}`,
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: weightDiff <= 0 ? '#166534' : '#991B1B',
                }}
              >
                {weightDiff <= 0 ? '↓ ' : '↑ '} {Math.abs(weightDiff)} kg
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '450px' }}>
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas horizontais de grade (Grid lines) */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const yVal = yMinPadded + (yMaxPadded - yMinPadded) * (1 - pct);
            const yPos = paddingY + pct * (height - paddingY * 2);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={yPos}
                  x2={width - paddingX}
                  y2={yPos}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#94A3B8"
                  fontWeight="600"
                >
                  {Math.round(yVal)}kg
                </text>
              </g>
            );
          })}

          {/* Área sombreada sob a curva */}
          {points.length > 1 && <path d={areaPath} fill="url(#weightGradient)" />}

          {/* Linha da curva de evolução */}
          {points.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Pontos de cada consulta */}
          {points.map((pt, idx) => {
            const isHovered = hoveredPoint?.id === pt.id;
            return (
              <g
                key={pt.id || idx}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Linha guia vertical */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingY}
                    x2={pt.x}
                    y2={height - paddingY}
                    stroke="var(--primary)"
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                  />
                )}

                {/* Círculo do ponto */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : 5}
                  fill="white"
                  stroke="var(--primary)"
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  style={{ transition: 'r 0.15s ease' }}
                />

                {/* Rótulo de data no eixo X */}
                <text
                  x={pt.x}
                  y={height - paddingY + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isHovered ? 'var(--primary-dark)' : '#64748B'}
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {pt.date}
                </text>

                {/* Rótulo do valor de peso acima do ponto */}
                <text
                  x={pt.x}
                  y={pt.y - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--primary-dark)"
                  fontWeight="700"
                >
                  {pt.weight} kg
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip Detalhado se houver hover */}
      {hoveredPoint && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.6rem 1rem',
            backgroundColor: '#F8FAFC',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
          }}
        >
          <span>
            📅 <strong>Consulta em {hoveredPoint.date}:</strong> Peso: <strong>{hoveredPoint.weight} kg</strong>
          </span>
          {hoveredPoint.cintura && <span>📏 Cintura: <strong>{hoveredPoint.cintura} cm</strong></span>}
          {hoveredPoint.gordura && <span>📊 Gordura: <strong>{hoveredPoint.gordura}%</strong></span>}
        </div>
      )}
    </div>
  );
}
