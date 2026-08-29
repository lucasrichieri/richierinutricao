// API de Integração com o Banco de Dados Neon (Richieri Nutrição)

const STORAGE_KEYS = {
  PACIENTES: 'richieri_pacientes',
  CONSULTAS: 'richieri_consultas',
  PLANOS: 'richieri_planos',
  PERFIL: 'richieri_perfil',
};

// Helper de LocalStorage para resiliência e cache
function getLocalData(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Erro ao salvar no cache local:', e);
  }
}

/**
 * Inicializa as tabelas no Neon caso ainda não tenham sido criadas
 */
export async function initDatabaseSchema(sql) {
  if (!sql) return;

  try {
    // Tabela nutricionistas
    await sql`
      CREATE TABLE IF NOT EXISTS nutricionistas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        crn TEXT,
        telefone TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Tabela pacientes
    await sql`
      CREATE TABLE IF NOT EXISTS pacientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nutricionista_id UUID,
        nome TEXT NOT NULL,
        data_nascimento DATE,
        sexo TEXT,
        whatsapp TEXT,
        email TEXT,
        peso_inicial NUMERIC,
        altura NUMERIC,
        objetivos TEXT[],
        objetivo_texto TEXT,
        nivel_atividade TEXT,
        patologias TEXT[],
        restricoes_alimentares TEXT[],
        alergias TEXT[],
        medicamentos TEXT,
        suplementos TEXT,
        refeicoes_por_dia INTEGER,
        horario_acorda TEXT,
        horario_dorme TEXT,
        litros_agua NUMERIC,
        atividade_fisica BOOLEAN DEFAULT FALSE,
        atividade_fisica_descricao TEXT,
        observacoes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Tabela consultas
    await sql`
      CREATE TABLE IF NOT EXISTS consultas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id UUID,
        data_consulta DATE NOT NULL,
        peso NUMERIC,
        cintura NUMERIC,
        quadril NUMERIC,
        percentual_gordura NUMERIC,
        observacoes TEXT,
        proximo_retorno DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Tabela planos_alimentares
    await sql`
      CREATE TABLE IF NOT EXISTS planos_alimentares (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id UUID,
        titulo TEXT,
        conteudo JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    console.log('Schema Neon verificado com sucesso.');
  } catch (err) {
    console.warn('Aviso ao inicializar schema Neon:', err.message);
  }
}

/* ==========================================================================
   NUTRICIONISTAS & PERFIL
   ========================================================================== */

export async function getPerfilNutricionista(sql, user) {
  if (!user) return null;
  const local = getLocalData(STORAGE_KEYS.PERFIL, null);

  if (!sql) {
    return local || {
      id: user.id,
      nome: user.name || 'Nutricionista',
      email: user.email,
      crn: 'CRN-3 12345/P',
      telefone: '(11) 99999-8888',
      especialidade: 'Nutrição Clínica & Esportiva',
    };
  }

  try {
    // Buscar por ID ou email
    const rows = await sql`
      SELECT * FROM nutricionistas WHERE id = ${user.id} OR email = ${user.email} LIMIT 1
    `;
    if (rows && rows.length > 0) {
      const perfil = rows[0];
      setLocalData(STORAGE_KEYS.PERFIL, perfil);
      return perfil;
    } else {
      // Cria registro se não existir, usando ON CONFLICT para evitar duplicatas
      const inserted = await sql`
        INSERT INTO nutricionistas (id, nome, email)
        VALUES (${user.id}, ${user.name || 'Nutricionista'}, ${user.email})
        ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email
        RETURNING *
      `;
      if (inserted && inserted.length > 0) {
        setLocalData(STORAGE_KEYS.PERFIL, inserted[0]);
        return inserted[0];
      }
    }
  } catch (err) {
    console.warn('Falha ao buscar perfil no Neon, usando cache:', err.message);
  }

  return local || {
    id: user.id,
    nome: user.name || 'Nutricionista',
    email: user.email,
    crn: 'CRN-3 12345/P',
    telefone: '(11) 99999-8888',
    especialidade: 'Nutrição Clínica & Esportiva',
  };
}

export async function updatePerfilNutricionista(sql, user, data) {
  const updated = { ...data, email: user.email };
  setLocalData(STORAGE_KEYS.PERFIL, updated);

  if (sql && user?.email) {
    try {
      await sql`
        UPDATE nutricionistas
        SET nome = ${data.nome}, crn = ${data.crn}, telefone = ${data.telefone}
        WHERE email = ${user.email}
      `;
    } catch (err) {
      console.warn('Erro ao atualizar perfil no Neon:', err.message);
    }
  }
  return updated;
}

/* ==========================================================================
   PACIENTES
   ========================================================================== */

export async function getPacientes(sql, nutricionistaId = null) {
  const local = getLocalData(STORAGE_KEYS.PACIENTES, []);
  if (!sql) {
    return nutricionistaId ? local.filter(p => !p.nutricionista_id || p.nutricionista_id === nutricionistaId) : local;
  }

  try {
    let rows;
    if (nutricionistaId) {
      rows = await sql`
        SELECT * FROM pacientes 
        WHERE nutricionista_id = ${nutricionistaId} OR nutricionista_id IS NULL 
        ORDER BY created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT * FROM pacientes ORDER BY created_at DESC
      `;
    }
    if (rows) {
      setLocalData(STORAGE_KEYS.PACIENTES, rows);
      return rows;
    }
  } catch (err) {
    console.warn('Falha ao buscar pacientes do Neon, usando cache:', err.message);
  }
  return local;
}

/**
 * Sincroniza pacientes existentes no localStorage para o banco Neon DB
 */
export async function syncLocalPacientesToNeon(sql, nutricionistaId = null) {
  if (!sql) return;
  const local = getLocalData(STORAGE_KEYS.PACIENTES, []);
  if (!local || local.length === 0) return;

  try {
    for (const p of local) {
      if (!p.nome) continue;
      // Verifica se o paciente já existe no Neon DB
      const existing = await sql`
        SELECT id FROM pacientes 
        WHERE (email IS NOT NULL AND email = ${p.email || ''}) 
           OR (nome = ${p.nome} AND (nutricionista_id = ${nutricionistaId || null} OR nutricionista_id IS NULL))
        LIMIT 1
      `;

      if (!existing || existing.length === 0) {
        const peso = p.peso_inicial && !isNaN(parseFloat(p.peso_inicial)) ? parseFloat(p.peso_inicial) : null;
        const alt = p.altura && !isNaN(parseFloat(p.altura)) ? parseFloat(p.altura) : null;
        const mef = p.refeicoes_por_dia ? parseInt(p.refeicoes_por_dia, 10) : null;
        const agua = p.litros_agua ? parseFloat(p.litros_agua) : null;
        const objs = Array.isArray(p.objetivos) ? p.objetivos : [];
        const pat = Array.isArray(p.patologias) ? p.patologias : [];
        const rest = Array.isArray(p.restricoes_alimentares) ? p.restricoes_alimentares : [];
        const alerg = Array.isArray(p.alergias) ? p.alergias : [];

        await sql`
          INSERT INTO pacientes (
            nutricionista_id, nome, data_nascimento, sexo, whatsapp, email,
            peso_inicial, altura, objetivos, objetivo_texto,
            nivel_atividade, patologias, restricoes_alimentares, alergias,
            medicamentos, suplementos, refeicoes_por_dia, horario_acorda,
            horario_dorme, litros_agua, atividade_fisica, atividade_fisica_descricao, observacoes
          ) VALUES (
            ${nutricionistaId || null}, ${p.nome}, ${p.data_nascimento || null}, ${p.sexo || null},
            ${p.whatsapp || p.telefone || null}, ${p.email || null}, ${peso},
            ${alt}, ${objs}, ${p.objetivo_texto || null},
            ${p.nivel_atividade || null}, ${pat}, ${rest},
            ${alerg}, ${p.medicamentos || null}, ${p.suplementos || null},
            ${mef}, ${p.horario_acorda || null}, ${p.horario_dorme || null},
            ${agua}, ${Boolean(p.atividade_fisica)}, ${p.atividade_fisica_descricao || null},
            ${p.observacoes || null}
          )
        `;
        console.log('Paciente do cache sincronizado com sucesso para o Neon DB:', p.nome);
      }
    }
  } catch (err) {
    console.warn('Aviso ao sincronizar pacientes do cache com Neon DB:', err.message);
  }
}

export async function createPaciente(sql, pacienteData, nutricionistaId = null) {
  const id = crypto.randomUUID ? crypto.randomUUID() : `pac_${Date.now()}`;
  const now = new Date().toISOString();

  // Tratamento dos tipos para inserção segura no PostgreSQL
  const peso = pacienteData.peso_inicial && !isNaN(parseFloat(pacienteData.peso_inicial)) ? parseFloat(pacienteData.peso_inicial) : null;
  const alt = pacienteData.altura && !isNaN(parseFloat(pacienteData.altura)) ? parseFloat(pacienteData.altura) : null;
  const mef = pacienteData.refeicoes_por_dia ? parseInt(pacienteData.refeicoes_por_dia, 10) : null;
  const agua = pacienteData.litros_agua ? parseFloat(pacienteData.litros_agua) : null;
  const dataNascimento = pacienteData.data_nascimento || null;
  const obs = pacienteData.observacoes || null;
  const atvDesc = pacienteData.atividade_fisica_descricao || null;
  const objTexto = pacienteData.objetivo_texto || null;
  const nivelAtiv = pacienteData.nivel_atividade || null;
  const med = pacienteData.medicamentos || null;
  const sup = pacienteData.suplementos || null;
  const horAcorda = pacienteData.horario_acorda || null;
  const horDorme = pacienteData.horario_dorme || null;
  const wpp = pacienteData.whatsapp || pacienteData.telefone || null;
  const em = pacienteData.email || null;
  const sx = pacienteData.sexo || null;

  const objs = Array.isArray(pacienteData.objetivos) ? pacienteData.objetivos : [];
  const pat = Array.isArray(pacienteData.patologias) ? pacienteData.patologias : [];
  const rest = Array.isArray(pacienteData.restricoes_alimentares) ? pacienteData.restricoes_alimentares : [];
  const alerg = Array.isArray(pacienteData.alergias) ? pacienteData.alergias : [];

  const newPatient = {
    id,
    nutricionista_id: nutricionistaId,
    ...pacienteData,
    peso_inicial: peso,
    altura: alt,
    refeicoes_por_dia: mef,
    litros_agua: agua,
    objetivos: objs,
    patologias: pat,
    restricoes_alimentares: rest,
    alergias: alerg,
    created_at: now,
  };

  // Salva no cache local
  const current = getLocalData(STORAGE_KEYS.PACIENTES, []);
  const updated = [newPatient, ...current];
  setLocalData(STORAGE_KEYS.PACIENTES, updated);

  if (sql) {
    try {
      const inserted = await sql`
        INSERT INTO pacientes (
          nutricionista_id, nome, data_nascimento, sexo, whatsapp, email,
          peso_inicial, altura, objetivos, objetivo_texto,
          nivel_atividade, patologias, restricoes_alimentares, alergias,
          medicamentos, suplementos, refeicoes_por_dia, horario_acorda,
          horario_dorme, litros_agua, atividade_fisica, atividade_fisica_descricao, observacoes
        ) VALUES (
          ${nutricionistaId || null}, ${pacienteData.nome}, ${dataNascimento}, ${sx},
          ${wpp}, ${em}, ${peso},
          ${alt}, ${objs}, ${objTexto},
          ${nivelAtiv}, ${pat}, ${rest},
          ${alerg}, ${med}, ${sup},
          ${mef}, ${horAcorda}, ${horDorme},
          ${agua}, ${Boolean(pacienteData.atividade_fisica)}, ${atvDesc},
          ${obs}
        ) RETURNING *
      `;
      if (inserted && inserted[0]) {
        const finalPatient = inserted[0];
        const syncList = updated.map(p => (p.id === id ? finalPatient : p));
        setLocalData(STORAGE_KEYS.PACIENTES, syncList);
        console.log('Paciente salvo com sucesso no Neon DB:', finalPatient.id);
        return finalPatient;
      }
    } catch (err) {
      console.error('Erro ao inserir paciente no Neon DB:', err);
    }
  }

  return newPatient;
}

export async function updatePaciente(sql, pacienteId, pacienteData) {
  const peso = pacienteData.peso_inicial && !isNaN(parseFloat(pacienteData.peso_inicial)) ? parseFloat(pacienteData.peso_inicial) : null;
  const alt = pacienteData.altura && !isNaN(parseFloat(pacienteData.altura)) ? parseFloat(pacienteData.altura) : null;
  const mef = pacienteData.refeicoes_por_dia ? parseInt(pacienteData.refeicoes_por_dia, 10) : null;
  const agua = pacienteData.litros_agua ? parseFloat(pacienteData.litros_agua) : null;
  const dataNascimento = pacienteData.data_nascimento || null;
  const obs = pacienteData.observacoes || null;
  const atvDesc = pacienteData.atividade_fisica_descricao || null;
  const objTexto = pacienteData.objetivo_texto || null;
  const nivelAtiv = pacienteData.nivel_atividade || null;
  const med = pacienteData.medicamentos || null;
  const sup = pacienteData.suplementos || null;
  const horAcorda = pacienteData.horario_acorda || null;
  const horDorme = pacienteData.horario_dorme || null;
  const wpp = pacienteData.whatsapp || pacienteData.telefone || null;
  const em = pacienteData.email || null;
  const sx = pacienteData.sexo || null;

  const objs = Array.isArray(pacienteData.objetivos) ? pacienteData.objetivos : [];
  const pat = Array.isArray(pacienteData.patologias) ? pacienteData.patologias : [];
  const rest = Array.isArray(pacienteData.restricoes_alimentares) ? pacienteData.restricoes_alimentares : [];
  const alerg = Array.isArray(pacienteData.alergias) ? pacienteData.alergias : [];

  const current = getLocalData(STORAGE_KEYS.PACIENTES, []);
  const updated = current.map(p => (p.id === pacienteId ? { ...p, ...pacienteData } : p));
  setLocalData(STORAGE_KEYS.PACIENTES, updated);

  if (sql) {
    try {
      await sql`
        UPDATE pacientes SET
          nome = ${pacienteData.nome},
          data_nascimento = ${dataNascimento},
          sexo = ${sx},
          whatsapp = ${wpp},
          email = ${em},
          peso_inicial = ${peso},
          altura = ${alt},
          objetivos = ${objs},
          objetivo_texto = ${objTexto},
          nivel_atividade = ${nivelAtiv},
          patologias = ${pat},
          restricoes_alimentares = ${rest},
          alergias = ${alerg},
          medicamentos = ${med},
          suplementos = ${sup},
          refeicoes_por_dia = ${mef},
          horario_acorda = ${horAcorda},
          horario_dorme = ${horDorme},
          litros_agua = ${agua},
          atividade_fisica = ${Boolean(pacienteData.atividade_fisica)},
          atividade_fisica_descricao = ${atvDesc},
          observacoes = ${obs}
        WHERE id = ${pacienteId}
      `;
    } catch (err) {
      console.error('Erro ao atualizar paciente no Neon DB:', err);
    }
  }
  return { id: pacienteId, ...pacienteData };
}

export async function deletePaciente(sql, pacienteId, pacienteEmail = null, pacienteNome = null) {
  // Remove do cache local
  const current = getLocalData(STORAGE_KEYS.PACIENTES, []);
  const filtered = current.filter(p => {
    if (p.id === pacienteId) return false;
    if (pacienteEmail && p.email === pacienteEmail) return false;
    if (pacienteNome && p.nome === pacienteNome) return false;
    return true;
  });
  setLocalData(STORAGE_KEYS.PACIENTES, filtered);

  // Remove também consultas e planos desse paciente do cache local
  const consultas = getLocalData(STORAGE_KEYS.CONSULTAS, []);
  setLocalData(STORAGE_KEYS.CONSULTAS, consultas.filter(c => c.paciente_id !== pacienteId));

  const planos = getLocalData(STORAGE_KEYS.PLANOS, []);
  setLocalData(STORAGE_KEYS.PLANOS, planos.filter(p => p.paciente_id !== pacienteId));

  if (sql) {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pacienteId);

      let targetId = pacienteId;
      if (!isUUID) {
        // Se o ID não for UUID (ex: criado offline), busca o UUID real no Neon DB
        const found = await sql`
          SELECT id FROM pacientes 
          WHERE (email IS NOT NULL AND email = ${pacienteEmail || ''}) 
             OR nome = ${pacienteNome || ''} 
          LIMIT 1
        `;
        if (found && found[0]) {
          targetId = found[0].id;
        }
      }

      if (targetId) {
        await sql`DELETE FROM planos_alimentares WHERE paciente_id = ${targetId}::uuid`;
        await sql`DELETE FROM consultas WHERE paciente_id = ${targetId}::uuid`;
        await sql`DELETE FROM pacientes WHERE id = ${targetId}::uuid`;
        console.log('Paciente excluído com sucesso do Neon DB:', targetId);
      }
    } catch (err) {
      console.error('Erro ao deletar paciente no Neon DB:', err);
    }
  }
  return true;
}

/* ==========================================================================
   CONSULTAS
   ========================================================================== */

export async function getConsultas(sql, pacienteId = null) {
  const local = getLocalData(STORAGE_KEYS.CONSULTAS, []);
  if (!sql) {
    return pacienteId ? local.filter(c => c.paciente_id === pacienteId) : local;
  }

  try {
    let rows;
    if (pacienteId) {
      rows = await sql`
        SELECT * FROM consultas WHERE paciente_id = ${pacienteId} ORDER BY data_consulta DESC
      `;
    } else {
      rows = await sql`
        SELECT c.*, p.nome as paciente_nome 
        FROM consultas c 
        LEFT JOIN pacientes p ON c.paciente_id = p.id 
        ORDER BY c.data_consulta DESC
      `;
    }
    if (rows) {
      if (!pacienteId) setLocalData(STORAGE_KEYS.CONSULTAS, rows);
      return rows;
    }
  } catch (err) {
    console.warn('Falha ao buscar consultas do Neon, usando cache:', err.message);
  }

  return pacienteId ? local.filter(c => c.paciente_id === pacienteId) : local;
}

export async function createConsulta(sql, consultaData) {
  const id = crypto.randomUUID ? crypto.randomUUID() : `cons_${Date.now()}`;
  const now = new Date().toISOString();

  const newConsulta = {
    id,
    ...consultaData,
    created_at: now,
  };

  const current = getLocalData(STORAGE_KEYS.CONSULTAS, []);
  const updated = [newConsulta, ...current];
  setLocalData(STORAGE_KEYS.CONSULTAS, updated);

  if (sql) {
    try {
      const inserted = await sql`
        INSERT INTO consultas (
          paciente_id, data_consulta, peso, cintura, quadril,
          percentual_gordura, observacoes, proximo_retorno
        ) VALUES (
          ${consultaData.paciente_id}, ${consultaData.data_consulta}, ${consultaData.peso || null},
          ${consultaData.cintura || null}, ${consultaData.quadril || null}, ${consultaData.percentual_gordura || null},
          ${consultaData.observacoes || null}, ${consultaData.proximo_retorno || null}
        ) RETURNING *
      `;
      if (inserted && inserted[0]) {
        const finalConsulta = inserted[0];
        const syncList = updated.map(c => (c.id === id ? finalConsulta : c));
        setLocalData(STORAGE_KEYS.CONSULTAS, syncList);
        return finalConsulta;
      }
    } catch (err) {
      console.warn('Erro ao inserir consulta no Neon, mantido localmente:', err.message);
    }
  }

  return newConsulta;
}

export async function deleteConsulta(sql, consultaId) {
  const current = getLocalData(STORAGE_KEYS.CONSULTAS, []);
  setLocalData(STORAGE_KEYS.CONSULTAS, current.filter(c => c.id !== consultaId));

  if (sql) {
    try {
      await sql`DELETE FROM consultas WHERE id = ${consultaId}`;
    } catch (err) {
      console.warn('Erro ao excluir consulta no Neon:', err.message);
    }
  }
  return true;
}

/* ==========================================================================
   PLANOS ALIMENTARES
   ========================================================================== */

export async function getPlanosAlimentares(sql, pacienteId = null) {
  const local = getLocalData(STORAGE_KEYS.PLANOS, []);
  if (!sql) {
    return pacienteId ? local.filter(p => p.paciente_id === pacienteId) : local;
  }

  try {
    let rows;
    if (pacienteId) {
      rows = await sql`
        SELECT * FROM planos_alimentares WHERE paciente_id = ${pacienteId} ORDER BY created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT pl.*, p.nome as paciente_nome 
        FROM planos_alimentares pl 
        LEFT JOIN pacientes p ON pl.paciente_id = p.id 
        ORDER BY pl.created_at DESC
      `;
    }
    if (rows) {
      if (!pacienteId) setLocalData(STORAGE_KEYS.PLANOS, rows);
      return rows;
    }
  } catch (err) {
    console.warn('Falha ao buscar planos alimentares do Neon, usando cache:', err.message);
  }

  return pacienteId ? local.filter(p => p.paciente_id === pacienteId) : local;
}

export async function createPlanoAlimentar(sql, planoData) {
  const id = crypto.randomUUID ? crypto.randomUUID() : `pln_${Date.now()}`;
  const now = new Date().toISOString();

  const newPlano = {
    id,
    ...planoData,
    created_at: now,
  };

  const current = getLocalData(STORAGE_KEYS.PLANOS, []);
  const updated = [newPlano, ...current];
  setLocalData(STORAGE_KEYS.PLANOS, updated);

  if (sql) {
    try {
      const conteudoJson = typeof planoData.conteudo === 'string' ? planoData.conteudo : JSON.stringify(planoData.conteudo);
      const inserted = await sql`
        INSERT INTO planos_alimentares (
          paciente_id, titulo, conteudo
        ) VALUES (
          ${planoData.paciente_id}, ${planoData.titulo || 'Plano Alimentar'}, ${conteudoJson}::jsonb
        ) RETURNING *
      `;
      if (inserted && inserted[0]) {
        const finalPlano = inserted[0];
        const syncList = updated.map(p => (p.id === id ? finalPlano : p));
        setLocalData(STORAGE_KEYS.PLANOS, syncList);
        return finalPlano;
      }
    } catch (err) {
      console.warn('Erro ao inserir plano alimentar no Neon:', err.message);
    }
  }

  return newPlano;
}

export async function updatePlanoAlimentar(sql, planoId, planoData) {
  const current = getLocalData(STORAGE_KEYS.PLANOS, []);
  const updated = current.map(p => (p.id === planoId ? { ...p, ...planoData } : p));
  setLocalData(STORAGE_KEYS.PLANOS, updated);

  if (sql) {
    try {
      const conteudoJson = typeof planoData.conteudo === 'string' ? planoData.conteudo : JSON.stringify(planoData.conteudo);
      await sql`
        UPDATE planos_alimentares SET
          titulo = ${planoData.titulo || 'Plano Alimentar'},
          conteudo = ${conteudoJson}::jsonb
        WHERE id = ${planoId}
      `;
    } catch (err) {
      console.warn('Erro ao atualizar plano alimentar no Neon:', err.message);
    }
  }
  return { id: planoId, ...planoData };
}

export async function deletePlanoAlimentar(sql, planoId) {
  const current = getLocalData(STORAGE_KEYS.PLANOS, []);
  setLocalData(STORAGE_KEYS.PLANOS, current.filter(p => p.id !== planoId));

  if (sql) {
    try {
      await sql`DELETE FROM planos_alimentares WHERE id = ${planoId}`;
    } catch (err) {
      console.warn('Erro ao excluir plano alimentar no Neon:', err.message);
    }
  }
  return true;
}
