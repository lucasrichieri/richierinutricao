export const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export const REFEICOES_NOMES = [
  { key: 'cafe_da_manha', label: '☕ Café da Manhã', icon: '☕' },
  { key: 'lanche_manha', label: '🍎 Lanche da Manhã', icon: '🍎' },
  { key: 'almoco', label: '🍲 Almoço', icon: '🍲' },
  { key: 'lanche_tarde', label: '🥪 Lanche da Tarde', icon: '🥪' },
  { key: 'jantar', label: '🥗 Jantar', icon: '🥗' },
];

/**
 * Gerador de Plano Clínico Dinâmico e 100% Variado (7 Dias Únicos)
 */
export function generateDynamicClinicalPlan(paciente = {}) {
  const restricoes = Array.isArray(paciente.restricoes_alimentares) ? paciente.restricoes_alimentares.join(', ') : '';
  const alergias = Array.isArray(paciente.alergias) ? paciente.alergias.join(', ') : '';
  const objetivos = Array.isArray(paciente.objetivos) ? paciente.objetivos.join(', ') : (paciente.objetivo_texto || '');

  const textLower = (restricoes + ' ' + alergias + ' ' + objetivos).toLowerCase();

  const isSemLactose = textLower.includes('lactose') || textLower.includes('leite');
  const isSemGluten = textLower.includes('glúten') || textLower.includes('trigo') || textLower.includes('celíac');
  const isVegetariano = textLower.includes('vegetariano') || textLower.includes('vegano') || textLower.includes('carne vermelha');
  const isHipertrofia = textLower.includes('massa') || textLower.includes('hipertrofia') || textLower.includes('muscul');
  const isDiabetes = textLower.includes('diabetes') || textLower.includes('glicemia');

  const iogurte = isSemLactose ? 'Bebida vegetal de coco/amêndoas (200ml)' : 'Iogurte natural desnatado ou grego (160g)';
  const queijo = isSemLactose ? 'Tofu temperado com orégano e azeite (50g)' : 'Queijo minas frescal ou cottage (2 fatias)';
  const pao1 = isSemGluten ? 'Tapioca de frigideira com chia (2 colheres de goma)' : 'Pão 100% integral artesanal (2 fatias)';
  const pao2 = isSemGluten ? 'Crepioca leve (1 ovo + 1 colher de polvilho/tapioca)' : 'Pão sírio integral com gergelim (1 unidade)';

  const cardapiosDias = {
    'Segunda-feira': {
      cafe_da_manha: [
        'Ovos mexidos com azeite de oliva e orégano (2 unidades)',
        pao1,
        'Mamão papaya em cubos com sementes de chia (1 fatia média)',
        'Café preto ou chá verde sem açúcar (1 xícara)',
        queijo,
      ],
      lanche_manha: [
        'Maçã Fuji fatiada com canela em pó (1 unidade)',
        'Castanhas-do-Pará (2 unidades)',
        'Chá de hortelã ou camomila sem açúcar (200ml)',
        'Água aromatizada com rodelas de limão e hortelã',
        'Sementes de abóbora tostadas (1 colher de sobremesa)',
      ],
      almoco: [
        'Mix de folhas verdes (alface americana, rúcula e agrião) com azeite extravirgem',
        'Legumes no vapor (brócolis, cenoura baby e abobrinha - 1 prato de sobremesa)',
        'Arroz integral com gergelim (3 colheres de sopa)',
        'Feijão carioca com louro e pouco sal (1 concha média)',
        isVegetariano ? 'Tofu grelhado com cogumelos shimeji (150g)' : 'Peito de frango grelhado com ervas finas (140g)',
      ],
      lanche_tarde: [
        iogurte,
        'Aveia em flocos finos (2 colheres de sopa)',
        'Morangos frescos ou amoras (1 xícara)',
        'Canela do Ceilão em pó a gosto',
        'Sementes de girassol sem sal (1 colher de chá)',
      ],
      jantar: [
        'Salada colorida com tomate cereja, pepino japonês e palmito',
        isVegetariano ? 'Omelete de forno com espinafre e ricota (2 ovos)' : 'Filé de pescada branca grelhada com limão (140g)',
        'Purê rústico de abóbora cabotiá com noz-moscada (3 colheres de sopa)',
        'Sopa de legumes variados com azeite (1 prato fundo)',
        'Chá de erva-doce morno para digestão (200ml)',
      ],
    },
    'Terça-feira': {
      cafe_da_manha: [
        pao2,
        'Ovos poché com páprica doce (2 unidades)',
        'Banana prata amassada com sementes de linhaça dourada (1 unidade)',
        'Café passado ou chá de hibisco sem açúcar (1 xícara)',
        isSemLactose ? 'Pasta de amendoim integral sem açúcar (1 colher)' : 'Requeijão light ou cottage (1 colher de sopa)',
      ],
      lanche_manha: [
        'Pera Williams fresca (1 unidade)',
        'Nozes chilenas selecionadas (3 metades)',
        'Água de coco natural (200ml)',
        'Chá de capim-santo morno (200ml)',
        'Mix de sementes (chia + gergelim)',
      ],
      almoco: [
        'Salada de acelga crocante com tomate e rabanete laminado',
        'Mix de legumes assados ao forno com alecrim (abóbora, berinjela e cebola roxa)',
        'Batata-doce assada em rodelas (100g)',
        'Feijão preto cozido com alho e azeite (1 concha média)',
        isVegetariano ? 'Hambúrguer caseiro de grão-de-bico com ervas (2 unidades)' : 'Filé de tilápia grelhada ao molho de ervas e alcaparras (150g)',
      ],
      lanche_tarde: [
        isHipertrofia ? 'Shake proteico batido com água de coco, banana e cacau 100%' : 'Smoothie verde batido com maçã, couve e gengibre (250ml)',
        'Torrada 100% integral (1 unidade)',
        isSemLactose ? 'Pasta de homus de grão-de-bico (1 colher de sopa)' : 'Cottage temperado com cúrcuma (2 colheres)',
        'Chá verde com raspas de limão (200ml)',
        'Amêndoas torradas sem sal (6 unidades)',
      ],
      jantar: [
        'Mix de folhas escuras (espinafre cru, alface roxa e brotos)',
        'Omelete recheada com tomate, orégano e manjericão fresco (2 ovos)',
        'Creme leve de mandioquinha ou courgette com azeite (1 concha)',
        'Brócolis e couve-flor salteados no alho (1 xícara)',
        'Chá de camomila com maracujá (200ml)',
      ],
    },
    'Quarta-feira': {
      cafe_da_manha: [
        'Waffle ou panqueca fit de aveia com 1 ovo e canela',
        'Morangos ou frutas vermelhas frescas (1/2 xícara)',
        'Iogurte natural ou vegetal para acompanhar (3 colheres)',
        'Café com canela sem açúcar (1 xícara)',
        'Sementes de abóbora (1 colher de chá)',
      ],
      lanche_manha: [
        'Kiwi fatiado ou mexerica (1 unidade)',
        'Castanha de caju torrada sem sal (4 unidades)',
        'Chá de gengibre com limão (200ml)',
        'Água mineral com hortelã fresco (300ml)',
        'Lascas de coco seco in natura (1 colher de sopa)',
      ],
      almoco: [
        'Salada mediterrânea: alface, pepino, azeitonas pretas picadas e azeite',
        'Vagem e cenoura cozidas com azeite e ervas (1 prato de sobremesa)',
        'Quinoa cozida em caldo de legumes ou Arroz 7 grãos (3 colheres de sopa)',
        'Lentilha cozida com legumes (1 concha média)',
        isVegetariano ? 'Ovos cozidos caipiras com páprica (2 unidades)' : (isDiabetes ? 'Patinho moído refogado com abobrinha (130g)' : 'Iscas de carne magra acebolada (130g)'),
      ],
      lanche_tarde: [
        'Salada de frutas variadas (melão, morango, maçã) com canela (1 bowl)',
        'Farelo de aveia ou psyllium (1 colher de sopa)',
        iogurte,
        'Chá branco ou chá de melissa (200ml)',
        'Castanhas picadas (1 colher de sobremesa)',
      ],
      jantar: [
        'Mix de folhas verdes com palmito e tomate cereja',
        isVegetariano ? 'Cogumelos Paris salteados com azeite e alho-poró (150g)' : 'Sobrecoxa de frango sem pele assada com ervas e limão (130g)',
        'Abobrinha italiana grelhada com alecrim (1 prato de sobremesa)',
        'Sopa reconfortante de legumes com gengibre (1 prato fundo)',
        'Chá de cidreira morno (200ml)',
      ],
    },
    'Quinta-feira': {
      cafe_da_manha: [
        'Ovos mexidos com tomate cereja e manjericão fresco (2 unidades)',
        pao1,
        'Abacate em lâminas com azeite e sal rosa (2 fatias finas)',
        'Melão amarelo em cubos com raspas de limão (1 fatia grande)',
        'Café expresso ou chá verde puro (1 xícara)',
      ],
      lanche_manha: [
        'Ameixa fresca ou pêssego (2 unidades)',
        'Mix de sementes de girassol e chia (1 colher de sopa)',
        'Água de coco verde natural (200ml)',
        'Chá de folhas de oliveira ou hibisco (200ml)',
        'Nozes selecionadas (2 unidades)',
      ],
      almoco: [
        'Salada crocante: alface crespa, agrião, cenoura ralada e sementes de gergelim',
        'Espinafre refogado no azeite com alho (1 xícara cheia)',
        'Arroz integral com cúrcuma e salsinha (3 colheres de sopa)',
        'Feijão fradinho ou carioca temperado (1 concha média)',
        isVegetariano ? 'Torta proteica de grão-de-bico com espinafre (1 fatia)' : 'Filé de peito de frango marinado na mostarda dijon e grelhado (140g)',
      ],
      lanche_tarde: [
        'Vitamina batida de leite vegetal ou desnatado com mamão e aveia (250ml)',
        'Canela em pó polvilhada',
        'Torrada integral multigrãos (1 fatia)',
        queijo,
        'Chá de hortelã fresco (200ml)',
      ],
      jantar: [
        'Salada verde com tiras de pepino e sementes de chia',
        isVegetariano ? 'Omelete de legumes com abobrinha e tomate (2 ovos)' : 'Filé de salmão ou pescada grelhada com crosta de gergelim (140g)',
        'Purê leve de couve-flor com azeite e noz-moscada (3 colheres)',
        'Sopa de abóbora com gengibre e cúrcuma (1 prato fundo)',
        'Chá de melissa e camomila (200ml)',
      ],
    },
    'Sexta-feira': {
      cafe_da_manha: [
        pao2,
        'Ovos mexidos cremosos com azeite (2 ovos)',
        'Mamão papaia com sementes de linhaça (1 porção)',
        queijo,
        'Café preto ou chá de ervas (1 xícara)',
      ],
      lanche_manha: [
        'Goiaba vermelha ou maçã verde (1 unidade)',
        'Castanhas-do-Pará frescas (2 unidades)',
        'Chá verde gelado com hortelã e limão (250ml)',
        'Água mineral com rodelas de pepino e gengibre (300ml)',
        'Sementes de chia hidratadas',
      ],
      almoco: [
        'Salada colorida: rúcula, alface americana, beterraba ralada e tomate',
        'Legumes grelhados (abobrinha, berinjela e pimentão amarelo com azeite)',
        'Mandioca cozida ou batata-doce assada (100g)',
        'Feijão preto com louro (1 concha média)',
        isVegetariano ? 'Estrogonofe saudável de cogumelos com leite de aveia (1 concha)' : 'Cubos de alcatra magra salteados com brócolis e cebola (130g)',
      ],
      lanche_tarde: [
        iogurte,
        'Mirtilos frescos ou morangos picados (1/2 xícara)',
        'Granola artesanal sem açúcar e sem glúten (1 colher de sopa)',
        'Sementes de abóbora (1 colher de chá)',
        'Chá de capim-limão morno (200ml)',
      ],
      jantar: [
        'Salada especial de folhas nobres com palmito e azeitonas',
        isVegetariano ? 'Tofu assado em cubos crocantes com ervas (150g)' : 'Hambúrguer caseiro de patinho ou frango feito na grelha (140g)',
        'Brócolis ao alho e óleo de coco ou azeite (1 prato de sobremesa)',
        'Creme de cenoura com gengibre (1 prato fundo)',
        'Chá de maracujá com camomila para relaxar (200ml)',
      ],
    },
    'Sábado': {
      cafe_da_manha: [
        'Cuscuz nordestino de milho hidratado com azeite (1 porção)',
        'Ovos mexidos ou estalados na água (2 unidades)',
        queijo,
        'Fatias de abacaxi com folhas de hortelã fresca (2 fatias)',
        'Café fresco sem açúcar (1 xícara)',
      ],
      lanche_manha: [
        'Saladinha de frutas cítricas (laranja, morango e kiwi) (1 bowl)',
        'Mix de nozes e castanhas de caju (1 punhado pequeno)',
        'Água de coco natural (250ml)',
        'Chá de hibisco com casca de laranja (200ml)',
        'Sementes de gergelim tostado',
      ],
      almoco: [
        'Salada tropical: mix de folhas verdes, manga em cubos e tomate cereja',
        'Couve à mineira refogada com pouco azeite e alho (1 xícara)',
        'Arroz integral soltinho (3 colheres de sopa)',
        'Feijão carioca fresquinho (1 concha)',
        isVegetariano ? 'Moqueca vegetariana de palmito, banana-da-terra e pimentões (1 concha grande)' : 'Peixe assado ao forno com rodelas de tomate, cebola e pimentão (160g)',
      ],
      lanche_tarde: [
        'Sanduíche natural no pão integral com patê de atum/ricota, cenoura ralada e rúcula (1 unidade)',
        'Suco de uva integral diluído em água com gás (200ml)',
        'Fruta fresca (maçã ou banana)',
        'Chá de hortelã com erva-doce (200ml)',
        'Castanhas selecionadas (2 unidades)',
      ],
      jantar: [
        'Carpaccio de abobrinha com azeite extravirgem, limão e parmesão/levedura',
        'Omelete de claras com tomate, espinafre e orégano (3 claras + 1 gema)',
        'Purê rústico de mandioquinha ou inhame (2 colheres de sopa)',
        'Sopa cremosa de legumes com frango desfiado (1 prato fundo)',
        'Chá de melissa morno (200ml)',
      ],
    },
    'Domingo': {
      cafe_da_manha: [
        'Panqueca americana fit de banana, aveia e cacau 100% com 1 ovo',
        'Morangos frescos fatiados por cima (1 xícara)',
        iogurte,
        'Café com canela ou cappuccino caseiro com leite desnatado/vegetal (1 xícara)',
        'Sementes de chia polvilhadas (1 colher de chá)',
      ],
      lanche_manha: [
        'Melancia fresca em cubos (1 fatia média)',
        'Castanhas-do-Pará (2 unidades)',
        'Água saborizada com morango, hortelã e limão (300ml)',
        'Chá branco com gengibre (200ml)',
        'Mix de sementes crocantes (1 colher de sobremesa)',
      ],
      almoco: [
        'Salada Caesar saudável: alface romana, croutons 100% integrais e molho de iogurte com ervas',
        'Aspargos e tomatinhos assados no azeite com alho (1 prato de sobremesa)',
        'Arroz integral com amêndoas laminadas (3 colheres de sopa)',
        'Feijão preto ou lentilha especial de domingo (1 concha)',
        isVegetariano ? 'Risoto integral de cogumelos variados com azeite trufado (1 prato)' : 'Filé mignon grelhado ou filé de salmão ao forno com alecrim (150g)',
      ],
      lanche_tarde: [
        'Bolo fit caseiro de banana com aveia e canela (1 fatia média)',
        'Chá de frutas vermelhas ou chá verde (200ml)',
        'Iogurte com gotas de extrato de baunilha',
        'Mix de nozes e amêndoas (4 unidades)',
        'Água fresca com limão espremido (300ml)',
      ],
      jantar: [
        'Mix de folhas verdes com tomate seco e brotos frescos',
        isVegetariano ? 'Omelete de cogumelos com cheiro-verde e azeite (2 ovos)' : 'Frango desfiado com legumes salteados na frigideira (140g)',
        'Creme reconfortante de abóbora cabotiá com gengibre e sementes (1 prato fundo)',
        'Legumes assados no vapor (cenoura, abobrinha e vagem)',
        'Chá relaxante de camomila, erva-cidreira e maracujá (200ml)',
      ],
    },
  };

  return {
    plano_semanal: DIAS_SEMANA.map((dia) => ({
      dia,
      refeicoes: cardapiosDias[dia] || cardapiosDias['Segunda-feira'],
    })),
  };
}
