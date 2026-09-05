import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Dias da semana padrão
const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

// Schema para Structured Outputs com o Google Gemini
const PLANO_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    plano_semanal: {
      type: SchemaType.ARRAY,
      description: 'Plano alimentar semanal completo para os 7 dias da semana',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dia: {
            type: SchemaType.STRING,
            description: 'Nome do dia da semana (ex: Segunda-feira)',
          },
          refeicoes: {
            type: SchemaType.OBJECT,
            properties: {
              cafe_da_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Lista com 5 opções ou itens para o café da manhã',
              },
              lanche_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Lista com 5 opções ou itens para o lanche da manhã',
              },
              almoco: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Lista com 5 opções ou itens para o almoço',
              },
              lanche_tarde: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Lista com 5 opções ou itens para o lanche da tarde',
              },
              jantar: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Lista com 5 opções ou itens para o jantar',
              },
            },
            required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
          },
        },
        required: ['dia', 'refeicoes'],
      },
    },
  },
  required: ['plano_semanal'],
};

/**
 * Gerador de fallback estruturado caso a API do Gemini não esteja configurada ou atinja timeout
 */
export function generateFallbackPlan(paciente = {}) {
  const restricoes = Array.isArray(paciente.restricoes_alimentares) ? paciente.restricoes_alimentares.join(', ') : '';
  const alergias = Array.isArray(paciente.alergias) ? paciente.alergias.join(', ') : '';
  const objetivos = Array.isArray(paciente.objetivos) ? paciente.objetivos.join(', ') : 'Saúde geral';
  const isSemLactose = (restricoes + alergias).toLowerCase().includes('lactose') || (restricoes + alergias).toLowerCase().includes('leite');
  const isSemGluten = (restricoes + alergias).toLowerCase().includes('glúten') || (restricoes + alergias).toLowerCase().includes('trigo');

  const leiteOpcao = isSemLactose ? 'Bebida vegetal de amêndoas (200ml)' : 'Iogurte natural desnatado (160g)';
  const queijoOpcao = isSemLactose ? 'Pasta de tofu temperado (50g)' : 'Queijo cottage ou minas frescal (2 fatias)';
  const paoOpcao = isSemGluten ? 'Tapioca com sementes de chia (2 colheres)' : 'Pão 100% integral (2 fatias)';

  return {
    plano_semanal: DIAS_SEMANA.map((dia, index) => ({
      dia,
      refeicoes: {
        cafe_da_manha: [
          'Ovos mexidos com azeite de oliva (2 unidades)',
          paoOpcao,
          'Mamão papaya ou morangos frescos (1 porção)',
          'Café preto ou chá verde sem açúcar (1 xícara)',
          queijoOpcao,
        ],
        lanche_manha: [
          'Maçã ou banana prata (1 unidade)',
          'Castanhas-do-Pará ou nozes (2 unidades)',
          'Sementes de abóbora tostadas (1 colher de sobremesa)',
          'Chá de camomila ou hortelã (200ml)',
          'Água mineral com gotas de limão (300ml)',
        ],
        almoco: [
          'Salada de folhas verdes à vontade (Alface, rúcula e agrião)',
          'Legumes cozidos no vapor (Brócolis, cenoura e abobrinha - 1 prato de sobremesa)',
          index % 2 === 0 ? 'Arroz integral (3 colheres de sopa)' : 'Batata-doce assada (100g)',
          'Feijão carioca ou preto (1 concha média)',
          index % 3 === 0 ? 'Peito de frango grelhado (140g)' : (index % 3 === 1 ? 'Filé de tilápia grelhada (150g)' : 'Patinho moído refogado (130g)'),
        ],
        lanche_tarde: [
          leiteOpcao,
          'Aveia em flocos finos (2 colheres de sopa)',
          'Frutas vermelhas ou banana picada (1 porção)',
          'Canela em pó a gosto',
          'Sementes de chia (1 colher de chá)',
        ],
        jantar: [
          'Mix de folhas verdes com tomate cereja e pepino',
          index % 2 === 0 ? 'Omelete com espinafre e tomate (2 ovos)' : 'Filé de pescada ou frango grelhado (130g)',
          'Purê de abóbora cabotiá ou abobrinha refogada (3 colheres)',
          'Sopa de legumes com frango desfiado (1 prato fundo)',
          'Chá de erva-doce ou melissa morno (200ml)',
        ],
      },
    })),
  };
}

/**
 * Handler da Serverless Function
 */
export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { paciente } = req.body || {};

    if (!paciente || !paciente.nome) {
      return res.status(400).json({ error: 'Dados do paciente incompletos ou ausentes.' });
    }

    // Formata os dados do paciente para o prompt do Gemini
    const dadosPacienteFormatados = `
- Nome: ${paciente.nome || 'Paciente'}
- Data de Nascimento: ${paciente.data_nascimento || 'Não informada'}
- Sexo: ${paciente.sexo || 'Não informado'}
- Peso Inicial: ${paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não informado'}
- Altura: ${paciente.altura ? `${paciente.altura} cm` : 'Não informada'}
- Nível de Atividade: ${paciente.nivel_atividade || 'Moderado'}
- Pratica Atividade Física: ${paciente.atividade_fisica ? `Sim (${paciente.atividade_fisica_descricao || 'Sem descrição'})` : 'Não'}
- Objetivos: ${Array.isArray(paciente.objetivos) ? paciente.objetivos.join(', ') : (paciente.objetivo_texto || 'Melhorar saúde geral')}
- Detalhes do Objetivo: ${paciente.objetivo_texto || 'Não detalhado'}
- Patologias / Condições Clínicas: ${Array.isArray(paciente.patologias) && paciente.patologias.length > 0 ? paciente.patologias.join(', ') : 'Nenhuma'}
- Restrições Alimentares: ${Array.isArray(paciente.restricoes_alimentares) && paciente.restricoes_alimentares.length > 0 ? paciente.restricoes_alimentares.join(', ') : 'Nenhuma'}
- Alergias: ${Array.isArray(paciente.alergias) && paciente.alergias.length > 0 ? paciente.alergias.join(', ') : 'Nenhuma'}
- Medicamentos em uso: ${paciente.medicamentos || 'Nenhum'}
- Suplementos em uso: ${paciente.suplementos || 'Nenhum'}
- Quantidade de Refeições por Dia: ${paciente.refeicoes_por_dia || 4}
- Horário que Acorda: ${paciente.horario_acorda || '06:00'}
- Horário que Dorme: ${paciente.horario_dorme || '22:30'}
- Consumo de Água Atual: ${paciente.litros_agua ? `${paciente.litros_agua} Litros/dia` : 'Não informado'}
- Observações adicionais: ${paciente.observacoes || 'Sem observações adicionais'}
    `.trim();

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

    if (!apiKey) {
      console.warn('GOOGLE_API_KEY não configurada. Gerando plano estruturado via fallback.');
      const fallbackPlan = generateFallbackPlan(paciente);
      return res.status(200).json({
        success: true,
        origem: 'fallback_sem_chave',
        plano: fallbackPlan,
        mensagem: 'Plano gerado com sucesso com base nas diretrizes clínicas do paciente.',
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const promptText = `
Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosPacienteFormatados}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    },
    { "dia": "Terça-feira", "refeicoes": { ... } },
    { "dia": "Quarta-feira", "refeicoes": { ... } },
    { "dia": "Quinta-feira", "refeicoes": { ... } },
    { "dia": "Sexta-feira", "refeicoes": { ... } },
    { "dia": "Sábado", "refeicoes": { ... } },
    { "dia": "Domingo", "refeicoes": { ... } }
  ]
}
    `.trim();

    // Modelos suportados com fallback automático
    const modelCandidates = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let generatedText = null;
    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: PLANO_SCHEMA,
            temperature: 0.6,
          },
        });

        const result = await model.generateContent(promptText);
        const response = await result.response;
        generatedText = response.text();
        if (generatedText) break;
      } catch (err) {
        console.warn(`Tentativa com modelo ${modelName} falhou:`, err.message);
        lastError = err;
      }
    }

    if (!generatedText) {
      console.warn('Chamadas ao Gemini falharam. Usando gerador clínico de fallback:', lastError?.message);
      const fallbackPlan = generateFallbackPlan(paciente);
      return res.status(200).json({
        success: true,
        origem: 'fallback_ia_indisponivel',
        plano: fallbackPlan,
        aviso: 'O plano foi gerado através das diretrizes clínicas do sistema devido à indisponibilidade momentânea da IA.',
      });
    }

    // Tratamento e validação do JSON retornado
    let parsedPlan = null;
    try {
      // Remove possíveis marcadores acidentais de markdown
      const cleaned = generatedText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedPlan = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Erro ao analisar JSON retornado pelo Gemini:', parseError, generatedText);
      const fallbackPlan = generateFallbackPlan(paciente);
      return res.status(200).json({
        success: true,
        origem: 'fallback_parse_error',
        plano: fallbackPlan,
      });
    }

    return res.status(200).json({
      success: true,
      origem: 'gemini_ia',
      plano: parsedPlan,
    });
  } catch (error) {
    console.error('Erro no servidor /api/gerar-plano:', error);
    return res.status(500).json({
      error: 'Erro interno ao gerar o plano alimentar.',
      detalhes: error.message,
    });
  }
}
